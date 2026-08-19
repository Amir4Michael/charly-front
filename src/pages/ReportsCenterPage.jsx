import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Printer, CalendarRange, Users2, Mountain, Truck, Contact, Layers,
  Boxes, ShoppingCart, Receipt, Landmark, ArrowLeft,
} from 'lucide-react';
import {
  Button, DataTable, DateInput, EmptyState, Field, FilterBar, LoadingState,
  PageHeader, SectionCard, SelectInput, StatCard,
} from '@/components/common';
import { listReports } from '@/services/reportsService';
import { listCustomers } from '@/services/customersService';
import { listQuarries } from '@/services/quarriesService';
import { listTrucks } from '@/services/trucksService';
import { listWorkers } from '@/services/workersService';
import {
  filterReportsByPeriod, formatDateAr, formatMoney, formatNumberAr, reportTotals, todayISO,
} from '@/utils/reportUtils';

function todayRange() {
  const t = todayISO();
  return { from: t, to: t };
}
function weekRange() {
  const d = new Date();
  const day = d.getDay();
  const start = new Date(d); start.setDate(d.getDate() - day);
  return { from: start.toISOString().slice(0, 10), to: todayISO() };
}
function monthRange() {
  const t = todayISO();
  return { from: t.slice(0, 7) + '-01', to: t };
}

const ENTITY_LINKS = [
  { key: 'customers', label: 'تقارير العملاء', icon: Contact, to: '/customers', loader: listCustomers },
  { key: 'quarries', label: 'تقارير الكسارات', icon: Mountain, to: '/quarries', loader: listQuarries },
  { key: 'trucks', label: 'تقارير القلابات', icon: Truck, to: '/trucks', loader: listTrucks },
  { key: 'workers', label: 'تقارير العمال', icon: Users2, to: '/workers', loader: listWorkers },
];

const QUICK_LINKS = [
  { label: 'تقرير الإنتاج والتعبئة', icon: Boxes, to: '/production' },
  { label: 'تقرير المبيعات', icon: ShoppingCart, to: '/sales' },
  { label: 'تقرير المصاريف', icon: Receipt, to: '/expenses' },
  { label: 'التقرير المالي الشامل', icon: Landmark, to: '/accounts' },
  { label: 'الخامات المستخدمة', icon: Layers, to: '/materials' },
];

export default function ReportsCenterPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('today');
  const [from, setFrom] = useState(todayRange().from);
  const [to, setTo] = useState(todayRange().to);
  // بعض الـloaders أصبحت async (customers) والبعض لسه sync (quarries/trucks/workers)؛
  // Promise.resolve() توحّد التعامل مع الاثنين أثناء مرحلة الترحيل التدريجي للـAPI الحقيقي.
  const [entityLists, setEntityLists] = useState({ customers: [], quarries: [], trucks: [], workers: [] });

  useEffect(() => {
    listReports().then((r) => { setReports(r); setLoading(false); });
  }, []);

  useEffect(() => {
    ENTITY_LINKS.forEach((e) => {
      Promise.resolve(e.loader()).then((list) => {
        setEntityLists((prev) => ({ ...prev, [e.key]: list }));
      });
    });
  }, []);

  const applyPreset = (p) => {
    setPreset(p);
    if (p === 'today') { const r = todayRange(); setFrom(r.from); setTo(r.to); }
    if (p === 'week') { const r = weekRange(); setFrom(r.from); setTo(r.to); }
    if (p === 'month') { const r = monthRange(); setFrom(r.from); setTo(r.to); }
  };

  const filtered = useMemo(() => filterReportsByPeriod(reports, from, to), [reports, from, to]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        const t = reportTotals(r);
        acc.sales += t.sales;
        acc.expenses += t.expenses;
        acc.production += t.loadedWeight;
        acc.raw += t.rawWeight;
        acc.hours += t.hours;
        return acc;
      },
      { sales: 0, expenses: 0, production: 0, raw: 0, hours: 0 },
    );
  }, [filtered]);

  const columns = [
    { key: 'date', header: 'التاريخ', render: (r) => formatDateAr(r.date) },
    { key: 'raw', header: 'الخامة المستلمة', render: (r) => `${formatNumberAr(reportTotals(r).rawWeight)} ${r.raw?.unit || 'طن'}` },
    { key: 'production', header: 'الإنتاج', render: (r) => `${formatNumberAr(reportTotals(r).loadedWeight)} طن` },
    { key: 'sales', header: 'المبيعات', render: (r) => formatMoney(reportTotals(r).sales) },
    { key: 'expenses', header: 'المصاريف', render: (r) => formatMoney(reportTotals(r).expenses) },
    {
      key: 'link', header: '', render: (r) => (
        <Link to={`/operations/daily-reports/${r.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          عرض <ArrowLeft className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>التقارير — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="مركز التقارير الشامل لمصنع كربونات الكالسيوم — تقارير يومية وأسبوعية وشهرية وتقارير حسب العميل والكسارة والقلاب والعامل." />
      </Helmet>

      <PageHeader
        title="التقارير"
        subtitle="مركز التقارير — تقرير فترة، وتقارير مفصّلة لكل جهة"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'التقارير' }]}
      />

      <SectionCard
        title="تقرير فترة"
        description="اختر فترة زمنية لعرض إجماليات التشغيل والمبيعات والمصاريف"
        actions={<Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>}
      >
        <FilterBar className="mb-4">
          <Field label="فترة سريعة" className="sm:w-48">
            <SelectInput
              options={['اليوم', 'هذا الأسبوع', 'هذا الشهر', 'مخصص']}
              value={{ today: 'اليوم', week: 'هذا الأسبوع', month: 'هذا الشهر', custom: 'مخصص' }[preset]}
              onChange={(e) => {
                const map = { 'اليوم': 'today', 'هذا الأسبوع': 'week', 'هذا الشهر': 'month', 'مخصص': 'custom' };
                applyPreset(map[e.target.value] || 'custom');
              }}
            />
          </Field>
          <Field label="من تاريخ" className="sm:w-44">
            <DateInput value={from} onChange={(e) => { setFrom(e.target.value); setPreset('custom'); }} />
          </Field>
          <Field label="إلى تاريخ" className="sm:w-44">
            <DateInput value={to} onChange={(e) => { setTo(e.target.value); setPreset('custom'); }} />
          </Field>
        </FilterBar>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard label="عدد التقارير" value={formatNumberAr(filtered.length)} />
          <StatCard label="الخامة المستلمة" value={formatNumberAr(totals.raw)} unit="طن" />
          <StatCard label="الإنتاج المحمّل" value={formatNumberAr(totals.production)} unit="طن" />
          <StatCard label="المبيعات" value={formatMoney(totals.sales)} />
          <StatCard label="المصاريف" value={formatMoney(totals.expenses)} />
        </div>

        {loading ? <LoadingState /> : (
          <DataTable columns={columns} rows={filtered} empty={<EmptyState title="لا توجد تقارير في هذه الفترة" />} />
        )}
      </SectionCard>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {ENTITY_LINKS.map((e) => {
          const list = entityLists[e.key] || [];
          return (
            <SectionCard key={e.key} title={e.label} description={`اختر ${e.label.replace('تقارير ', '')} لعرض كشف الحساب الخاص به`}>
              {!list.length ? (
                <EmptyState title="لا توجد بيانات بعد" />
              ) : (
                <ul className="divide-y divide-border">
                  {list.map((item) => (
                    <li key={item.id}>
                      <Link to={`${e.to}/${item.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary">
                        <span className="flex items-center gap-2"><e.icon className="h-4 w-4 text-muted-foreground" /> {item.name}</span>
                        <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          );
        })}
      </div>

      <div className="mt-6">
        <SectionCard title="تقارير أخرى" description="تقارير متخصصة على مستوى المصنع بالكامل">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {QUICK_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="flex items-center gap-3 rounded-md border border-border p-4 text-sm hover:bg-secondary/40">
                <span className="rounded-md bg-accent p-2 text-accent-foreground"><l.icon className="h-4 w-4" /></span>
                <span className="flex-1 font-medium">{l.label}</span>
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
