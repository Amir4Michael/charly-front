import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Printer, 
  Calendar, 
  Filter, 
  Users, 
  Truck, 
  Factory, 
  Building2, 
  Clock, 
  ChevronLeft 
} from 'lucide-react';
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

      <div className="space-y-6 pb-12 dir-rtl text-right">
        {/* Header Section */}
        <div className="no-print">
          <PageHeader
            title="التقرير الأسبوعي"
            subtitle="ما حدث فعليًا خلال الأسبوع — بخلاف الجدول الأسبوعي الذي يمثل الخطة"
            breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'التشغيل' }, { label: 'التقرير الأسبوعي' }]}
            actions={
              <Button 
                variant="secondary" 
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <Printer className="h-4 w-4 text-slate-500" /> 
                <span>طباعة التقرير</span>
              </Button>
            }
          />
          
          {/* Controls Bar */}
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Filter className="h-4 w-4" />
                </div>
                <span>نطاق التقرير</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Field label="بداية الأسبوع" className="w-full sm:w-64">
                  <DateInput 
                    value={weekStart} 
                    onChange={(e) => setWeekStart(startOfWeek(e.target.value))} 
                    className="rounded-xl border-slate-200 shadow-none focus:border-primary focus:ring-primary/20"
                  />
                </Field>
                <div className="hidden sm:flex items-center justify-center pt-5 text-slate-400">
                  <ChevronLeft className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 self-end sm:self-center">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>من {formatDateAr(weekStart)} إلى {formatDateAr(weekEnd)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content State */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <LoadingState />
          </div>
        ) : (
          <div className="print-sheet space-y-6">
            {/* Header visible ONLY during printing */}
            <header className="hidden border-b border-slate-200 pb-4 text-center print:block">
              <h2 className="text-2xl font-bold text-slate-900">{getSettings().factoryName}</h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                التقرير الأسبوعي — من {formatDateAr(weekStart)} إلى {formatDateAr(weekEnd)}
              </p>
            </header>

            {!weekReports.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <EmptyState title="لا توجد تقارير يومية في هذا الأسبوع" />
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="عدد أيام التشغيل" value={formatNumberAr(weekReports.length)} unit="يوم" className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all" />
                  <StatCard label="الخامة المستلمة" value={formatNumberAr(summary.rawWeight)} unit="طن" className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all" />
                  <StatCard label="إجمالي الإنتاج" value={formatNumberAr(summary.production)} unit="طن" className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all" />
                  <StatCard label="إجمالي المبيعات" value={formatMoney(summary.sales)} className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all" />
                  <StatCard label="إجمالي المصروفات" value={formatMoney(summary.expenses)} className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all" />
                  <StatCard label="ساعات التشغيل" value={formatNumberAr(summary.hours)} unit="ساعة" className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all" />
                  <StatCard label="ساعات التوقف" value={formatNumberAr(summary.stopHours)} unit="ساعة" className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all" />
                  <StatCard label="نسبة التشغيل" value={`${summary.runRate}%`} className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all" />
                </div>

                {/* Participants Summary Section */}
                <SectionCard title="ملخص الأطراف المشاركة خلال الأسبوع" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 p-1">
                    {[
                      { k: 'الورديات المستخدمة', v: [...summary.shifts].join('، ') || '—', icon: Clock },
                      { k: 'العملاء', v: [...summary.customers].join('، ') || '—', icon: Users },
                      { k: 'الكسارات', v: [...summary.quarries].join('، ') || '—', icon: Factory },
                      { k: 'القلابات', v: [...summary.trucks].join('، ') || '—', icon: Truck },
                      { k: 'العمال', v: [...summary.workers].join('، ') || '—', icon: Building2 },
                    ].map(({ k, v, icon: Icon }) => (
                      <div key={k} className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-slate-500">
                          <Icon className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</dt>
                        </div>
                        <dd className="font-semibold text-slate-800 leading-relaxed">
                          {v !== '—' ? (
                            <span className="inline-block rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs border border-slate-200/60">
                              {v}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </SectionCard>

                {/* Daily Reports Table Section */}
                <SectionCard title="تقارير الأيام ضمن الأسبوع" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-right text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-600">
                          {['التاريخ', 'الورديات', 'الإنتاج', 'المبيعات', 'المصاريف'].map((h) => (
                            <th key={h} className="px-4 py-3.5 font-semibold text-slate-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {weekReports.map((r) => {
                          const t = reportTotals(r);
                          return (
                            <tr key={r.id} className="transition-colors hover:bg-slate-50/60 even:bg-slate-50/20">
                              <td className="px-4 py-3.5 whitespace-nowrap text-slate-900 font-semibold">{formatDateAr(r.date)}</td>
                              <td className="px-4 py-3.5">
                                {(r.shifts && r.shifts.length > 0) ? (
                                  <div className="flex flex-wrap gap-1">
                                    {r.shifts.map((s, idx) => (
                                      <span key={idx} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-normal">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-800">{formatNumberAr(t.loadedWeight)} طن</td>
                              <td className="px-4 py-3.5 whitespace-nowrap font-medium text-emerald-700">{formatMoney(t.sales)}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap font-medium text-rose-600">{formatMoney(t.expenses)}</td>
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
      </div>
    </>
  );
}