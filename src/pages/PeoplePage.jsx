import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Phone, MessageCircle, Pencil, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, EmptyState, Field, Modal, PageHeader, SearchBar, SectionCard, TextInput, WhatsAppButton,
} from '@/components/common';
import { listCustomers, saveCustomer } from '@/services/customersService';
import { listQuarries, saveQuarry } from '@/services/quarriesService';
import { listTrucks, saveTruck } from '@/services/trucksService';
import { listWorkers, saveWorker } from '@/services/workersService';
import { telHref, whatsappHref, isValidPhone } from '@/lib/phone';
import { useAuth } from '@/hooks/useAuth';

/**
 * صفحة "أشخاص المصنع" — لا تنشئ أي بيانات جديدة، فقط تجمّع نفس الكيانات
 * الموجودة بالفعل في customersService / quarriesService / trucksService / workersService
 * في عرض واحد موحّد لسهولة الاتصال والتواصل.
 */
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
        people: customers
          .filter((c) => match(c.name))
          .map((c) => ({ id: c.id, name: c.name, subtitle: c.contactPerson || '', typeLabel: 'عميل', phone: c.phone, record: c })),
      },
      {
        key: 'trucks',
        title: 'القلابات (السائقون)',
        kind: 'truck',
        people: trucks
          .filter((t) => match(t.driver) || match(t.name))
          .map((t) => ({ id: t.id, name: t.driver || t.name, subtitle: t.name, typeLabel: 'سائق قلاب', phone: t.phone, record: t })),
      },
      {
        key: 'quarries',
        title: 'الكسارات (المسؤولون)',
        kind: 'quarry',
        people: quarries
          .filter((qz) => match(qz.owner) || match(qz.name))
          .map((qz) => ({ id: qz.id, name: qz.owner || qz.name, subtitle: qz.name, typeLabel: 'مسؤول كسارة', phone: qz.phone, record: qz })),
      },
      {
        key: 'operators',
        title: 'المشغلون',
        kind: 'worker',
        people: workers
          .filter((w) => w.job === 'مشغل')
          .filter((w) => match(w.name))
          .map((w) => ({ id: w.id, name: w.name, subtitle: w.job, typeLabel: 'مشغل', phone: w.phone, record: w })),
      },
      {
        key: 'workers',
        title: 'العمال',
        kind: 'worker',
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
        subtitle={`دليل موحّد لكل الأشخاص المرتبطين بالمصنع (${totalPeople} شخص) — بيانات من نفس صفحات العملاء والقلابات والكسارات والعمال`}
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'البيانات الأساسية' }, { label: 'أشخاص المصنع' }]}
      />

      <div className="app-card mb-6 p-4 sm:p-6">
        <Field label="بحث بالاسم" className="sm:max-w-sm">
          <SearchBar value={query} onChange={setQuery} placeholder="ابحث عن أي شخص..." />
        </Field>
      </div>

      <div className="space-y-6">
        {groups.map((g) => (
          <SectionCard key={g.key} title={g.title} description={`${g.people.length} ${g.people.length === 1 ? 'شخص' : 'أشخاص'}`}>
            {!g.people.length ? (
              <EmptyState title="لا يوجد أشخاص في هذا القسم" />
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-secondary/70">
                      {['الاسم', 'التصنيف', 'رقم الهاتف', 'إجراءات'].map((h) => (
                        <th key={h} className="border border-border px-2 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {g.people.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/30">
                        <td className="border border-border px-2 py-2">
                          <p className="font-medium">{p.name || '—'}</p>
                          {p.subtitle && <p className="text-xs text-muted-foreground">{p.subtitle}</p>}
                        </td>
                        <td className="border border-border px-2 py-2 text-xs text-muted-foreground">{p.typeLabel}</td>
                        <td className="border border-border px-2 py-2">
                          <span dir="ltr" className="font-medium">{p.phone || '—'}</span>
                        </td>
                        <td className="border border-border px-2 py-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <a
                              href={telHref(p.phone) || undefined}
                              aria-disabled={!isValidPhone(p.phone)}
                              onClick={(e) => { if (!isValidPhone(p.phone)) e.preventDefault(); }}
                              title="اتصال"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-primary hover:bg-accent disabled:opacity-40"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                            <a
                              href={whatsappHref(p.phone) || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => { if (!whatsappHref(p.phone)) e.preventDefault(); }}
                              title="واتساب"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                            {canManage && (
                              <button
                                onClick={() => openEditPhone(g.kind, p)}
                                title="تعديل رقم الهاتف"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-secondary"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        ))}

        <div className="flex items-start gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          <Users2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            هذه الصفحة لا تخزّن بيانات مستقلة؛ كل شخص هنا مأخوذ مباشرة من صفحة العملاء أو القلابات أو الكسارات أو العمال،
            وتعديل رقم الهاتف هنا يُحدّث نفس السجل في تلك الصفحة.
          </p>
        </div>
      </div>

      <Modal
        open={Boolean(editState)}
        onClose={() => setEditState(null)}
        title={`تعديل رقم هاتف — ${editState?.name || ''}`}
        footer={
          <>
            <Button onClick={handleSavePhone}>حفظ</Button>
            <Button variant="secondary" onClick={() => setEditState(null)}>إلغاء</Button>
          </>
        }
      >
        <Field label="رقم الهاتف">
          <TextInput
            value={editState?.phone || ''}
            onChange={(e) => setEditState((s) => ({ ...s, phone: e.target.value }))}
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </Field>
      </Modal>
    </>
  );
}
