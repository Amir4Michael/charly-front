import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, X, Layers, Printer, PackageSearch } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, DateInput, EmptyState, Field, FilterBar, LoadingState, PageHeader,
  SectionCard, StatCard, TextInput, WhatsAppButton,
} from '@/components/common';
import { getMaterials, addToList, removeFromList } from '@/services/materialsService';
import { listReports } from '@/services/reportsService';
import { getSettings } from '@/services/settingsService';
import { useAuth } from '@/hooks/useAuth';
import { factoryWhatsAppShareHref } from '@/config/whatsapp';
import { filterReportsByPeriod, formatMoney, formatNumberAr } from '@/utils/reportUtils';

const GROUPS = [
  { key: 'rawTypes', title: 'أنواع الخامات الأساسية', description: 'بودرة، مقروش، مخلط، وغيرها', placeholder: 'مثال: بودرة' },
  { key: 'fineness', title: 'درجات النعومة', description: 'تُستخدم عند تسجيل عمليات التعبئة والتحميل', placeholder: 'مثال: 45M' },
  { key: 'packagingProduction', title: 'أنواع العبوات — التعبئة', description: 'تُستخدم داخل قسم الإنتاج والتعبئة في التقرير اليومي', placeholder: 'مثال: جامبو' },
  { key: 'packagingLoading', title: 'أنواع العبوات — التحميل', description: 'تُستخدم عند تسجيل عمليات التحميل والمبيعات', placeholder: 'مثال: شكارة 50' },
  { key: 'vehicleTypes', title: 'أنواع السيارات', description: 'تُستخدم عند تسجيل بيانات السائق والسيارة في قسم التحميل بالتقرير اليومي', placeholder: 'مثال: تريلة' },
];

function Tag({ label, onRemove, canManage }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm">
      {label}
      {canManage && (
        <button type="button" onClick={onRemove} className="rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive" title="حذف">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

/** يحوّل الوزن إلى طن حسب الوحدة المسجّلة، حتى تكون كل الإجماليات على نفس الأساس */
function toTons(weight, unit) {
  const w = Number(weight) || 0;
  if (unit === 'كيلو') return w / 1000;
  return w;
}

export default function MaterialsPage() {
  const [data, setData] = useState({ rawTypes: [], fineness: [], packagingProduction: [], packagingLoading: [], vehicleTypes: [] });
  const [inputs, setInputs] = useState({});
  const { canManage } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    listReports().then((r) => { setReports(r); setLoading(false); });
    getMaterials().then(setData);
  }, []);

  const filteredReports = useMemo(() => filterReportsByPeriod(reports, from, to), [reports, from, to]);

  const inventory = useMemo(() => {
    const incomingByType = {};
    let incomingTotal = 0;
    let incomingValue = 0;
    let hasAnyPrice = false;

    filteredReports.forEach((r) => {
      const raw = r.raw;
      if (!raw?.type || !raw?.weight) return;
      const tons = toTons(raw.weight, raw.unit);
      incomingTotal += tons;
      if (!incomingByType[raw.type]) incomingByType[raw.type] = { count: 0, tons: 0, value: 0, hasPrice: false };
      incomingByType[raw.type].count += 1;
      incomingByType[raw.type].tons += tons;
      if (Number(raw.price) > 0) {
        const value = tons * Number(raw.price);
        incomingByType[raw.type].value += value;
        incomingByType[raw.type].hasPrice = true;
        incomingValue += value;
        hasAnyPrice = true;
      }
    });

    const outputByFineness = {};
    let outputTotal = 0;
    filteredReports.forEach((r) => {
      (r.loading || []).forEach((l) => {
        if (!l.fineness) return;
        const tons = Number(l.weight) || 0;
        outputTotal += tons;
        if (!outputByFineness[l.fineness]) outputByFineness[l.fineness] = { count: 0, tons: 0 };
        outputByFineness[l.fineness].count += 1;
        outputByFineness[l.fineness].tons += tons;
      });
    });

    return {
      incomingByType, incomingTotal, incomingValue, hasAnyPrice,
      outputByFineness, outputTotal,
      remaining: incomingTotal - outputTotal,
    };
  }, [filteredReports]);

  const handleAdd = (key) => {
    const value = (inputs[key] || '').trim();
    if (!value) return;
    addToList(key, value)
      .then((updated) => {
        setData(updated);
        setInputs((s) => ({ ...s, [key]: '' }));
        toast.success('تمت الإضافة');
      })
      .catch((err) => toast.error(err.message || 'تعذّر الإضافة'));
  };

  const handleRemove = (key, value) => {
    removeFromList(key, value)
      .then((updated) => {
        setData(updated);
        toast.success('تم الحذف');
      })
      .catch((err) => toast.error(err.message || 'تعذّر الحذف'));
  };

  const shareMessage = `تقرير الخامات — ${getSettings().factoryName}\nإجمالي الخامة الداخلة: ${formatNumberAr(inventory.incomingTotal)} طن\nإجمالي الإنتاج المحمّل: ${formatNumberAr(inventory.outputTotal)} طن\nالرصيد التقديري المتبقي: ${formatNumberAr(inventory.remaining)} طن`;

  return (
    <>
      <Helmet>
        <title>الخامات — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="تقرير تجميعي لحركة الخامات في مصنع كربونات الكالسيوم: الداخل والمُنتَج والمتبقي، مع إدارة أنواع الخامات ودرجات النعومة." />
      </Helmet>

      <div className="no-print">
        <PageHeader
          title="الخامات"
          subtitle="تقرير تجميعي لحركة الخامات — الداخل، المُنتَج، والمتبقي"
          breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'البيانات الأساسية' }, { label: 'الخامات' }]}
          actions={
            <>
              <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة التقرير</Button>
              <WhatsAppButton href={factoryWhatsAppShareHref(shareMessage)} />
            </>
          }
        />
      </div>

      <div className="print-sheet space-y-6">
        <header className="hidden text-center print:block print:mb-2">
          <h2 className="text-xl font-bold">{getSettings().factoryName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">تقرير الخامات — الداخل والمُنتَج والمتبقي</p>
        </header>

        <div className="app-card no-print p-4 sm:p-6">
          <FilterBar>
            <Field label="من تاريخ" className="sm:w-44">
              <DateInput value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="إلى تاريخ" className="sm:w-44">
              <DateInput value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Button variant="secondary" onClick={() => { setFrom(''); setTo(''); }}>كل الفترات</Button>
          </FilterBar>
        </div>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="إجمالي الخامة الداخلة" value={formatNumberAr(inventory.incomingTotal)} unit="طن" icon={PackageSearch} />
              <StatCard label="إجمالي الإنتاج المحمّل" value={formatNumberAr(inventory.outputTotal)} unit="طن" icon={PackageSearch} />
              <StatCard label="الرصيد التقديري المتبقي" value={formatNumberAr(inventory.remaining)} unit="طن" icon={PackageSearch} />
              {inventory.hasAnyPrice && <StatCard label="قيمة الخامة الداخلة" value={formatMoney(inventory.incomingValue)} icon={PackageSearch} />}
            </div>

            <SectionCard title="الخامات الداخلة حسب النوع" description="مجمّعة من قسم الخامة داخل كل تقرير يومي">
              {!Object.keys(inventory.incomingByType).length ? (
                <EmptyState title="لا توجد بيانات خامة واردة في هذه الفترة" />
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-secondary/70">
                        {['نوع الخامة', 'عدد مرات الاستلام', 'إجمالي الوزن (طن)', 'القيمة الإجمالية'].map((h) => (
                          <th key={h} className="border border-border px-2 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(inventory.incomingByType).map(([type, v]) => (
                        <tr key={type}>
                          <td className="border border-border px-2 py-2 font-medium">{type}</td>
                          <td className="border border-border px-2 py-2">{formatNumberAr(v.count)}</td>
                          <td className="border border-border px-2 py-2">{formatNumberAr(v.tons)}</td>
                          <td className="border border-border px-2 py-2">{v.hasPrice ? formatMoney(v.value) : '—'}</td>
                        </tr>
                      ))}
                      <tr className="bg-secondary font-semibold">
                        <td className="border border-border px-2 py-2">الإجمالي</td>
                        <td className="border border-border px-2 py-2"></td>
                        <td className="border border-border px-2 py-2">{formatNumberAr(inventory.incomingTotal)}</td>
                        <td className="border border-border px-2 py-2">{inventory.hasAnyPrice ? formatMoney(inventory.incomingValue) : '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <SectionCard title="الإنتاج المحمّل حسب درجة النعومة" description="مجمّع من عمليات التحميل داخل كل تقرير يومي — أقرب مقياس فعلي متاح حاليًا للكمية المُنتَجة والمُشحَّنة">
              {!Object.keys(inventory.outputByFineness).length ? (
                <EmptyState title="لا توجد عمليات تحميل في هذه الفترة" />
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[420px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-secondary/70">
                        {['درجة النعومة', 'عدد العمليات', 'إجمالي الوزن (طن)'].map((h) => (
                          <th key={h} className="border border-border px-2 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(inventory.outputByFineness).map(([fineness, v]) => (
                        <tr key={fineness}>
                          <td className="border border-border px-2 py-2 font-medium">{fineness}</td>
                          <td className="border border-border px-2 py-2">{formatNumberAr(v.count)}</td>
                          <td className="border border-border px-2 py-2">{formatNumberAr(v.tons)}</td>
                        </tr>
                      ))}
                      <tr className="bg-secondary font-semibold">
                        <td className="border border-border px-2 py-2">الإجمالي</td>
                        <td className="border border-border px-2 py-2"></td>
                        <td className="border border-border px-2 py-2">{formatNumberAr(inventory.outputTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <div className="no-print flex items-start gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              <Layers className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                ملاحظة دقة الأرقام: "الرصيد المتبقي" هنا تقديري إجمالي (خامة واردة − إنتاج محمَّل)، لأن أنواع الخامة (بودرة/مقروش/مخلط)
                ودرجات النعومة (45M...) غير مرتبطة حاليًا بجدول تحويل واحد، وقسم "الإنتاج والتعبئة" لا يسجّل وزنًا فعليًا (فقط ساعات تشغيل).
                لحساب مخزون دقيق لكل نوع خامة على حدة سيحتاج الـBackend لاحقًا: (1) ربط نوع الخامة بدرجة النعومة الناتجة عنها، (2) إضافة حقل وزن
                فعلي في قسم الإنتاج، (3) كيان مخزون (Inventory) مستقل يُحدَّث تلقائيًا مع كل عملية استلام أو تحميل.
              </p>
            </div>
          </>
        )}

        <section className="hidden print:block print:mt-8">
          <p className="text-xs text-muted-foreground">توقيع مدير المصنع: ..............................</p>
        </section>
      </div>

      <div className="no-print mt-6 space-y-6">
        {GROUPS.map((g) => (
          <SectionCard key={g.key} title={g.title} description={g.description}>
            <div className="mb-4 flex flex-wrap gap-2">
              {data[g.key]?.length ? (
                data[g.key].map((v) => (
                  <Tag key={v} label={v} canManage={canManage} onRemove={() => handleRemove(g.key, v)} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد عناصر بعد.</p>
              )}
            </div>
            {canManage && (
              <div className="flex gap-2 sm:max-w-sm">
                <Field className="flex-1">
                  <TextInput
                    value={inputs[g.key] || ''}
                    onChange={(e) => setInputs((s) => ({ ...s, [g.key]: e.target.value }))}
                    placeholder={g.placeholder}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(g.key); } }}
                  />
                </Field>
                <Button variant="secondary" onClick={() => handleAdd(g.key)}>
                  <Plus className="h-4 w-4" /> إضافة
                </Button>
              </div>
            )}
          </SectionCard>
        ))}

        <div className="flex items-start gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          <Layers className="mt-0.5 h-4 w-4 shrink-0" />
          <p>هذه القوائم تُستخدم مباشرة داخل التقرير اليومي وصفحات الإنتاج والتحميل، وأي إضافة هنا تظهر فورًا في كل الاختيارات المرتبطة بها.</p>
        </div>
      </div>
    </>
  );
}