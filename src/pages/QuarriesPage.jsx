import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, ConfirmDialog, DataTable, EmptyState, Field, FilterBar, LoadingState,
  Modal, PageHeader, SearchBar, SectionCard, TextInput, SelectInput,
} from '@/components/common';
import { listQuarries, saveQuarry, deleteQuarry } from '@/services/quarriesService';
import { listReports } from '@/services/reportsService';
import { computeQuarryStats, formatMoney, formatNumberAr } from '@/utils/reportUtils';
import { useAuth } from '@/hooks/useAuth';

const emptyForm = () => ({ name: '', owner: '', phone: '', address: '', notes: '' });

export default function QuarriesPage() {
  const [quarries, setQuarries] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();
  const { canManage } = useAuth();

  const load = () => {
    listQuarries().then(setQuarries);
    listReports().then((r) => { setReports(r); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim();
    return quarries.filter((x) => !q || x.name.includes(q) || (x.owner || '').includes(q));
  }, [quarries, query]);

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setModal(true); };
  const openEdit = (q) => { setForm({ ...q }); setEditId(q.id); setModal(true); };
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('اسم الكسارة مطلوب'); return; }
    try {
      await saveQuarry({ ...form, id: editId || undefined });
      toast.success(editId ? 'تم تعديل بيانات الكسارة' : 'تم إضافة الكسارة بنجاح');
      setModal(false);
      listQuarries().then(setQuarries);
    } catch (err) {
      toast.error(err.message || 'تعذّر حفظ بيانات الكسارة');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuarry(confirmId);
      setConfirmId(null);
      toast.success('تم حذف الكسارة');
      listQuarries().then(setQuarries);
    } catch (err) {
      toast.error(err.message || 'تعذّر حذف الكسارة');
    }
  };

  const columns = [
    { key: 'name', header: 'اسم الكسارة', render: (q) => <span className="font-medium">{q.name}</span> },
    { key: 'owner', header: 'المالك', render: (q) => q.owner || '—' },
    { key: 'phone', header: 'الهاتف', render: (q) => q.phone || '—' },
    {
      key: 'totalWeight', header: 'إجمالي الخامة',
      render: (q) => {
        const s = computeQuarryStats(q.id, reports);
        return s.totalWeight > 0 ? `${formatNumberAr(s.totalWeight)} طن` : '—';
      },
    },
    {
      key: 'deliveries', header: 'عدد التوريدات',
      render: (q) => {
        const s = computeQuarryStats(q.id, reports);
        return formatNumberAr(s.deliveries.length);
      },
    },
    {
      key: 'actions', header: 'الإجراءات',
      render: (q) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/quarries/${q.id}`)} className="rounded p-2 hover:bg-secondary" title="تفاصيل">
            <Eye className="h-4 w-4" />
          </button>
          {canManage && (
            <><button onClick={() => openEdit(q)} className="rounded p-2 hover:bg-secondary" title="تعديل">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirmId(q.id)} className="rounded p-2 hover:bg-destructive/10 text-destructive" title="حذف">
            <Trash2 className="h-4 w-4" />
          </button></>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>الكسارات — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="إدارة بيانات الكسارات وسجل التوريدات." />
      </Helmet>

      <PageHeader
        title="الكسارات"
        subtitle="بيانات الكسارات المورِّدة للخامة"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'الكسارات' }]}
        actions={
          canManage && (
            <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> إضافة كسارة
          </Button>
          )
        }
      />

      <div className="app-card p-4 sm:p-6">
        <FilterBar className="mb-4">
          <Field label="بحث" className="sm:w-72">
            <SearchBar value={query} onChange={setQuery} placeholder="ابحث باسم الكسارة أو المالك..." />
          </Field>
        </FilterBar>

        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty={
              <EmptyState
                title="لا توجد كسارات"
                description="ابدأ بإضافة كسارة جديدة."
                action={<Button onClick={openAdd}><Plus className="h-4 w-4" /> إضافة كسارة</Button>}
              />
            }
          />
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'تعديل بيانات الكسارة' : 'إضافة كسارة جديدة'}
        footer={
          <>
            <Button onClick={handleSave}>{editId ? 'حفظ التعديلات' : 'إضافة'}</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>إلغاء</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="اسم الكسارة *">
            <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثال: كسارة المنيا" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="اسم المالك">
              <TextInput value={form.owner} onChange={(e) => set({ owner: e.target.value })} placeholder="الحاج أحمد" />
            </Field>
            <Field label="الهاتف">
              <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="01x..." />
            </Field>
          </div>
          <Field label="العنوان">
            <TextInput value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="المدينة — المنطقة" />
          </Field>
          <Field label="ملاحظات">
            <TextInput value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="ملاحظات اختيارية" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="حذف الكسارة"
        message="هل أنت متأكد من حذف هذه الكسارة؟ لن يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
