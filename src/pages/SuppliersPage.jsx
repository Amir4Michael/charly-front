import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, ConfirmDialog, DataTable, EmptyState, Field, FilterBar, LoadingState,
  Modal, PageHeader, SearchBar, TextInput,
} from '@/components/common';
import { listSuppliers, saveSupplier, deleteSupplier, SUPPLIER_TYPE_LABELS } from '@/services/suppliersService';
import { useAuth } from '@/hooks/useAuth';

const emptyForm = () => ({ name: '', contactPerson: '', phone: '', address: '', notes: '' });

/**
 * صفحة موحّدة لإدارة الموردين الجدد (الشكاير/البالتات الخشب/الجامبو) — نفس نمط الـCRUD
 * الحقيقي المستخدم في QuarriesPage.jsx بالضبط (بحث، إضافة، تعديل، حذف، تخزين حقيقي في
 * MongoDB)، بدون عمود كشف حساب لأنه لا يوجد ربط حالي بين هؤلاء الموردين وأي معاملة
 * داخل التقرير اليومي (موثّق بالتفصيل في backend/src/models/Supplier.js).
 */
export default function SuppliersPage() {
  const { type } = useParams();
  const meta = SUPPLIER_TYPE_LABELS[type];

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const { canManage } = useAuth();

  const load = () => {
    setLoading(true);
    listSuppliers(type).then((list) => { setSuppliers(list); setLoading(false); });
  };

  useEffect(() => { load(); }, [type]);

  const rows = useMemo(() => {
    const q = query.trim();
    return suppliers.filter((x) => !q || x.name.includes(q) || (x.contactPerson || '').includes(q));
  }, [suppliers, query]);

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setModal(true); };
  const openEdit = (s) => { setForm({ ...s }); setEditId(s.id); setModal(true); };
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('اسم المورد مطلوب'); return; }
    try {
      await saveSupplier(type, { ...form, id: editId || undefined });
      toast.success(editId ? 'تم تعديل بيانات المورد' : 'تمت إضافة المورد بنجاح');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.message || 'تعذّر حفظ بيانات المورد');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSupplier(type, confirmId);
      setConfirmId(null);
      toast.success('تم حذف المورد');
      load();
    } catch (err) {
      toast.error(err.message || 'تعذّر حذف المورد');
    }
  };

  if (!meta) {
    return <EmptyState title="نوع مورد غير معروف" description="تحقق من الرابط المستخدم." />;
  }

  const columns = [
    { key: 'name', header: 'اسم المورد', render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'contactPerson', header: 'جهة الاتصال', render: (s) => s.contactPerson || '—' },
    { key: 'phone', header: 'الهاتف', render: (s) => s.phone || '—' },
    { key: 'address', header: 'العنوان', render: (s) => s.address || '—' },
    ...(canManage ? [{
      key: 'actions', header: 'الإجراءات',
      render: (s) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(s)} className="rounded p-2 hover:bg-secondary" title="تعديل">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirmId(s.id)} className="rounded p-2 text-destructive hover:bg-destructive/10" title="حذف">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <>
      <Helmet>
        <title>{meta.title} — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content={`إدارة بيانات ${meta.title}.`} />
      </Helmet>

      <PageHeader
        title={meta.title}
        subtitle={`بيانات ${meta.title} — إضافة وتعديل وحذف`}
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'الموردون' }, { label: meta.title }]}
        actions={canManage && <Button onClick={openAdd}><Plus className="h-4 w-4" /> إضافة {meta.singular}</Button>}
      />

      <div className="app-card p-4 sm:p-6">
        <FilterBar className="mb-4">
          <Field label="بحث" className="sm:w-72">
            <SearchBar value={query} onChange={setQuery} placeholder={meta.searchHint} />
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
                title={`لا يوجد ${meta.title}`}
                description={`ابدأ بإضافة ${meta.singular} جديد.`}
                action={canManage && <Button onClick={openAdd}><Plus className="h-4 w-4" /> إضافة {meta.singular}</Button>}
              />
            }
          />
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? `تعديل بيانات ${meta.singular}` : `إضافة ${meta.singular} جديد`}
        footer={
          <>
            <Button onClick={handleSave}>{editId ? 'حفظ التعديلات' : 'إضافة'}</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>إلغاء</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="اسم المورد *">
            <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="اسم الشركة أو المورد" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="جهة الاتصال">
              <TextInput value={form.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} placeholder="اسم المسؤول" />
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
        title={`حذف ${meta.singular}`}
        message="هل أنت متأكد من الحذف؟ لن يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}