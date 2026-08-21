import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Pencil, Trash2, Truck, Navigation, Weight, DollarSign, Phone, User, Tag, FileText, Search
} from 'lucide-react';
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

  // حاسبة إحصائيات القلابات للعرض الإجمالي
  const totalStats = useMemo(() => {
    let trips = 0;
    let weight = 0;
    let remaining = 0;
    trucks.forEach((t) => {
      const s = computeTruckStats(t.id, reports);
      trips += s.trips?.length || 0;
      weight += s.totalWeight || 0;
      remaining += s.totalRemaining || 0;
    });
    return { trips, weight, remaining };
  }, [trucks, reports]);

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
    {
      key: 'name',
      header: 'اسم القلاب',
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
            <Truck className="h-4 w-4" />
          </div>
          <button
            type="button"
            onClick={() => navigate(`/trucks/${t.id}`)}
            className="font-bold text-slate-800 text-right transition-colors hover:text-primary focus:outline-none"
            title="عرض تفاصيل القلاب"
          >
            {t.name}
          </button>
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'السائق',
      render: (t) => (
        <span className="text-slate-600 font-medium text-sm">
          {t.driver ? (
            <span className="inline-flex items-center gap-1.5 text-slate-800">
              <User className="h-3.5 w-3.5 text-slate-400" />
              {t.driver}
            </span>
          ) : <span className="text-slate-400 font-normal">—</span>}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'الهاتف',
      render: (t) => (
        <span className="font-mono text-xs dir-ltr text-right block">
          {t.phone ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/60 px-2.5 py-1 text-slate-700 font-medium">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {t.phone}
            </span>
          ) : <span className="text-slate-400 font-normal">—</span>}
        </span>
      ),
    },
    {
      key: 'plateNumber',
      header: 'رقم اللوحة',
      render: (t) => t.plateNumber ? (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80">
          <Tag className="h-3 w-3 text-slate-400" />
          {t.plateNumber}
        </span>
      ) : <span className="text-slate-400 font-normal">—</span>,
    },
    {
      key: 'trips',
      header: 'عدد المشاوير',
      render: (t) => {
        const s = computeTruckStats(t.id, reports);
        return (
          <span className="inline-flex items-center gap-1 font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200/60 text-xs">
            <Navigation className="h-3.5 w-3.5 text-blue-500" />
            {formatNumberAr(s.trips.length)}
          </span>
        );
      },
    },
    {
      key: 'weight',
      header: 'إجمالي الوزن',
      render: (t) => {
        const s = computeTruckStats(t.id, reports);
        return s.totalWeight ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 text-xs">
            {formatNumberAr(s.totalWeight)} طن
          </span>
        ) : <span className="text-slate-400 font-normal">—</span>;
      },
    },
    {
      key: 'remaining',
      header: 'المتبقي',
      render: (t) => {
        const s = computeTruckStats(t.id, reports);
        return s.totalRemaining > 0 ? (
          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60 text-xs">
            {formatMoney(s.totalRemaining)}
          </span>
        ) : <span className="text-slate-400 font-normal">—</span>;
      },
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (t) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/trucks/${t.id}`)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
            title="تفاصيل"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canManage && (
            <>
              <button
                onClick={() => openEdit(t)}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600 focus:outline-none"
                title="تعديل"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmId(t.id)}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none"
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
        <title>القلابات — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="إدارة بيانات القلابات ومشاويرها." />
      </Helmet>

      <div className="space-y-6 pb-12 dir-rtl text-right">
        <PageHeader
          title="القلابات"
          subtitle="بيانات القلابات وسجل المشاوير والنقل"
          breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'القلابات' }]}
          actions={
            canManage && (
              <Button 
                onClick={openAdd} 
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <Plus className="h-4 w-4" /> 
                <span>إضافة قلاب جديد</span>
              </Button>
            )
          }
        />

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">إجمالي القلابات</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">{formatNumberAr(trucks.length)} <span className="text-xs font-normal text-slate-500">قلاب</span></p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Navigation className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">إجمالي المشاوير</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">{formatNumberAr(totalStats.trips)} <span className="text-xs font-normal text-slate-500">مشوار</span></p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Weight className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">إجمالي أوزان النقل</p>
              <p className="text-2xl font-bold tracking-tight text-emerald-700 mt-0.5">
                {formatNumberAr(totalStats.weight)} <span className="text-xs font-normal text-slate-500">طن</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">إجمالي المتبقي للقلابات</p>
              <p className="text-2xl font-bold tracking-tight text-rose-600 mt-0.5">
                {formatMoney(totalStats.remaining)}
              </p>
            </div>
          </div>
        </div>

        {/* Data & Table Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <FilterBar className="mb-6 pb-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <Field label="بحث في القائمة" className="w-full sm:w-80">
              <SearchBar 
                value={query} 
                onChange={setQuery} 
                placeholder="ابحث باسم القلاب أو السائق..." 
                className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20"
              />
            </Field>
            {query && (
              <div className="text-xs text-slate-500 self-end mb-2">
                نتائج البحث: <span className="font-bold text-slate-900">{formatNumberAr(rows.length)}</span> قلاب
              </div>
            )}
          </FilterBar>

          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <LoadingState />
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <DataTable
                columns={columns}
                rows={rows}
                empty={
                  <EmptyState
                    title="لا توجد قلابات مطابقة"
                    description={query ? "لم نجد أي قلاب يطابق بحثك، جرّب كلمة بحث أخرى." : "ابدأ بإضافة قلاب جديد بالنظام."}
                    action={
                      canManage && (
                        <Button onClick={openAdd} className="gap-2 rounded-xl">
                          <Plus className="h-4 w-4" /> إضافة قلاب
                        </Button>
                      )
                    }
                  />
                }
              />
            </div>
          )}
        </div>

        {/* Form Modal */}
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title={
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="h-4 w-4" />
              </div>
              <span>{editId ? 'تعديل بيانات القلاب' : 'إضافة قلاب جديد'}</span>
            </div>
          }
          footer={
            <div className="flex items-center justify-end gap-2 w-full pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setModal(false)} className="rounded-xl">إلغاء</Button>
              <Button onClick={handleSave} className="rounded-xl shadow-sm">{editId ? 'حفظ التعديلات' : 'إضافة القلاب'}</Button>
            </div>
          }
        >
          <div className="space-y-4 py-2 text-right">
            <Field label="اسم القلاب *">
              <TextInput
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="مثال: قلاب أبو علي"
                autoFocus
                className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="اسم السائق">
                <TextInput
                  value={form.driver}
                  onChange={(e) => set({ driver: e.target.value })}
                  placeholder="الاسم الكامل للسائق"
                  className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20"
                />
              </Field>
              <Field label="رقم الهاتف">
                <TextInput
                  value={form.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20"
                />
              </Field>
            </div>

            <Field label="رقم اللوحة">
              <TextInput
                value={form.plateNumber}
                onChange={(e) => set({ plateNumber: e.target.value })}
                placeholder="أ ب ج 1234"
                className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20"
              />
            </Field>

            <Field label="ملاحظات إضافية">
              <TextInput
                value={form.notes}
                onChange={(e) => set({ notes: e.target.value })}
                placeholder="أي ملاحظات أو تفاصيل أخرى خاصة بالقلاب..."
                className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20"
              />
            </Field>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={Boolean(confirmId)}
          title="حذف القلاب"
          message="هل أنت متأكد من حذف هذا القلاب؟ سيتم إزالته من القائمة ولن يمكن التراجع عن هذا الإجراء."
          confirmLabel="حذف"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      </div>
    </>
  );
}