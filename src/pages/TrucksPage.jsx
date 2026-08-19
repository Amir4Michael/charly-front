import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, ConfirmDialog, DataTable, EmptyState, Field, FilterBar, LoadingState,
  Modal, PageHeader, SearchBar, TextInput,
} from '@/components/common';
import { listTrucks, saveTruck, deleteTruck } from '@/services/trucksService';
import { listReports } from '@/services/reportsService';
import { computeTruckStats, formatMoney, formatNumberAr } from '@/utils/reportUtils';
import { useAuth } from '@/hooks/useAuth';

const emptyForm = () => ({ name: '', driver: '', phone: '', plateNumber: '', notes: '' });

export default function TrucksPage() {
  const [trucks, setTrucks] = useState([]);
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
    listTrucks().then(setTrucks);
    listReports().then((r) => { setReports(r); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim();
    return trucks.filter((t) => !q || t.name.includes(q) || (t.driver || '').includes(q));
  }, [trucks, query]);

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setModal(true); };
  const openEdit = (t) => { setForm({ ...t }); setEditId(t.id); setModal(true); };
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('اسم القلاب مطلوب'); return; }
    try {
      await saveTruck({ ...form, id: editId || undefined });
      toast.success(editId ? 'تم تعديل بيانات القلاب' : 'تم إضافة القلاب بنجاح');
      setModal(false);
      listTrucks().then(setTrucks);
    } catch (err) {
      toast.error(err.message || 'تعذّر حفظ بيانات القلاب');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTruck(confirmId);
      setConfirmId(null);
      toast.success('تم حذف القلاب');
      listTrucks().then(setTrucks);
    } catch (err) {
      toast.error(err.message || 'تعذّر حذف القلاب');
    }
  };

  const columns = [
    { key: 'name', header: 'اسم القلاب', render: (t) => <span className="font-medium">{t.name}</span> },
    { key: 'driver', header: 'السائق', render: (t) => t.driver || '—' },
    { key: 'phone', header: 'الهاتف', render: (t) => t.phone || '—' },
    { key: 'plateNumber', header: 'رقم اللوحة', render: (t) => t.plateNumber || '—' },
    {
      key: 'trips', header: 'عدد المشاوير',
      render: (t) => { const s = computeTruckStats(t.id, reports); return formatNumberAr(s.trips.length); },
    },
    {
      key: 'weight', header: 'إجمالي الوزن',
      render: (t) => { const s = computeTruckStats(t.id, reports); return s.totalWeight ? `${formatNumberAr(s.totalWeight)} طن` : '—'; },
    },
    {
      key: 'remaining', header: 'المتبقي',
      render: (t) => {
        const s = computeTruckStats(t.id, reports);
        return s.totalRemaining > 0
          ? <span className="font-semibold text-destructive">{formatMoney(s.totalRemaining)}</span>
          : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: 'actions', header: 'الإجراءات',
      render: (t) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/trucks/${t.id}`)} className="rounded p-2 hover:bg-secondary" title="تفاصيل">
            <Eye className="h-4 w-4" />
          </button>
          {canManage && (
            <><button onClick={() => openEdit(t)} className="rounded p-2 hover:bg-secondary" title="تعديل">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirmId(t.id)} className="rounded p-2 hover:bg-destructive/10 text-destructive" title="حذف">
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
        <title>القلابات — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="إدارة بيانات القلابات ومشاويرها." />
      </Helmet>

      <PageHeader
        title="القلابات"
        subtitle="بيانات القلابات وسجل المشاوير"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'القلابات' }]}
        actions={
          canManage && (
            <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> إضافة قلاب
          </Button>
          )
        }
      />

      <div className="app-card p-4 sm:p-6">
        <FilterBar className="mb-4">
          <Field label="بحث" className="sm:w-72">
            <SearchBar value={query} onChange={setQuery} placeholder="ابحث باسم القلاب أو السائق..." />
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
                title="لا توجد قلابات"
                description="ابدأ بإضافة قلاب جديد."
                action={<Button onClick={openAdd}><Plus className="h-4 w-4" /> إضافة قلاب</Button>}
              />
            }
          />
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'تعديل بيانات القلاب' : 'إضافة قلاب جديد'}
        footer={
          <>
            <Button onClick={handleSave}>{editId ? 'حفظ التعديلات' : 'إضافة'}</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>إلغاء</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="اسم القلاب *">
            <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثال: قلاب حمادة" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="اسم السائق">
              <TextInput value={form.driver} onChange={(e) => set({ driver: e.target.value })} placeholder="الاسم الكامل" />
            </Field>
            <Field label="رقم الهاتف">
              <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="01x..." />
            </Field>
          </div>
          <Field label="رقم اللوحة">
            <TextInput value={form.plateNumber} onChange={(e) => set({ plateNumber: e.target.value })} placeholder="أ ب ج 1234" />
          </Field>
          <Field label="ملاحظات">
            <TextInput value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="ملاحظات اختيارية" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="حذف القلاب"
        message="هل أنت متأكد من حذف هذا القلاب؟"
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
