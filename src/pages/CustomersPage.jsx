import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, ConfirmDialog, DataTable, EmptyState, Field, FilterBar, LoadingState,
  Modal, PageHeader, SearchBar, SectionCard, TextInput,
} from '@/components/common';
import { deleteCustomer, listCustomers, saveCustomer } from '@/services/customersService';
import { listReports } from '@/services/reportsService';
import { computeCustomerStats, formatMoney } from '@/utils/reportUtils';
import { useAuth } from '@/hooks/useAuth';

const emptyForm = () => ({ name: '', phone: '', address: '', contactPerson: '', notes: '' });

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
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
    listCustomers().then(setCustomers);
    listReports().then((r) => { setReports(r); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = query.trim();
    return customers.filter((c) => !q || c.name.includes(q) || (c.phone || '').includes(q));
  }, [customers, query]);

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setModal(true); };
  const openEdit = (c) => { setForm({ ...c }); setEditId(c.id); setModal(true); };
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('اسم العميل مطلوب'); return; }
    try {
      await saveCustomer({ ...form, id: editId || undefined });
      toast.success(editId ? 'تم تعديل بيانات العميل' : 'تم إضافة العميل بنجاح');
      setModal(false);
      listCustomers().then(setCustomers);
    } catch (err) {
      toast.error(err.message || 'تعذّر حفظ بيانات العميل');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(confirmId);
      setConfirmId(null);
      toast.success('تم حذف العميل');
      listCustomers().then(setCustomers);
    } catch (err) {
      toast.error(err.message || 'تعذّر حذف العميل');
    }
  };

  const columns = [
    { key: 'name', header: 'اسم العميل', render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'phone', header: 'الهاتف', render: (c) => c.phone || '—' },
    { key: 'address', header: 'العنوان', render: (c) => c.address || '—' },
    {
      key: 'totalSales', header: 'إجمالي المبيعات',
      render: (c) => { const s = computeCustomerStats(c.id, reports); return formatMoney(s.totalSales); },
    },
    {
      key: 'remaining', header: 'المتبقي (آجل)',
      render: (c) => {
        const s = computeCustomerStats(c.id, reports);
        return s.totalRemaining > 0
          ? <span className="font-semibold text-destructive">{formatMoney(s.totalRemaining)}</span>
          : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: 'actions', header: 'الإجراءات',
      render: (c) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/customers/${c.id}`)} className="rounded p-2 hover:bg-secondary" title="تفاصيل">
            <Eye className="h-4 w-4" />
          </button>
          {canManage && (
            <><button onClick={() => openEdit(c)} className="rounded p-2 hover:bg-secondary" title="تعديل">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirmId(c.id)} className="rounded p-2 hover:bg-destructive/10 text-destructive" title="حذف">
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
        <title>العملاء — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="إدارة بيانات وحسابات عملاء مصنع كربونات الكالسيوم." />
      </Helmet>

      <PageHeader
        title="العملاء"
        subtitle="إدارة بيانات وحسابات العملاء"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'العملاء' }]}
        actions={
          canManage && (
            <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> إضافة عميل
          </Button>
          )
        }
      />

      <div className="app-card p-4 sm:p-6">
        <FilterBar className="mb-4">
          <Field label="بحث" className="sm:w-72">
            <SearchBar value={query} onChange={setQuery} placeholder="ابحث بالاسم أو الهاتف..." />
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
                title="لا يوجد عملاء"
                description="ابدأ بإضافة عميل جديد."
                action={<Button onClick={openAdd}><Plus className="h-4 w-4" /> إضافة عميل</Button>}
              />
            }
          />
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
        footer={
          <>
            <Button onClick={handleSave}>{editId ? 'حفظ التعديلات' : 'إضافة'}</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>إلغاء</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="اسم العميل *">
            <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="اسم الشركة أو العميل" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="رقم الهاتف">
              <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="01x..." />
            </Field>
            <Field label="الشخص المسؤول">
              <TextInput value={form.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} placeholder="اسم المسؤول" />
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
        title="حذف العميل"
        message="هل أنت متأكد من حذف هذا العميل؟ لن يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
