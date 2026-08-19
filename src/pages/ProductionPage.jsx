import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Printer, FileText } from 'lucide-react';
import {
  Button, DataTable, DateInput, EmptyState, Field, FilterBar, LoadingState,
  PageHeader, SearchBar, SelectInput, StatCard,
} from '@/components/common';
import { listReports } from '@/services/reportsService';
import { getMaterials } from '@/services/materialsService';
import { formatDateAr, formatNumberAr } from '@/utils/reportUtils';

export default function ProductionPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fineness, setFineness] = useState('');
  const [materials, setMaterials] = useState({ rawTypes: [], fineness: [], packagingProduction: [], packagingLoading: [] });

  useEffect(() => {
    listReports().then((r) => { setReports(r); setLoading(false); });
    getMaterials().then(setMaterials);
  }, []);

  const rows = useMemo(() => {
    const items = reports.flatMap((r) =>
      (r.production || []).map((p) => ({ ...p, date: r.date, reportId: r.id })),
    );
    const q = query.trim();
    return items
      .filter((p) => {
        const matchQ = !q || (p.customer || '').includes(q) || (p.fineness || '').includes(q);
        const matchFrom = !from || p.date >= from;
        const matchTo = !to || p.date <= to;
        const matchFineness = !fineness || p.fineness === fineness;
        return matchQ && matchFrom && matchTo && matchFineness;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [reports, query, from, to, fineness]);

  const totals = useMemo(() => {
    const hours = rows.reduce((s, p) => s + (Number(p.hours) || 0), 0);
    const byFineness = {};
    rows.forEach((p) => { byFineness[p.fineness] = (byFineness[p.fineness] || 0) + 1; });
    return { count: rows.length, hours, kinds: Object.keys(byFineness).length };
  }, [rows]);

  const columns = [
    { key: 'date', header: 'التاريخ', render: (p) => formatDateAr(p.date) },
    { key: 'fineness', header: 'درجة النعومة', render: (p) => <span className="font-medium">{p.fineness || '—'}</span> },
    { key: 'hours', header: 'ساعات التشغيل', render: (p) => formatNumberAr(p.hours) },
    { key: 'packaging', header: 'نوع العبوة', render: (p) => p.packaging || '—' },
    { key: 'customer', header: 'العميل', render: (p) => p.customer || '—' },
    {
      key: 'report', header: 'التقرير',
      render: (p) => (
        <a href={`/operations/daily-reports/${p.reportId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <FileText className="h-3 w-3" /> عرض
        </a>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>الإنتاج والتعبئة — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="سجل عمليات الإنتاج والتعبئة في مصنع كربونات الكالسيوم مجمّعة من كل التقارير اليومية." />
      </Helmet>

      <PageHeader
        title="الإنتاج والتعبئة"
        subtitle="كل عمليات التعبئة المسجّلة عبر التقارير اليومية في مكان واحد"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'الإنتاج والمبيعات' }, { label: 'الإنتاج والتعبئة' }]}
        actions={<Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="عدد عمليات التعبئة" value={formatNumberAr(totals.count)} />
        <StatCard label="إجمالي ساعات التشغيل" value={formatNumberAr(totals.hours)} unit="ساعة" />
        <StatCard label="عدد درجات النعومة المستخدمة" value={formatNumberAr(totals.kinds)} />
      </div>

      <div className="app-card p-4 sm:p-6">
        <FilterBar className="mb-4">
          <Field label="بحث" className="sm:w-56">
            <SearchBar value={query} onChange={setQuery} placeholder="عميل أو درجة نعومة..." />
          </Field>
          <Field label="درجة النعومة" className="sm:w-40">
            <SelectInput options={materials.fineness} value={fineness} onChange={(e) => setFineness(e.target.value)} placeholder="الكل" />
          </Field>
          <Field label="من تاريخ" className="sm:w-40">
            <DateInput value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="إلى تاريخ" className="sm:w-40">
            <DateInput value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Button variant="secondary" onClick={() => { setQuery(''); setFrom(''); setTo(''); setFineness(''); }}>
            مسح الفلاتر
          </Button>
        </FilterBar>

        {loading ? <LoadingState /> : (
          <DataTable columns={columns} rows={rows} empty={<EmptyState title="لا توجد عمليات تعبئة مطابقة" />} />
        )}
      </div>
    </>
  );
}
