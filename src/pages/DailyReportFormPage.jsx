import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, ConfirmDialog, DateInput, Field, LoadingState, Modal, PageHeader, SearchSelect, SectionCard, SelectInput, TextInput,
} from '@/components/common';
import {
  MANAGERS, OPERATORS, WORKERS, TIPPERS, WEIGHT_UNITS, SHIFTS,
  PAYMENT_METHODS, EXPENSE_TYPES,
  STOP_REASONS,
} from '@/data/mockData';
import { getMaterials } from '@/services/materialsService';
import { addCrusher, getReport, listCrushers, listCustomers, saveReport } from '@/services/reportsService';
import { findOrCreateQuarry } from '@/services/quarriesService';
import { findOrCreateTruck } from '@/services/trucksService';
import { findOrCreateCustomer } from '@/services/customersService';
import { findOrCreateWorker, getWorkerByName } from '@/services/workersService';
import { newId, todayISO, formatMoney, formatNumberAr } from '@/utils/reportUtils';

const emptyReport = () => ({
  date: todayISO(),
  managers: [''],
  shifts: [],
  raw: { type: '', weight: '', unit: 'طن', crusher: '', quarryId: '', price: '' },
  tippers: [{ id: newId('t'), name: '', weight: '', rate: '', paid: '' }],
  operatingHours: [{ id: newId('oh'), runStart: '', runEnd: '', stopHours: '', stopReason: '' }],
  shiftTeams: [{ id: newId('st'), operator: '', workersCount: '', workers: [{ workerId: '', name: '', hours: '', dailyAmount: '', paid: '' }] }],
  production: [{ id: newId('p'), fineness: '', hours: '', packaging: '', customer: '' }],
  loading: [{ id: newId('l'), fineness: '', weight: '', customer: '', packaging: '', price: '', payment: 'نقدي', paid: '', remaining: '' }],
  expenses: [{ id: newId('e'), category: '', type: '', amount: '', entity: '', notes: '' }],
});

function RowActions({ onRemove, disabled }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={disabled}
      title="حذف"
      className="h-11 rounded-md border border-border px-3 text-destructive hover:bg-destructive/10 disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

/** يحسب فرق الساعات بين وقتين HH:MM، مع مراعاة العبور لليوم التالي */
function hoursBetween(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}

const SHIFT_ORDINALS = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];
const shiftTeamLabel = (idx) => `الوردية ${SHIFT_ORDINALS[idx] || `رقم ${idx + 1}`}`;
const emptyShiftTeam = () => ({ id: newId('st'), operator: '', workersCount: '', workers: [{ workerId: '', name: '', hours: '', dailyAmount: '', paid: '' }] });

export default function DailyReportFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyReport);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [crushers, setCrushers] = useState([]);
  const [crusherModal, setCrusherModal] = useState(false);
  const [newCrusher, setNewCrusher] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState({ rawTypes: [], fineness: [], packagingProduction: [], packagingLoading: [], vehicleTypes: [] });
  const { rawTypes: RAW_TYPES, fineness: FINENESS, packagingProduction: PACKAGING_PRODUCTION, packagingLoading: PACKAGING_LOADING, vehicleTypes: VEHICLE_TYPES } = materials;

  useEffect(() => {
    listCustomers().then(setCustomers);
    listCrushers().then(setCrushers);
    getMaterials().then(setMaterials);
  }, []);

  useEffect(() => {
    if (!id) return;
    getReport(id).then((r) => {
      if (r) {
        setForm({
          ...emptyReport(),
          ...r,
          raw: { ...emptyReport().raw, ...r.raw },
          loading: (r.loading || []).length
            ? r.loading.map((l) => ({
                driverName: '', vehiclePlateNumber: '', driverIdNumber: '', vehicleType: '', // افتراضي للتقارير القديمة التي لا تحتوي هذه الحقول
                ...l,
              }))
            : emptyReport().loading,
          operatingHours: r.operatingHours?.length ? r.operatingHours : emptyReport().operatingHours,
          shiftTeams: r.shiftTeams?.length
            ? r.shiftTeams
            : [{
                id: newId('st'),
                operator: r.operator || '',
                workersCount: r.workersCount || '',
                workers: (r.workers || []).length
                  ? r.workers.map((w) => (typeof w === 'string' ? { workerId: '', name: w, hours: '', dailyAmount: '', paid: '' } : w))
                  : [{ workerId: '', name: '', hours: '', dailyAmount: '', paid: '' }],
              }],
        });
      }
      setLoading(false);
    });
  }, [id]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setList = (key, idx, patch) =>
    setForm((f) => ({ ...f, [key]: f[key].map((item, i) => (i === idx ? { ...item, ...patch } : item)) }));
  const addItem = (key, item) => setForm((f) => ({ ...f, [key]: [...f[key], item] }));
  const removeItem = (key, idx) => setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));

  // ——— أدوات فرق التشغيل (مشغل + عمال) لكل وردية ———
  const setTeam = (teamIdx, patch) =>
    setForm((f) => ({ ...f, shiftTeams: f.shiftTeams.map((t, i) => (i === teamIdx ? { ...t, ...patch } : t)) }));
  const addTeam = () => setForm((f) => ({ ...f, shiftTeams: [...f.shiftTeams, emptyShiftTeam()] }));
  const removeTeam = (teamIdx) => setForm((f) => ({ ...f, shiftTeams: f.shiftTeams.filter((_, i) => i !== teamIdx) }));
  const setTeamWorker = (teamIdx, workerIdx, patch) =>
    setForm((f) => ({
      ...f,
      shiftTeams: f.shiftTeams.map((t, i) =>
        i !== teamIdx ? t : { ...t, workers: t.workers.map((w, j) => (j === workerIdx ? { ...w, ...patch } : w)) },
      ),
    }));
  const addTeamWorker = (teamIdx) =>
    setForm((f) => ({
      ...f,
      shiftTeams: f.shiftTeams.map((t, i) =>
        i !== teamIdx ? t : { ...t, workers: [...t.workers, { workerId: '', name: '', hours: '', dailyAmount: '', paid: '' }] },
      ),
    }));
  const removeTeamWorker = (teamIdx, workerIdx) =>
    setForm((f) => ({
      ...f,
      shiftTeams: f.shiftTeams.map((t, i) => (i !== teamIdx ? t : { ...t, workers: t.workers.filter((_, j) => j !== workerIdx) })),
    }));

  const toggleShift = (s) =>
    setForm((f) => ({ ...f, shifts: f.shifts.includes(s) ? f.shifts.filter((x) => x !== s) : [...f.shifts, s] }));

  // زر/Submit الفورم لا يحفظ مباشرة — فقط يفتح نافذة تأكيد الحفظ (الحفظ الفعلي في confirmSave)
  const handleSave = (e) => {
    e.preventDefault();
    setConfirmSaveOpen(true);
  };

  // يمنع Enter داخل أي حقل من عمل Submit للفورم بالكامل — بدلًا من ذلك ينقل التركيز
  // للحقل المنطقي التالي (أو يُنهي التحرير في آخر حقل)، ولا يحفظ أو يرسل أي شيء إطلاقًا.
  const handleFormKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const target = e.target;
    if (target.tagName === 'TEXTAREA') return; // نسمح بسطر جديد داخل textarea
    if (target.tagName === 'BUTTON' || target.type === 'submit') return; // أزرار الفورم تتصرف بشكل طبيعي (لا تحفظ مباشرة أصلًا الآن)
    e.preventDefault();
    e.stopPropagation();

    const focusable = Array.from(
      e.currentTarget.querySelectorAll('input:not([type="hidden"]), select, textarea'),
    ).filter((el) => !el.disabled && el.tabIndex !== -1 && el.offsetParent !== null);
    const idx = focusable.indexOf(target);
    if (idx > -1 && idx < focusable.length - 1) {
      focusable[idx + 1].focus();
    } else {
      target.blur();
    }
  };

  // الحفظ الفعلي — يُنفَّذ فقط بعد تأكيد المستخدم من نافذة التأكيد
  const confirmSave = async () => {
    setConfirmSaveOpen(false);
    setSaving(true);

    // ——— ربط البيانات بمعرّفات (IDs) قبل الحفظ ———
    let quarryId = form.raw.quarryId || '';
    if (form.raw.crusher?.trim()) {
      quarryId = (await findOrCreateQuarry(form.raw.crusher.trim())).id;
    }

    const tippers = await Promise.all(
      form.tippers
        .filter((t) => t.name?.trim())
        .map(async (t) => {
          const truckId = (await findOrCreateTruck(t.name.trim())).id;
          const total = (Number(t.weight) || 0) * (Number(t.rate) || 0);
          const paid = Number(t.paid) || 0;
          return { ...t, truckId, total, paid, remaining: Math.max(total - paid, 0) };
        }),
    );

    const operatingHours = form.operatingHours
      .filter((h) => h.runStart || h.runEnd || h.stopHours)
      .map((h) => ({ ...h, runHours: hoursBetween(h.runStart, h.runEnd) }));

    // ——— فرق التشغيل (مشغل + عمال) لكل وردية ———
    const shiftTeams = await Promise.all(
      form.shiftTeams.map(async (team) => ({
        ...team,
        workers: await Promise.all(
          team.workers
            .filter((w) => w.name?.trim())
            .map(async (w) => {
              const workerId = (await findOrCreateWorker(w.name.trim())).id;
              const dailyAmount = Number(w.dailyAmount) || 0;
              const paid = Number(w.paid) || 0;
              return { ...w, workerId, dailyAmount, paid, remaining: Math.max(dailyAmount - paid, 0) };
            }),
        ),
      })),
    ).then((teams) => teams.filter((team) => team.operator?.trim() || team.workers.length > 0));

    // ——— حقول مجمّعة متوافقة مع الصفحات القديمة (الرئيسية، التقرير الأسبوعي...) ———
    const operator = shiftTeams[0]?.operator || '';
    const workersCount = shiftTeams.reduce((s, t) => s + (Number(t.workersCount) || t.workers.length || 0), 0);
    const workers = shiftTeams.flatMap((t) => t.workers);

    const production = await Promise.all(
      form.production
        .filter((p) => p.fineness || p.customer)
        .map(async (p) => ({
          ...p,
          customerId: p.customer?.trim() ? (await findOrCreateCustomer(p.customer.trim())).id : '',
        })),
    );

    const loadingList = await Promise.all(
      form.loading
        .filter((l) => l.fineness || l.customer)
        .map(async (l) => {
          const customerId = l.customer?.trim() ? (await findOrCreateCustomer(l.customer.trim())).id : '';
          const total = (Number(l.weight) || 0) * (Number(l.price) || 0);
          if (l.payment === 'نقدي') {
            return { ...l, customerId, paid: total, remaining: 0 };
          }
          const paid = Number(l.paid) || 0;
          return { ...l, customerId, paid, remaining: Math.max(total - paid, 0) };
        }),
    );

    const expenses = form.expenses.filter((x) => x.type || x.amount || x.category);

    const payload = {
      ...form,
      managers: form.managers.filter(Boolean),
      raw: { ...form.raw, quarryId },
      tippers,
      operatingHours,
      shiftTeams,
      operator,
      workersCount,
      workers,
      production,
      loading: loadingList,
      expenses,
    };
    const saved = await saveReport(payload);
    setSaving(false);
    setSavedId(saved.id);
    listCustomers().then(setCustomers); // تحديث قائمة العملاء فورًا لو تم إنشاء عميل جديد أثناء الحفظ
    toast.success('تم حفظ التقرير اليومي بنجاح');
  };

  if (loading) return <LoadingState />;

  return (
    <>
      <Helmet>
        <title>{id ? 'تعديل تقرير يومي' : 'تقرير يومي جديد'} — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="نموذج إنشاء وتعديل التقرير اليومي لتشغيل مصنع كربونات الكالسيوم." />
      </Helmet>

      <PageHeader
        title={id ? 'تعديل التقرير اليومي' : 'تقرير يومي جديد'}
        subtitle="سجّل بيانات التشغيل الكاملة لليوم"
        breadcrumb={[
          { label: 'الرئيسية', to: '/' },
          { label: 'التقرير اليومي', to: '/operations/daily-reports' },
          { label: id ? 'تعديل' : 'جديد' },
        ]}
      />

      <form onSubmit={handleSave} onKeyDown={handleFormKeyDown} className="space-y-6 pb-8">
        <SectionCard title="التاريخ ومديرو المصنع">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="التاريخ">
              <DateInput value={form.date} onChange={(e) => set({ date: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 space-y-3">
            {form.managers.map((m, i) => (
              <div key={`mgr-${i}`} className="flex gap-2">
                <SearchSelect
                  className="flex-1"
                  options={MANAGERS}
                  value={m}
                  onChange={(v) => setForm((f) => ({ ...f, managers: f.managers.map((x, j) => (j === i ? v : x)) }))}
                  placeholder="اسم المدير"
                />
                <RowActions onRemove={() => removeItem('managers', i)} disabled={form.managers.length === 1} />
              </div>
            ))}
            <Button variant="secondary" onClick={() => addItem('managers', '')}>
              <Plus className="h-4 w-4" /> إضافة مدير
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="الورديات" description="يمكن اختيار أكثر من وردية">
          <div className="flex flex-wrap gap-2">
            {SHIFTS.map((s) => {
              const active = form.shifts.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleShift(s)}
                  className={
                    active
                      ? 'rounded-md border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground'
                      : 'rounded-md border border-border bg-card px-4 py-2.5 text-sm hover:bg-secondary'
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="الخامة"
          actions={
            <Button variant="secondary" onClick={() => setCrusherModal(true)}>
              <Plus className="h-4 w-4" /> إضافة كسارة جديدة
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="نوع الخامة">
              <SelectInput
                options={RAW_TYPES}
                value={form.raw.type}
                onChange={(e) => set({ raw: { ...form.raw, type: e.target.value } })}
              />
            </Field>
            <Field label="الوزن">
              <TextInput
                type="number"
                value={form.raw.weight}
                onChange={(e) => set({ raw: { ...form.raw, weight: e.target.value } })}
                placeholder="0"
              />
            </Field>
            <Field label="الوحدة">
              <SelectInput
                options={WEIGHT_UNITS}
                value={form.raw.unit}
                onChange={(e) => set({ raw: { ...form.raw, unit: e.target.value } })}
                placeholder="اختر الوحدة"
              />
            </Field>
            <Field label="الكسارة">
              <SearchSelect
                options={crushers}
                value={form.raw.crusher}
                onChange={(v) => set({ raw: { ...form.raw, crusher: v } })}
                placeholder="ابحث عن كسارة"
              />
            </Field>
            <Field label="سعر الخامة (اختياري)">
              <TextInput
                type="number"
                value={form.raw.price}
                onChange={(e) => set({ raw: { ...form.raw, price: e.target.value } })}
                placeholder="سعر الطن / الوحدة"
              />
            </Field>
          </div>
          {Number(form.raw.weight) > 0 && Number(form.raw.price) > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              القيمة الإجمالية التقديرية للخامة: <span className="font-semibold text-foreground">{formatMoney(Number(form.raw.weight) * Number(form.raw.price))}</span>
            </p>
          )}
        </SectionCard>

        <SectionCard title="القلابات" description="القلاب، الوزن المنقول، وسعر النقلة إن وُجد">
          <div className="space-y-3">
            {form.tippers.map((t, i) => {
              const total = (Number(t.weight) || 0) * (Number(t.rate) || 0);
              return (
                <div key={t.id} className="rounded-md border border-border p-3">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    <SearchSelect
                      options={TIPPERS}
                      value={t.name}
                      onChange={(v) => setList('tippers', i, { name: v })}
                      placeholder="اسم القلاب"
                    />
                    <TextInput
                      type="number"
                      value={t.weight}
                      onChange={(e) => setList('tippers', i, { weight: e.target.value })}
                      placeholder="الوزن"
                    />
                    <TextInput
                      type="number"
                      value={t.rate}
                      onChange={(e) => setList('tippers', i, { rate: e.target.value })}
                      placeholder="سعر النقلة (اختياري)"
                    />
                    <TextInput
                      type="number"
                      value={t.paid}
                      onChange={(e) => setList('tippers', i, { paid: e.target.value })}
                      placeholder="المدفوع للسائق"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">الإجمالي: {formatMoney(total)}</span>
                      <RowActions onRemove={() => removeItem('tippers', i)} disabled={form.tippers.length === 1} />
                    </div>
                  </div>
                </div>
              );
            })}
            <Button
              variant="secondary"
              onClick={() => addItem('tippers', { id: newId('t'), name: '', weight: '', rate: '', paid: '' })}
            >
              <Plus className="h-4 w-4" /> إضافة قلاب
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="ساعات التشغيل والتوقف" description="سجّل فترات التشغيل الفعلية وأي توقفات حدثت">
          <div className="space-y-3">
            {form.operatingHours.map((h, i) => (
              <div key={h.id} className="rounded-md border border-border p-3">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <Field label="بداية التشغيل">
                    <TextInput type="time" value={h.runStart} onChange={(e) => setList('operatingHours', i, { runStart: e.target.value })} />
                  </Field>
                  <Field label="نهاية التشغيل">
                    <TextInput type="time" value={h.runEnd} onChange={(e) => setList('operatingHours', i, { runEnd: e.target.value })} />
                  </Field>
                  <Field label="ساعات التوقف">
                    <TextInput type="number" value={h.stopHours} onChange={(e) => setList('operatingHours', i, { stopHours: e.target.value })} placeholder="0" />
                  </Field>
                  <Field label="سبب التوقف">
                    <SearchSelect options={STOP_REASONS} value={h.stopReason} onChange={(v) => setList('operatingHours', i, { stopReason: v })} placeholder="بدون توقف" />
                  </Field>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-xs text-muted-foreground">التشغيل الفعلي: {formatNumberAr(hoursBetween(h.runStart, h.runEnd))} ساعة</span>
                    <RowActions onRemove={() => removeItem('operatingHours', i)} disabled={form.operatingHours.length === 1} />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="secondary"
              onClick={() => addItem('operatingHours', { id: newId('oh'), runStart: '', runEnd: '', stopHours: '', stopReason: '' })}
            >
              <Plus className="h-4 w-4" /> إضافة فترة تشغيل
            </Button>
          </div>
        </SectionCard>

        {form.shiftTeams.map((team, ti) => (
          <SectionCard
            key={team.id}
            title={`المشغل والعمال — ${shiftTeamLabel(ti)}`}
            actions={
              form.shiftTeams.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTeam(ti)}
                  title="حذف هذه الوردية"
                  className="h-9 rounded-md border border-border px-3 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="المشغل">
                <SearchSelect
                  options={OPERATORS}
                  value={team.operator}
                  onChange={(v) => setTeam(ti, { operator: v })}
                  placeholder="اختر أو اكتب اسم المشغل"
                />
              </Field>
              <Field label="عدد العمال">
                <TextInput
                  type="number"
                  value={team.workersCount}
                  onChange={(e) => setTeam(ti, { workersCount: e.target.value })}
                  placeholder="0"
                />
              </Field>
            </div>
            <div className="mt-4 space-y-3">
              {team.workers.map((w, wi) => (
                <div key={`wk-${ti}-${wi}`} className="rounded-md border border-border p-3">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    <SearchSelect
                      options={WORKERS}
                      value={w.name}
                      onChange={(v) => {
                        setTeamWorker(ti, wi, { name: v });
                        getWorkerByName(v).then((existing) => {
                          if (existing) {
                            setTeamWorker(ti, wi, {
                              name: v,
                              workerId: existing.id,
                              dailyAmount: w.dailyAmount || existing.dailyRate || '',
                            });
                          }
                        });
                      }}
                      placeholder="اسم العامل"
                    />
                    <TextInput
                      type="number"
                      value={w.hours}
                      onChange={(e) => setTeamWorker(ti, wi, { hours: e.target.value })}
                      placeholder="عدد الساعات"
                    />
                    <TextInput
                      type="number"
                      value={w.dailyAmount}
                      onChange={(e) => setTeamWorker(ti, wi, { dailyAmount: e.target.value })}
                      placeholder="اليومية / المستحق"
                    />
                    <TextInput
                      type="number"
                      value={w.paid}
                      onChange={(e) => setTeamWorker(ti, wi, { paid: e.target.value })}
                      placeholder="المدفوع"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        المتبقي: {formatMoney(Math.max((Number(w.dailyAmount) || 0) - (Number(w.paid) || 0), 0))}
                      </span>
                      <RowActions onRemove={() => removeTeamWorker(ti, wi)} disabled={team.workers.length === 1} />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="secondary" onClick={() => addTeamWorker(ti)}>
                <Plus className="h-4 w-4" /> إضافة عامل
              </Button>
            </div>
          </SectionCard>
        ))}

        <Button variant="secondary" onClick={addTeam}>
          <Plus className="h-4 w-4" /> إضافة مشغل / وردية أخرى
        </Button>

        <SectionCard title="الإنتاج والتعبئة" description="يمكن إضافة أكثر من عملية تعبئة">
          <div className="space-y-4">
            {form.production.map((p, i) => (
              <div key={p.id} className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-2 xl:grid-cols-5">
                <Field label="درجة النعومة">
                  <SearchSelect options={FINENESS} value={p.fineness} onChange={(v) => setList('production', i, { fineness: v })} placeholder="مثال 45M" />
                </Field>
                <Field label="ساعات التشغيل">
                  <TextInput type="number" value={p.hours} onChange={(e) => setList('production', i, { hours: e.target.value })} placeholder="0" />
                </Field>
                <Field label="نوع العبوة">
                  <SelectInput options={PACKAGING_PRODUCTION} value={p.packaging} onChange={(e) => setList('production', i, { packaging: e.target.value })} />
                </Field>
                <Field label="اسم العميل">
                  <SearchSelect options={customers} value={p.customer} onChange={(v) => setList('production', i, { customer: v })} placeholder="ابحث عن عميل أو أضف جديدًا" />
                </Field>
                <div className="flex items-end">
                  <RowActions onRemove={() => removeItem('production', i)} disabled={form.production.length === 1} />
                </div>
              </div>
            ))}
            <Button
              variant="secondary"
              onClick={() => addItem('production', { id: newId('p'), fineness: '', hours: '', packaging: '', customer: '' })}
            >
              <Plus className="h-4 w-4" /> إضافة عملية تعبئة
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="التحميل">
          <div className="space-y-4">
            {form.loading.map((l, i) => (
              <div key={l.id} className="rounded-md border border-border p-3">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="النوع / درجة النعومة">
                    <SearchSelect options={FINENESS} value={l.fineness} onChange={(v) => setList('loading', i, { fineness: v })} placeholder="مثال 45M" />
                  </Field>
                  <Field label="الوزن (طن)">
                    <TextInput type="number" value={l.weight} onChange={(e) => setList('loading', i, { weight: e.target.value })} placeholder="0" />
                  </Field>
                  <Field label="العميل">
                    <SearchSelect options={customers} value={l.customer} onChange={(v) => setList('loading', i, { customer: v })} placeholder="ابحث عن عميل أو أضف جديدًا" />
                  </Field>
                  <Field label="نوع العبوة">
                    <SelectInput options={PACKAGING_LOADING} value={l.packaging} onChange={(e) => setList('loading', i, { packaging: e.target.value })} />
                  </Field>
                  <Field label="السعر (للطن)">
                    <TextInput type="number" value={l.price} onChange={(e) => setList('loading', i, { price: e.target.value })} placeholder="0" />
                  </Field>
                  <Field label="طريقة الدفع">
                    <SelectInput
                      options={PAYMENT_METHODS}
                      value={l.payment}
                      onChange={(e) => setList('loading', i, { payment: e.target.value })}
                      placeholder="اختر طريقة الدفع"
                    />
                  </Field>
                  <Field label="اسم السائق">
                    <TextInput value={l.driverName} onChange={(e) => setList('loading', i, { driverName: e.target.value })} placeholder="اختياري" />
                  </Field>
                  <Field label="رقم السيارة">
                    <TextInput value={l.vehiclePlateNumber} onChange={(e) => setList('loading', i, { vehiclePlateNumber: e.target.value })} placeholder="اختياري" />
                  </Field>
                  <Field label="بطاقة السائق">
                    <TextInput value={l.driverIdNumber} onChange={(e) => setList('loading', i, { driverIdNumber: e.target.value })} placeholder="اختياري" />
                  </Field>
                  <Field label="نوع السيارة">
                    <SelectInput options={VEHICLE_TYPES} value={l.vehicleType} onChange={(e) => setList('loading', i, { vehicleType: e.target.value })} />
                  </Field>
                  {l.payment === 'آجل' && (
                    <>
                      <Field label="المدفوع">
                        <TextInput
                          type="number"
                          value={l.paid}
                          onChange={(e) => {
                            const total = (Number(l.weight) || 0) * (Number(l.price) || 0);
                            setList('loading', i, { paid: e.target.value, remaining: Math.max(total - (Number(e.target.value) || 0), 0) });
                          }}
                          placeholder="0"
                        />
                      </Field>
                      <Field label="المتبقي">
                        <TextInput type="number" value={l.remaining} readOnly className="bg-secondary" />
                      </Field>
                    </>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">
                    إجمالي العملية: <span className="font-semibold text-foreground">{formatMoney((Number(l.weight) || 0) * (Number(l.price) || 0))}</span>
                  </p>
                  <RowActions onRemove={() => removeItem('loading', i)} disabled={form.loading.length === 1} />
                </div>
              </div>
            ))}
            <Button
              variant="secondary"
              onClick={() =>
                addItem('loading', {
                  id: newId('l'), fineness: '', weight: '', customer: '', packaging: '', price: '', payment: 'نقدي', paid: '', remaining: '',
                  driverName: '', vehiclePlateNumber: '', driverIdNumber: '', vehicleType: '',
                })
              }
            >
              <Plus className="h-4 w-4" /> إضافة عملية تحميل
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="المصاريف" description="اسم/نوع المصروف والمبلغ فقط — يمكن إضافة أكثر من مصروف">
          <div className="space-y-3">
            {form.expenses.map((x, i) => (
              <div key={x.id} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field label="نوع / اسم المصروف">
                    <SearchSelect options={EXPENSE_TYPES} value={x.type} onChange={(v) => setList('expenses', i, { type: v })} placeholder="مثال: أكل، أجور، نقل، وقود..." />
                  </Field>
                </div>
                <div className="flex items-end gap-2">
                  <Field label="المبلغ" className="flex-1">
                    <TextInput type="number" value={x.amount} onChange={(e) => setList('expenses', i, { amount: e.target.value })} placeholder="0" />
                  </Field>
                  <RowActions onRemove={() => removeItem('expenses', i)} disabled={form.expenses.length === 1} />
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={() => addItem('expenses', { id: newId('e'), category: '', type: '', amount: '', entity: '', notes: '' })}>
              <Plus className="h-4 w-4" /> إضافة مصروف
            </Button>
          </div>
        </SectionCard>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={saving} className="px-8">
            حفظ التقرير
          </Button>
          <Button variant="secondary" onClick={() => navigate('/operations/daily-reports')}>
            إلغاء
          </Button>
        </div>
      </form>

      <Modal open={crusherModal} onClose={() => setCrusherModal(false)} title="إضافة كسارة جديدة"
        footer={
          <>
            <Button
              onClick={async () => {
                if (!newCrusher.trim()) return;
                try {
                  const updatedList = await addCrusher(newCrusher.trim());
                  setCrushers(updatedList);
                  set({ raw: { ...form.raw, crusher: newCrusher.trim() } });
                  setNewCrusher('');
                  setCrusherModal(false);
                  toast.success('تمت إضافة الكسارة');
                } catch (err) {
                  toast.error(err.message || 'تعذّر إضافة الكسارة');
                }
              }}
            >
              إضافة
            </Button>
            <Button variant="secondary" onClick={() => setCrusherModal(false)}>إلغاء</Button>
          </>
        }
      >
        <Field label="اسم الكسارة">
          <TextInput value={newCrusher} onChange={(e) => setNewCrusher(e.target.value)} placeholder="مثال: كسارة سمالوط" />
        </Field>
      </Modal>

      <Modal
        open={Boolean(savedId)}
        onClose={() => navigate('/operations/daily-reports')}
        title="تم حفظ التقرير اليومي بنجاح"
        footer={
          <>
            <Button onClick={() => navigate(`/operations/daily-reports/${savedId}`)}>عرض التقرير</Button>
            <Button variant="secondary" onClick={() => navigate(`/operations/daily-reports/${savedId}/edit`)}>تعديل التقرير</Button>
            <Button variant="secondary" onClick={() => navigate(`/operations/daily-reports/${savedId}?print=1`)}>طباعة التقرير</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">يمكنك الآن عرض التقرير أو تعديله أو طباعته.</p>
      </Modal>

      <ConfirmDialog
        open={confirmSaveOpen}
        title="تأكيد حفظ التقرير اليومي"
        message="هل أنت متأكد من حفظ التقرير اليومي؟ سيتم حفظ كل البيانات المدخلة."
        confirmLabel="نعم، احفظ التقرير"
        confirmVariant="primary"
        onConfirm={confirmSave}
        onCancel={() => setConfirmSaveOpen(false)}
      />
    </>
  );
}