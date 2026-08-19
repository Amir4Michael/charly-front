import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Printer, FileText } from 'lucide-react';
import {
  Button, DataTable, DateInput, EmptyState, Field, FilterBar, LoadingState,
  PageHeader, SearchBar, SelectInput, StatCard,
} from '@/components/common';
import { PAYMENT_METHODS } from '@/data/mockData';
import { getSettings } from '@/services/settingsService';
import { listReports } from '@/services/reportsService';
import { formatDateAr, formatMoney, formatNumberAr } from '@/utils/reportUtils';

export default function LoadingSalesPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [payment, setPayment] = useState('');

  useEffect(() => {
    listReports().then((r) => { setReports(r); setLoading(false); });
  }, []);

  const rows = useMemo(() => {
    const items = reports.flatMap((r) =>
      (r.loading || []).map((l) => ({ ...l, date: r.date, reportId: r.id })),
    );
    const q = query.trim();
    return items
      .filter((l) => {
        const matchQ = !q || (l.customer || '').includes(q) || (l.fineness || '').includes(q);
        const matchFrom = !from || l.date >= from;
        const matchTo = !to || l.date <= to;
        const matchPayment = !payment || l.payment === payment;
        return matchQ && matchFrom && matchTo && matchPayment;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [reports, query, from, to, payment]);

  const totals = useMemo(() => {
    const weight = rows.reduce((s, l) => s + (Number(l.weight) || 0), 0);
    const sales = rows.reduce((s, l) => s + (Number(l.weight) || 0) * (Number(l.price) || 0), 0);
    const remaining = rows.filter((l) => l.payment === 'آجل').reduce((s, l) => s + (Number(l.remaining) || 0), 0);
    return { count: rows.length, weight, sales, remaining };
  }, [rows]);

  const columns = [
    { key: 'date', header: 'التاريخ', render: (l) => formatDateAr(l.date) },
    { key: 'fineness', header: 'النوع', render: (l) => l.fineness || '—' },
    { key: 'weight', header: 'الوزن (طن)', render: (l) => formatNumberAr(l.weight) },
    { key: 'customer', header: 'العميل', render: (l) => l.customer || '—' },
    { key: 'packaging', header: 'العبوة', render: (l) => l.packaging || '—' },
    { key: 'price', header: 'السعر', render: (l) => formatMoney(l.price) },
    {
      key: 'total', header: 'الإجمالي',
      render: (l) => <span className="font-semibold">{formatMoney((Number(l.weight) || 0) * (Number(l.price) || 0))}</span>,
    },
    {
      key: 'payment', header: 'الدفع',
      render: (l) => (
        <span className={l.payment === 'آجل' ? 'text-destructive font-medium' : 'text-foreground'}>
          {l.payment}{l.payment === 'آجل' && Number(l.remaining) > 0 ? ` — متبقي ${formatMoney(l.remaining)}` : ''}
        </span>
      ),
    },
    {
      key: 'report', header: 'التقرير',
      render: (l) => (
        <a href={`/operations/daily-reports/${l.reportId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <FileText className="h-3 w-3" /> عرض
        </a>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>التحميل والمبيعات — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="سجل عمليات التحميل والمبيعات في مصنع كربونات الكالسيوم مجمّعة من كل التقارير اليومية." />
      </Helmet>

      <PageHeader
        title="التحميل والمبيعات"
        subtitle="كل عمليات التحميل والبيع المسجّلة عبر التقارير اليومية"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'الإنتاج والمبيعات' }, { label: 'التحميل والمبيعات' }]}
        actions={<Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="عدد عمليات التحميل" value={formatNumberAr(totals.count)} />
        <StatCard label="إجمالي الوزن المحمّل" value={formatNumberAr(totals.weight)} unit="طن" />
        <StatCard label="إجمالي المبيعات" value={formatMoney(totals.sales)} />
        <StatCard label="إجمالي المتبقي (آجل)" value={formatMoney(totals.remaining)} />
      </div>

      <div className="app-card p-4 sm:p-6">
        <FilterBar className="mb-4">
          <Field label="بحث" className="sm:w-56">
            <SearchBar value={query} onChange={setQuery} placeholder="عميل أو نوع..." />
          </Field>
          <Field label="طريقة الدفع" className="sm:w-40">
            <SelectInput options={PAYMENT_METHODS} value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="الكل" />
          </Field>
          <Field label="من تاريخ" className="sm:w-40">
            <DateInput value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="إلى تاريخ" className="sm:w-40">
            <DateInput value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Button variant="secondary" onClick={() => { setQuery(''); setFrom(''); setTo(''); setPayment(''); }}>
            مسح الفلاتر
          </Button>
        </FilterBar>

        {loading ? <LoadingState /> : (
          <DataTable columns={columns} rows={rows} empty={<EmptyState title="لا توجد عمليات تحميل مطابقة" />} />
        )}
      </div>

      <p className="hidden print:block print-sheet mt-4 text-center text-xs text-muted-foreground">{getSettings().factoryName} — كشف التحميل والمبيعات</p>
    </>
  );
}
