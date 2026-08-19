import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Trash2, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, ConfirmDialog, DataTable, DateInput, EmptyState, Field, FilterBar, LoadingState,
  Modal, PageHeader, SearchBar, SectionCard, SelectInput, StatCard, TextInput,
} from '@/components/common';
import { EXPENSE_CATEGORIES, EXPENSE_TYPES } from '@/data/mockData';
import { getSettings } from '@/services/settingsService';
import { listReports } from '@/services/reportsService';
import { deleteExpense, listExpenses, saveExpense } from '@/services/expensesService';
import { formatDateAr, formatMoney, todayISO } from '@/utils/reportUtils';
import { useAuth } from '@/hooks/useAuth';

const emptyForm = () => ({ date: todayISO(), category: '', type: '', amount: '', entity: '', notes: '' });

function startOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
function startOfMonth(dateStr) {
  return dateStr.slice(0, 7) + '-01';
}

export default function ExpensesPage() {
  const [reports, setReports] = useState([]);
  const [standalone, setStandalone] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [category, setCategory] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [confirmId, setConfirmId] = useState(null);
  const { canManage } = useAuth();

  const load = () => {
    listExpenses().then(setStandalone);
    listReports().then((r) => { setReports(r); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const allExpenses = useMemo(() => {
    const fromReports = reports.flatMap((r) =>
      (r.expenses || []).map((e) => ({ ...e, date: r.date, source: 'report', reportId: r.id })),
    );
    const fromStandalone = standalone.map((e) => ({ ...e, source: 'standalone' }));
    return [...fromReports, ...fromStandalone].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [reports, standalone]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return allExpenses.filter((e) => {
      const matchQ = !q || (e.type || '').includes(q) || (e.entity || '').includes(q) || (e.notes || '').includes(q);
      const matchFrom = !from || e.date >= from;
      const matchTo = !to || e.date <= to;
      const matchCat = !category || e.category === category;
      return matchQ && matchFrom && matchTo && matchCat;
    });
  }, [allExpenses, query, from, to, category]);

  const totals = useMemo(() => {
    const today = todayISO();
    const wStart = startOfWeek(today);
    const mStart = startOfMonth(today);
    const sum = (list) => list.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return {
      day: sum(allExpenses.filter((e) => e.date === today)),
      week: sum(allExpenses.filter((e) => e.date >= wStart)),
      month: sum(allExpenses.filter((e) => e.date >= mStart)),
      filtered: sum(filtered),
    };
  }, [allExpenses, filtered]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error('يجب إدخال مبلغ صحيح'); return; }
    try {
      await saveExpense(form);
      toast.success('تم إضافة المصروف');
      setModal(false);
      setForm(emptyForm());
      load();
    } catch (err) {
      toast.error(err.message || 'تعذّر إضافة المصروف');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteExpense(confirmId);
      setConfirmId(null);
      toast.success('تم حذف المصروف');
      load();
    } catch (err) {
      toast.error(err.message || 'تعذّر حذف المصروف');
    }
  };

  const columns = [
    { key: 'date', header: 'التاريخ', render: (e) => formatDateAr(e.date) },
    { key: 'category', header: 'القسم', render: (e) => e.category || '—' },
    { key: 'type', header: 'نوع المصروف', render: (e) => e.type || '—' },
    { key: 'entity', header: 'الجهة / الشخص', render: (e) => e.entity || '—' },
    { key: 'amount', header: 'المبلغ', render: (e) => <span className="font-semibold">{formatMoney(e.amount)}</span> },
    {
      key: 'source', header: 'المصدر',
      render: (e) => (
        e.source === 'report'
          ? <a href={`/operations/daily-reports/${e.reportId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><FileText className="h-3 w-3" /> من التقرير اليومي</a>
          : <span className="text-xs text-muted-foreground">مصروف عام</span>
      ),
    },
    ...(canManage ? [{
      key: 'actions', header: 'الإجراءات',
      render: (e) => e.source === 'standalone' ? (
        <button onClick={() => setConfirmId(e.id)} className="rounded p-2 text-destructive hover:bg-destructive/10" title="حذف">
          <Trash2 className="h-4 w-4" />
        </button>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    }] : []),
  ];

  return (
    <>
      <Helmet>
        <title>المصاريف — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="متابعة وتسجيل مصاريف مصنع كربونات الكالسيوم اليومية والأسبوعية والشهرية." />
      </Helmet>

      <PageHeader
        title="المصاريف"
        subtitle="سجل كامل بمصاريف المصنع من التقارير اليومية والمصاريف العامة"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'المالية' }, { label: 'المصاريف' }]}
        actions={canManage && (
          <>
            <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>
            <Button onClick={() => { setForm(emptyForm()); setModal(true); }}><Plus className="h-4 w-4" /> إضافة مصروف</Button>
          </>
        )}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="مصاريف اليوم" value={formatMoney(totals.day)} />
        <StatCard label="مصاريف الأسبوع" value={formatMoney(totals.week)} />
        <StatCard label="مصاريف الشهر" value={formatMoney(totals.month)} />
        <StatCard label="إجمالي حسب الفلتر الحالي" value={formatMoney(totals.filtered)} />
      </div>

      <div className="app-card p-4 sm:p-6">
        <FilterBar className="mb-4">
          <Field label="بحث" className="sm:w-56">
            <SearchBar value={query} onChange={setQuery} placeholder="نوع، جهة، ملاحظات..." />
          </Field>
          <Field label="القسم" className="sm:w-44">
            <SelectInput options={EXPENSE_CATEGORIES} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="كل الأقسام" />
          </Field>
          <Field label="من تاريخ" className="sm:w-40">
            <DateInput value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="إلى تاريخ" className="sm:w-40">
            <DateInput value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Button variant="secondary" onClick={() => { setQuery(''); setFrom(''); setTo(''); setCategory(''); }}>
            مسح الفلاتر
          </Button>
        </FilterBar>

        {loading ? <LoadingState /> : (
          <DataTable
            columns={columns}
            rows={filtered}
            empty={<EmptyState title="لا توجد مصاريف مطابقة" description="جرّب تغيير الفلاتر أو أضف مصروفًا جديدًا." />}
          />
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="إضافة مصروف"
        footer={
          <>
            <Button onClick={handleSave}>حفظ</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>إلغاء</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="التاريخ">
            <DateInput value={form.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="القسم">
              <SelectInput options={EXPENSE_CATEGORIES} value={form.category} onChange={(e) => set({ category: e.target.value })} />
            </Field>
            <Field label="نوع المصروف">
              <SelectInput options={EXPENSE_TYPES} value={form.type} onChange={(e) => set({ type: e.target.value })} />
            </Field>
          </div>
          <Field label="المبلغ">
            <TextInput type="number" value={form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0" />
          </Field>
          <Field label="الجهة / الشخص">
            <TextInput value={form.entity} onChange={(e) => set({ entity: e.target.value })} placeholder="اختياري" />
          </Field>
          <Field label="ملاحظات">
            <TextInput value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="اختياري" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="حذف المصروف"
        message="هل أنت متأكد من حذف هذا المصروف؟"
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />

      <p className="hidden print:block print-sheet mt-4 text-center text-xs text-muted-foreground">{getSettings().factoryName} — كشف المصاريف</p>
    </>
  );
}
