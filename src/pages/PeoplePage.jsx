import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Phone, 
  MessageCircle, 
  Pencil, 
  Users2, 
  UserCheck, 
  Truck, 
  Factory, 
  HardHat, 
  Building2, 
  Search,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, EmptyState, Field, Modal, PageHeader, SearchBar, SectionCard, TextInput,
} from '@/components/common';
import { listCustomers, saveCustomer } from '@/services/customersService';
import { listQuarries, saveQuarry } from '@/services/quarriesService';
import { listTrucks, saveTruck } from '@/services/trucksService';
import { listWorkers, saveWorker } from '@/services/workersService';
import { telHref, whatsappHref, isValidPhone } from '@/lib/phone';
import { useAuth } from '@/hooks/useAuth';

export default function PeoplePage() {
  const [customers, setCustomers] = useState([]);
  const [quarries, setQuarries] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [query, setQuery] = useState('');
  const [editState, setEditState] = useState(null); // { kind, record, phone, label }
  const { canManage } = useAuth();

  useEffect(() => {
    listCustomers().then(setCustomers);
    listQuarries().then(setQuarries);
    listTrucks().then(setTrucks);
    listWorkers().then(setWorkers);
  }, []);

  const groups = useMemo(() => {
    const q = query.trim();
    const match = (name) => !q || (name || '').includes(q);

    return [
      {
        key: 'customers',
        title: 'العملاء',
        kind: 'customer',
        icon: Building2,
        color: 'text-blue-500 bg-blue-500/10',
        people: customers
          .filter((c) => match(c.name))
          .map((c) => ({ id: c.id, name: c.name, subtitle: c.contactPerson || '', typeLabel: 'عميل', phone: c.phone, record: c })),
      },
      {
        key: 'trucks',
        title: 'القلابات (السائقون)',
        kind: 'truck',
        icon: Truck,
        color: 'text-amber-500 bg-amber-500/10',
        people: trucks
          .filter((t) => match(t.driver) || match(t.name))
          .map((t) => ({ id: t.id, name: t.driver || t.name, subtitle: t.name, typeLabel: 'سائق قلاب', phone: t.phone, record: t })),
      },
      {
        key: 'quarries',
        title: 'الكسارات (المسؤولون)',
        kind: 'quarry',
        icon: Factory,
        color: 'text-purple-500 bg-purple-500/10',
        people: quarries
          .filter((qz) => match(qz.owner) || match(qz.name))
          .map((qz) => ({ id: qz.id, name: qz.owner || qz.name, subtitle: qz.name, typeLabel: 'مسؤول كسارة', phone: qz.phone, record: qz })),
      },
      {
        key: 'operators',
        title: 'المشغلون',
        kind: 'worker',
        icon: UserCheck,
        color: 'text-emerald-500 bg-emerald-500/10',
        people: workers
          .filter((w) => w.job === 'مشغل')
          .filter((w) => match(w.name))
          .map((w) => ({ id: w.id, name: w.name, subtitle: w.job, typeLabel: 'مشغل', phone: w.phone, record: w })),
      },
      {
        key: 'workers',
        title: 'العمال',
        kind: 'worker',
        icon: HardHat,
        color: 'text-orange-500 bg-orange-500/10',
        people: workers
          .filter((w) => w.job !== 'مشغل')
          .filter((w) => match(w.name))
          .map((w) => ({ id: w.id, name: w.name, subtitle: w.job, typeLabel: 'عامل', phone: w.phone, record: w })),
      },
    ];
  }, [customers, quarries, trucks, workers, query]);

  const totalPeople = groups.reduce((s, g) => s + g.people.length, 0);

  const openEditPhone = (kind, person) => {
    setEditState({ kind, record: person.record, phone: person.phone || '', name: person.name });
  };

  const handleSavePhone = async () => {
    if (!editState) return;
    const { kind, record, phone } = editState;
    const updated = { ...record, phone: phone.trim() };
    try {
      if (kind === 'customer') { await saveCustomer(updated); listCustomers().then(setCustomers); }
      else if (kind === 'truck') { await saveTruck(updated); listTrucks().then(setTrucks); }
      else if (kind === 'quarry') { await saveQuarry(updated); listQuarries().then(setQuarries); }
      else if (kind === 'worker') { await saveWorker(updated); listWorkers().then(setWorkers); }
      setEditState(null);
      toast.success('تم تحديث رقم الهاتف');
    } catch (err) {
      toast.error(err.message || 'تعذّر تحديث رقم الهاتف');
    }
  };

  return (
    <>
      <Helmet>
        <title>أشخاص المصنع — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="دليل موحّد لكل الأشخاص المرتبطين بمصنع كربونات الكالسيوم: العملاء، سائقو القلابات، مسؤولو الكسارات، المشغلون، والعمال." />
      </Helmet>

      <PageHeader
        title="أشخاص المصنع"
        subtitle={`دليل التلفونات والتواصل الموّحد للمصنع (${totalPeople} شخص)`}
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'البيانات الأساسية' }, { label: 'أشخاص المصنع' }]}
      />

      {/* Top Search & Stats Card */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="app-card md:col-span-2 p-4 sm:p-5 flex flex-col justify-center">
          <Field label="البحث عن شخص أو رقم هاتف">
            <SearchBar value={query} onChange={setQuery} placeholder="ابحث باسم العميل، السائق، العامل، الكسارة..." />
          </Field>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">إجمالي جهات الاتصال المسجلة</p>
            <p className="text-3xl font-black text-foreground mt-1">{totalPeople}</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
            <Users className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Groups Section */}
      <div className="space-y-6">
        {groups.map((g) => {
          const GroupIcon = g.icon;
          return (
            <SectionCard 
              key={g.key} 
              title={
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${g.color}`}>
                    <GroupIcon className="h-4 w-4" />
                  </div>
                  <span>{g.title}</span>
                </div>
              } 
              description={`${g.people.length} ${g.people.length === 1 ? 'شخص مسجل' : 'أشخاص مسجلين'}`}
            >
              {!g.people.length ? (
                <EmptyState title="لا يوجد أشخاص مطابقين للبحث في هذا القسم" />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-2xs">
                  <table className="w-full min-w-[560px] border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                        <th className="p-3 text-right">الاسم والصفة</th>
                        <th className="p-3 text-right">التصنيف</th>
                        <th className="p-3 text-right">رقم الهاتف</th>
                        <th className="p-3 text-right">وسائل التواصل والخيارات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {g.people.map((p) => {
                        const hasPhone = isValidPhone(p.phone);
                        const firstChar = (p.name || '?').charAt(0);
                        return (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                                  {firstChar}
                                </div>
                                <div>
                                  <p className="font-bold text-foreground text-sm">{p.name || '—'}</p>
                                  {p.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{p.subtitle}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="inline-block px-2.5 py-1 rounded-md bg-secondary font-medium text-xs text-muted-foreground">
                                {p.typeLabel}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-foreground dir-ltr text-right">
                              {p.phone || <span className="text-muted-foreground/60 font-normal">—</span>}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <a
                                  href={telHref(p.phone) || undefined}
                                  aria-disabled={!hasPhone}
                                  onClick={(e) => { if (!hasPhone) e.preventDefault(); }}
                                  title="اتصال هاتفي"
                                  className={`inline-flex h-9 px-3 items-center gap-1.5 rounded-lg border text-xs font-bold transition-colors ${
                                    hasPhone 
                                      ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground' 
                                      : 'border-border text-muted-foreground/40 cursor-not-allowed opacity-50'
                                  }`}
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>اتصال</span>
                                </a>

                                <a
                                  href={whatsappHref(p.phone) || undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => { if (!whatsappHref(p.phone)) e.preventDefault(); }}
                                  title="مراسلة واتساب"
                                  className={`inline-flex h-9 px-3 items-center gap-1.5 rounded-lg border text-xs font-bold transition-colors ${
                                    hasPhone 
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white' 
                                      : 'border-border text-muted-foreground/40 cursor-not-allowed opacity-50'
                                  }`}
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>واتساب</span>
                                </a>

                                {canManage && (
                                  <button
                                    onClick={() => openEditPhone(g.kind, p)}
                                    title="تعديل رقم الهاتف"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          );
        })}

        {/* Notice Card */}
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/80 bg-card/50 p-4 text-xs text-muted-foreground shadow-2xs">
          <Users2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="leading-relaxed">
            هذه الصفحة تُعد دليلاً موحداً وسريعاً للوصول؛ كل شخص هنا مأخوذ مباشرة من صفحته الأصلية (العملاء، القلابات، الكسارات، أو العمال)، وتعديل رقم الهاتف هنا يحدّث البيانات تلقائياً في صفحته الأساسية.
          </p>
        </div>
      </div>

      {/* Modal - Edit Phone */}
      <Modal
        open={Boolean(editState)}
        onClose={() => setEditState(null)}
        title={`تعديل رقم هاتف — ${editState?.name || ''}`}
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button onClick={handleSavePhone} className="font-semibold">حفظ التغييرات</Button>
            <Button variant="secondary" onClick={() => setEditState(null)}>إلغاء</Button>
          </div>
        }
      >
        <div className="pt-2">
          <Field label="رقم الهاتف الجديد">
            <TextInput
              value={editState?.phone || ''}
              onChange={(e) => setEditState((s) => ({ ...s, phone: e.target.value }))}
              placeholder="01xxxxxxxxx"
              dir="ltr"
              autoFocus
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}