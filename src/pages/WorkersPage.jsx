import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, ConfirmDialog, DataTable, EmptyState, Field, FilterBar, LoadingState,
  Modal, PageHeader, SearchBar, SelectInput, TextInput,
} from '@/components/common';
import { listWorkers, saveWorker, deleteWorker } from '@/services/workersService';
import { listReports } from '@/services/reportsService';
import { computeWorkerStats, formatMoney, formatNumberAr } from '@/utils/reportUtils';
import { WORKER_JOBS } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';

const emptyForm = () => ({ name: '', job: '', phone: '', dailyRate: '', notes: '' });

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
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
    listWorkers().then(setWorkers);
    listReports().then((r) => { setReports(r); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim();
    return workers.filter((w) => !q || w.name.includes(q) || (w.job || '').includes(q));
  }, [workers, query]);

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setModal(true); };
  const openEdit = (w) => { setForm({ ...w }); setEditId(w.id); setModal(true); };
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('اسم العامل مطلوب'); return; }
    try {
      await saveWorker({ ...form, id: editId || undefined });
      toast.success(editId ? 'تم تعديل بيانات العامل' : 'تم إضافة العامل بنجاح');
      setModal(false);
      listWorkers().then(setWorkers);
    } catch (err) {
      toast.error(err.message || 'تعذّر حفظ بيانات العامل');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWorker(confirmId);
      setConfirmId(null);
      toast.success('تم حذف العامل');
      listWorkers().then(setWorkers);
    } catch (err) {
      toast.error(err.message || 'تعذّر حذف العامل');
    }
  };

  const columns = [
    { key: 'name', header: 'اسم العامل', render: (w) => <span className="font-medium">{w.name}</span> },
    { key: 'job', header: 'الوظيفة', render: (w) => w.job || '—' },
    { key: 'phone', header: 'الهاتف', render: (w) => w.phone || '—' },
    { key: 'dailyRate', header: 'اليومية', render: (w) => w.dailyRate ? formatMoney(w.dailyRate) : '—' },
    {
      key: 'days', header: 'أيام العمل',
      render: (w) => { const s = computeWorkerStats(w.id, reports); return formatNumberAr(s.totalDays); },
    },
    {
      key: 'due', header: 'المستحق',
      render: (w) => { const s = computeWorkerStats(w.id, reports); return s.totalDue > 0 ? formatMoney(s.totalDue) : '—'; },
    },
    {
      key: 'remaining', header: 'المتبقي',
      render: (w) => {
        const s = computeWorkerStats(w.id, reports);
        return s.totalRemaining > 0
          ? <span className="font-semibold text-destructive">{formatMoney(s.totalRemaining)}</span>
          : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: 'actions', header: 'الإجراءات',
      render: (w) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/workers/${w.id}`)} className="rounded p-2 hover:bg-secondary" title="تفاصيل">
            <Eye className="h-4 w-4" />
          </button>
          {canManage && (
            <><button onClick={() => openEdit(w)} className="rounded p-2 hover:bg-secondary" title="تعديل">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirmId(w.id)} className="rounded p-2 hover:bg-destructive/10 text-destructive" title="حذف">
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
        <title>العمال — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="إدارة بيانات العمال وحساباتهم." />
      </Helmet>

      <PageHeader
        title="العمال"
        subtitle="بيانات العمال وسجل أيام العمل"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'العمال' }]}
        actions={
          canManage && (
            <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> إضافة عامل
          </Button>
          )
        }
      />

      <div className="app-card p-4 sm:p-6">
        <FilterBar className="mb-4">
          <Field label="بحث" className="sm:w-72">
            <SearchBar value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الوظيفة..." />
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
                title="لا يوجد عمال"
                description="ابدأ بإضافة عامل جديد."
                action={<Button onClick={openAdd}><Plus className="h-4 w-4" /> إضافة عامل</Button>}
              />
            }
          />
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'تعديل بيانات العامل' : 'إضافة عامل جديد'}
        footer={
          <>
            <Button onClick={handleSave}>{editId ? 'حفظ التعديلات' : 'إضافة'}</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>إلغاء</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="اسم العامل *">
            <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="الاسم الكامل" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الوظيفة">
              <SelectInput
                options={WORKER_JOBS}
                value={form.job}
                onChange={(e) => set({ job: e.target.value })}
                placeholder="اختر الوظيفة"
              />
            </Field>
            <Field label="رقم الهاتف">
              <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="01x..." />
            </Field>
          </div>
          <Field label="اليومية (ج.م)">
            <TextInput type="number" value={form.dailyRate} onChange={(e) => set({ dailyRate: e.target.value })} placeholder="0" />
          </Field>
          <Field label="ملاحظات">
            <TextInput value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="ملاحظات اختيارية" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="حذف العامل"
        message="هل أنت متأكد من حذف هذا العامل؟"
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
