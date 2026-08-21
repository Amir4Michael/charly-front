import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Pencil, Trash2, Mountain, Weight, Truck, Search, Phone, User, MapPin, FileText
} from 'lucide-react';
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

  // حاسبة إحصائيات عامة للعرض العلوي
  const totalStats = useMemo(() => {
    let weight = 0;
    let deliveriesCount = 0;
    quarries.forEach((q) => {
      const s = computeQuarryStats(q.id, reports);
      weight += s.totalWeight || 0;
      deliveriesCount += s.deliveries?.length || 0;
    });
    return { weight, deliveriesCount };
  }, [quarries, reports]);

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
    {
      key: 'name',
      header: 'اسم الكسارة',
      render: (q) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Mountain className="h-4 w-4" />
          </div>
          <button
            type="button"
            onClick={() => navigate(`/quarries/${q.id}`)}
            className="font-semibold text-right transition-colors hover:text-primary hover:underline focus:outline-none"
            title="عرض تفاصيل الكسارة"
          >
            {q.name}
          </button>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'المالك',
      render: (q) => (
        <span className="text-muted-foreground font-medium">
          {q.owner ? (
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {q.owner}
            </span>
          ) : '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'الهاتف',
      render: (q) => (
        <span className="font-mono text-sm dir-ltr text-right block">
          {q.phone ? (
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              {q.phone}
            </span>
          ) : '—'}
        </span>
      ),
    },
    {
      key: 'totalWeight',
      header: 'إجمالي الخامة',
      render: (q) => {
        const s = computeQuarryStats(q.id, reports);
        return s.totalWeight > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            {formatNumberAr(s.totalWeight)} طن
          </span>
        ) : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: 'deliveries',
      header: 'عدد التوريدات',
      render: (q) => {
        const s = computeQuarryStats(q.id, reports);
        return (
          <span className="inline-flex items-center gap-1 font-medium bg-secondary px-2.5 py-1 rounded-md text-secondary-foreground border border-border">
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
            {formatNumberAr(s.deliveries.length)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (q) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/quarries/${q.id}`)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none"
            title="عرض التفاصيل"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canManage && (
            <>
              <button
                onClick={() => openEdit(q)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-amber-600 focus:outline-none"
                title="تعديل"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmId(q.id)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none"
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
        <title>الكسارات — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="إدارة بيانات الكسارات وسجل التوريدات." />
      </Helmet>

      <PageHeader
        title="الكسارات"
        subtitle="بيانات ومؤشرات الكسارات المورِّدة للخامة"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'الكسارات' }]}
        actions={
          canManage && (
            <Button onClick={openAdd} className="shadow-sm gap-2">
              <Plus className="h-4 w-4" /> إضافة كسارة جديد
            </Button>
          )
        }
      />

      {/* كروت المؤشرات السريعة top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="app-card p-4 flex items-center gap-4 border border-border/60 hover:border-primary/30 transition-all shadow-sm">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Mountain className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">إجمالي الكسارات</p>
            <p className="text-xl font-bold tracking-tight mt-0.5">{formatNumberAr(quarries.length)} كسارة</p>
          </div>
        </div>

        <div className="app-card p-4 flex items-center gap-4 border border-border/60 hover:border-emerald-500/30 transition-all shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Weight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">إجمالي الخام المورد</p>
            <p className="text-xl font-bold tracking-tight mt-0.5 text-emerald-600 dark:text-emerald-400">
              {formatNumberAr(totalStats.weight)} طن
            </p>
          </div>
        </div>

        <div className="app-card p-4 flex items-center gap-4 border border-border/60 hover:border-blue-500/30 transition-all shadow-sm">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">إجمالي عمليات التوريد</p>
            <p className="text-xl font-bold tracking-tight mt-0.5">{formatNumberAr(totalStats.deliveriesCount)} توريدة</p>
          </div>
        </div>
      </div>

      <div className="app-card p-4 sm:p-6 shadow-sm border border-border/60">
        <FilterBar className="mb-5 pb-4 border-b border-border/40 flex flex-wrap items-center justify-between gap-4">
          <Field label="بحث في القائمة" className="w-full sm:w-80">
            <SearchBar value={query} onChange={setQuery} placeholder="ابحث باسم الكسارة أو المالك..." />
          </Field>
          {query && (
            <div className="text-xs text-muted-foreground self-end mb-2">
              نتائج البحث: <span className="font-semibold text-foreground">{formatNumberAr(rows.length)}</span> كسارة
            </div>
          )}
        </FilterBar>

        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty={
              <EmptyState
                title="لا توجد كسارات مطابقة"
                description={query ? "لم نجد أي كسارة تطابق بحثك، جرّب كلمة بحث أخرى." : "ابدأ بإضافة كسارة جديدة للنظام."}
                action={
                  canManage && (
                    <Button onClick={openAdd} className="gap-2">
                      <Plus className="h-4 w-4" /> إضافة كسارة
                    </Button>
                  )
                }
              />
            }
          />
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={
          <div className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            <span>{editId ? 'تعديل بيانات الكسارة' : 'إضافة كسارة جديدة'}</span>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 w-full pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>إلغاء</Button>
            <Button onClick={handleSave} className="shadow-sm">{editId ? 'حفظ التعديلات' : 'إضافة'}</Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <Field label="اسم الكسارة *">
            <TextInput
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="مثال: كسارة المنيا الكبرى"
              autoFocus
            />
          </Field>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="اسم المالك">
              <TextInput
                value={form.owner}
                onChange={(e) => set({ owner: e.target.value })}
                placeholder="مثال: الحاج أحمد"
              />
            </Field>
            <Field label="رقم الهاتف">
              <TextInput
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
                placeholder="01xxxxxxxxx"
              />
            </Field>
          </div>

          <Field label="العنوان / الموقع">
            <TextInput
              value={form.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="المدينة — المنطقة — المحافظة"
            />
          </Field>

          <Field label="ملاحظات إضافية">
            <TextInput
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="أي ملاحظات أو تفاصيل أخرى خاصة بالكسارة..."
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="حذف الكسارة"
        message="هل أنت متأكد من حذف هذه الكسارة؟ سيتم إزالتها من القائمة ولن يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}