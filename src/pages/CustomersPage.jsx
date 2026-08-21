import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Phone, 
  User, 
  Users, 
  Building2, 
  MapPin, 
  DollarSign, 
  CreditCard, 
  FileText,
  Search,
  UserCheck
} from 'lucide-react';
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

  // إحصائيات سريعة للبطاقات العلوية
  const kpiStats = useMemo(() => {
    let totalSalesSum = 0;
    let totalRemainingSum = 0;
    customers.forEach((c) => {
      const s = computeCustomerStats(c.id, reports);
      totalSalesSum += s.totalSales || 0;
      totalRemainingSum += s.totalRemaining || 0;
    });
    return {
      count: customers.length,
      totalSales: totalSalesSum,
      totalRemaining: totalRemainingSum,
    };
  }, [customers, reports]);

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
    {
      key: 'name',
      header: 'اسم العميل / الشركة',
      render: (c) => (
        <div className="flex items-center gap-2.5 py-1">
          <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
            <Building2 className="h-4 w-4" />
          </div>
          <button
            type="button"
            onClick={() => navigate(`/customers/${c.id}`)}
            className="font-bold text-right hover:underline hover:text-primary transition-colors text-foreground"
            title="عرض تفاصيل العميل"
          >
            {c.name}
          </button>
        </div>
      ),
    },
    { 
      key: 'phone', 
      header: 'الهاتف', 
      render: (c) => c.phone ? (
        <div className="flex items-center gap-1.5 dir-ltr justify-end text-muted-foreground">
          <span>{c.phone}</span>
          <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
        </div>
      ) : <span className="text-muted-foreground">—</span> 
    },
    { 
      key: 'address', 
      header: 'العنوان', 
      render: (c) => c.address ? (
        <div className="flex items-center gap-1.5 text-muted-foreground max-w-[200px] truncate">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
          <span className="truncate">{c.address}</span>
        </div>
      ) : <span className="text-muted-foreground">—</span> 
    },
    {
      key: 'totalSales', 
      header: 'إجمالي المبيعات',
      render: (c) => { 
        const s = computeCustomerStats(c.id, reports); 
        return <span className="font-semibold text-foreground">{formatMoney(s.totalSales)}</span>; 
      },
    },
    {
      key: 'remaining', 
      header: 'المتبقي (آجل)',
      render: (c) => {
        const s = computeCustomerStats(c.id, reports);
        return s.totalRemaining > 0
          ? <span className="font-black text-destructive inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-destructive/10">{formatMoney(s.totalRemaining)}</span>
          : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: 'actions', 
      header: 'الإجراءات',
      render: (c) => (
        <div className="flex items-center gap-1 justify-end">
          <button 
            onClick={() => navigate(`/customers/${c.id}`)} 
            className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" 
            title="عرض التفاصيل"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canManage && (
            <>
              <button 
                onClick={() => openEdit(c)} 
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" 
                title="تعديل"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setConfirmId(c.id)} 
                className="rounded-lg p-2 text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors" 
                title="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
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
        subtitle="إدارة بيانات، كشوفات وشراء عملاء المصنع"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'العملاء' }]}
        actions={
          canManage && (
            <Button onClick={openAdd} className="gap-2 shadow-sm font-semibold">
              <Plus className="h-4 w-4" /> إضافة عميل جديد
            </Button>
          )
        }
      />

      {/* Top KPI Summary Grid */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">إجمالي العملاء المسجلين</p>
            <p className="text-2xl font-black text-foreground mt-1">{kpiStats.count}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">إجمالي المبيعات للعملاء</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatMoney(kpiStats.totalSales)}</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">إجمالي المتبقي (الآجل)</p>
            <p className="text-2xl font-black text-destructive mt-1">{formatMoney(kpiStats.totalRemaining)}</p>
          </div>
          <div className="rounded-xl bg-destructive/10 p-3 text-destructive">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="app-card rounded-xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs space-y-4">
        <FilterBar className="mb-2">
          <Field label="البحث عن عميل" className="sm:w-80">
            <SearchBar value={query} onChange={setQuery} placeholder="ابحث بالاسم أو رقم الهاتف..." />
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
                description="لم يتم إضافة أي عملاء حتى الآن، أضف أول عميل للبدء."
                action={
                  canManage && (
                    <Button onClick={openAdd} className="gap-2">
                      <Plus className="h-4 w-4" /> إضافة عميل
                    </Button>
                  )
                }
              />
            }
          />
        )}
      </div>

      {/* Modal - Add / Edit Customer */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
        footer={
          <div className="flex items-center gap-2 justify-end w-full">
            <Button onClick={handleSave} className="gap-2 font-semibold">
              {editId ? 'حفظ التعديلات' : 'إضافة العميل'}
            </Button>
            <Button variant="secondary" onClick={() => setModal(false)}>إلغاء</Button>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          <Field label="اسم العميل / الشركة *">
            <TextInput 
              value={form.name} 
              onChange={(e) => set({ name: e.target.value })} 
              placeholder="مثال: شركة الأمل للمقاولات" 
              autoFocus 
            />
          </Field>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="رقم الهاتف">
              <TextInput 
                value={form.phone} 
                onChange={(e) => set({ phone: e.target.value })} 
                placeholder="01xxxxxxxxx" 
              />
            </Field>
            
            <Field label="الشخص المسؤول">
              <TextInput 
                value={form.contactPerson} 
                onChange={(e) => set({ contactPerson: e.target.value })} 
                placeholder="اسم المهندس أو المسؤول" 
              />
            </Field>
          </div>

          <Field label="العنوان">
            <TextInput 
              value={form.address} 
              onChange={(e) => set({ address: e.target.value })} 
              placeholder="المدينة — المنطقة — الشارع" 
            />
          </Field>

          <Field label="ملاحظات إضافية">
            <TextInput 
              value={form.notes} 
              onChange={(e) => set({ notes: e.target.value })} 
              placeholder="أي تفاصيل أخرى خاصة بالعميل..." 
            />
          </Field>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmId)}
        title="حذف العميل"
        message="هل أنت متأكد من حذف هذا العميل؟ لن يمكنك التراجع عن هذا الإجراء وسيظل سجل الفواتير القديمة محتفظاً بالبيانات."
        confirmLabel="حذف نهائي"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}