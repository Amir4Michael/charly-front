import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Printer } from 'lucide-react';
import {
  Button, DataTable, DateInput, EmptyState, Field, FilterBar, LoadingState, PageHeader, SearchBar,
} from '@/components/common';
import { listReports } from '@/services/reportsService';
import { formatDateAr, formatMoney, formatNumberAr, reportTotals } from '@/utils/reportUtils';
import { useAuth } from '@/hooks/useAuth';

export default function DailyReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const navigate = useNavigate();
  const { canManage } = useAuth();

  useEffect(() => {
    listReports().then((list) => {
      setReports(list);
      setLoading(false);
    });
  }, []);

  const rows = useMemo(
    () =>
      reports.filter((r) => {
        const q = query.trim();
        const matchQuery =
          !q ||
          (r.operator || '').includes(q) ||
          (r.managers || []).join(' ').includes(q) ||
          (r.raw?.crusher || '').includes(q) ||
          r.date.includes(q);
        const matchFrom = !from || r.date >= from;
        const matchTo = !to || r.date <= to;
        return matchQuery && matchFrom && matchTo;
      }),
    [reports, query, from, to],
  );

  const columns = [
    { key: 'date', header: 'التاريخ', render: (r) => formatDateAr(r.date) },
    { key: 'shifts', header: 'الورديات', render: (r) => (r.shifts || []).join('، ') || '—' },
    { key: 'operator', header: 'المشغل' },
    { key: 'workersCount', header: 'العمال', render: (r) => formatNumberAr(r.workersCount) },
    { key: 'raw', header: 'الخامة', render: (r) => `${r.raw?.type || '—'} — ${formatNumberAr(r.raw?.weight)} ${r.raw?.unit || ''}` },
    { key: 'prod', header: 'الإنتاج', render: (r) => `${formatNumberAr(reportTotals(r).loadedWeight)} طن` },
    { key: 'sales', header: 'المبيعات', render: (r) => formatMoney(reportTotals(r).sales) },
    { key: 'exp', header: 'المصاريف', render: (r) => formatMoney(reportTotals(r).expenses) },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Link to={`/operations/daily-reports/${r.id}`} className="rounded p-2 hover:bg-secondary" title="عرض">
            <Eye className="h-4 w-4" />
          </Link>
          {canManage && (
            <Link to={`/operations/daily-reports/${r.id}/edit`} className="rounded p-2 hover:bg-secondary" title="تعديل">
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          <button
            type="button"
            title="طباعة"
            onClick={() => navigate(`/operations/daily-reports/${r.id}?print=1`)}
            className="rounded p-2 hover:bg-secondary"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>التقرير اليومي — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="قائمة التقارير اليومية لتشغيل مصنع كربونات الكالسيوم مع البحث والفلترة بالتاريخ." />
      </Helmet>

      <PageHeader
        title="التقرير اليومي"
        subtitle="سجل تقارير التشغيل اليومية"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'التشغيل' }, { label: 'التقرير اليومي' }]}
        actions={
          canManage && (
            <Button onClick={() => navigate('/operations/daily-reports/new')}>
              <Plus className="h-4 w-4" />
              تقرير يومي جديد
            </Button>
          )
        }
      />

      <div className="app-card p-4 sm:p-6">
        <FilterBar className="mb-4">
          <Field label="بحث" className="sm:w-64">
            <SearchBar value={query} onChange={setQuery} placeholder="ابحث بالمشغل أو الكسارة..." />
          </Field>
          <Field label="من تاريخ" className="sm:w-44">
            <DateInput value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="إلى تاريخ" className="sm:w-44">
            <DateInput value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Button
            variant="secondary"
            className="sm:mb-0"
            onClick={() => {
              setQuery('');
              setFrom('');
              setTo('');
            }}
          >
            مسح الفلاتر
          </Button>
        </FilterBar>

        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty={
              <EmptyState
                title="لا توجد تقارير مطابقة"
                description="جرّب تغيير البحث أو أنشئ تقريراً يومياً جديداً."
                action={canManage && <Button onClick={() => navigate('/operations/daily-reports/new')}>تقرير يومي جديد</Button>}
              />
            }
          />
        )}
      </div>
    </>
  );
}
