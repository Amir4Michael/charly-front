import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Printer } from 'lucide-react';
import {
  Button, DateInput, EmptyState, Field, LoadingState, PageHeader, SectionCard, StatCard,
} from '@/components/common';
import { listReports } from '@/services/reportsService';
import { getSettings } from '@/services/settingsService';
import { filterReportsByPeriod, formatDateAr, formatMoney, formatNumberAr, reportTotals, todayISO } from '@/utils/reportUtils';

function startOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
function endOfWeek(startStr) {
  const d = new Date(startStr + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

export default function WeeklyReportPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(todayISO()));

  useEffect(() => {
    listReports().then((r) => { setReports(r); setLoading(false); });
  }, []);

  const weekEnd = endOfWeek(weekStart);
  const weekReports = useMemo(() => filterReportsByPeriod(reports, weekStart, weekEnd), [reports, weekStart, weekEnd]);

  const summary = useMemo(() => {
    const acc = {
      rawWeight: 0, production: 0, sales: 0, expenses: 0, hours: 0, stopHours: 0,
      shifts: new Set(), customers: new Set(), quarries: new Set(), trucks: new Set(), workers: new Set(),
    };
    weekReports.forEach((r) => {
      const t = reportTotals(r);
      acc.rawWeight += t.rawWeight;
      acc.production += t.loadedWeight;
      acc.sales += t.sales;
      acc.expenses += t.expenses;
      acc.hours += t.actualHours || t.hours;
      acc.stopHours += t.stoppedHours || 0;
      (r.shifts || []).forEach((s) => acc.shifts.add(s));
      (r.loading || []).forEach((l) => l.customer && acc.customers.add(l.customer));
      if (r.raw?.crusher) acc.quarries.add(r.raw.crusher);
      (r.tippers || []).forEach((t) => t.name && acc.trucks.add(t.name));
      (r.workers || []).forEach((w) => { const n = typeof w === 'string' ? w : w.name; if (n) acc.workers.add(n); });
    });
    const totalRun = acc.hours + acc.stopHours;
    return {
      ...acc,
      runRate: totalRun > 0 ? Math.round((acc.hours / totalRun) * 100) : 0,
      stopRate: totalRun > 0 ? Math.round((acc.stopHours / totalRun) * 100) : 0,
    };
  }, [weekReports]);

  return (
    <>
      <Helmet>
        <title>التقرير الأسبوعي — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="التقرير الأسبوعي الفعلي لما تم تشغيله وإنتاجه وبيعه في مصنع كربونات الكالسيوم." />
      </Helmet>

      <div className="no-print">
        <PageHeader
          title="التقرير الأسبوعي"
          subtitle="ما حدث فعليًا خلال الأسبوع — بخلاف الجدول الأسبوعي الذي يمثل الخطة"
          breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'التشغيل' }, { label: 'التقرير الأسبوعي' }]}
          actions={<Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>}
        />
        <div className="app-card mb-6 p-4 sm:p-6">
          <Field label="بداية الأسبوع" className="sm:w-56">
            <DateInput value={weekStart} onChange={(e) => setWeekStart(startOfWeek(e.target.value))} />
          </Field>
        </div>
      </div>

      {loading ? <LoadingState /> : (
        <div className="print-sheet space-y-6">
          <header className="hidden text-center print:block">
            <h2 className="text-xl font-bold">{getSettings().factoryName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              التقرير الأسبوعي — من {formatDateAr(weekStart)} إلى {formatDateAr(weekEnd)}
            </p>
          </header>

          {!weekReports.length ? (
            <EmptyState title="لا توجد تقارير يومية في هذا الأسبوع" />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="عدد أيام التشغيل" value={formatNumberAr(weekReports.length)} unit="يوم" />
                <StatCard label="الخامة المستلمة" value={formatNumberAr(summary.rawWeight)} unit="طن" />
                <StatCard label="إجمالي الإنتاج" value={formatNumberAr(summary.production)} unit="طن" />
                <StatCard label="إجمالي المبيعات" value={formatMoney(summary.sales)} />
                <StatCard label="إجمالي المصروفات" value={formatMoney(summary.expenses)} />
                <StatCard label="ساعات التشغيل" value={formatNumberAr(summary.hours)} unit="ساعة" />
                <StatCard label="ساعات التوقف" value={formatNumberAr(summary.stopHours)} unit="ساعة" />
                <StatCard label="نسبة التشغيل" value={`${summary.runRate}%`} />
              </div>

              <SectionCard title="ملخص الأطراف المشاركة خلال الأسبوع">
                <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['الورديات المستخدمة', [...summary.shifts].join('، ') || '—'],
                    ['العملاء', [...summary.customers].join('، ') || '—'],
                    ['الكسارات', [...summary.quarries].join('، ') || '—'],
                    ['القلابات', [...summary.trucks].join('، ') || '—'],
                    ['العمال', [...summary.workers].join('، ') || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-md border border-border p-3">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="mt-1 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>

              <SectionCard title="تقارير الأيام ضمن الأسبوع">
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-secondary/70">
                        {['التاريخ', 'الورديات', 'الإنتاج', 'المبيعات', 'المصاريف'].map((h) => (
                          <th key={h} className="border border-border px-2 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weekReports.map((r) => {
                        const t = reportTotals(r);
                        return (
                          <tr key={r.id}>
                            <td className="border border-border px-2 py-2">{formatDateAr(r.date)}</td>
                            <td className="border border-border px-2 py-2">{(r.shifts || []).join('، ') || '—'}</td>
                            <td className="border border-border px-2 py-2">{formatNumberAr(t.loadedWeight)} طن</td>
                            <td className="border border-border px-2 py-2">{formatMoney(t.sales)}</td>
                            <td className="border border-border px-2 py-2">{formatMoney(t.expenses)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </>
          )}
        </div>
      )}
    </>
  );
}
