import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Factory, Wallet, Receipt, Truck, Layers, Clock, FileText, Mountain, Users, Building2, PauseCircle,
  ArrowUpLeft, ShieldAlert, Sparkles, Activity, CheckCircle2, ChevronLeft
} from 'lucide-react';
import { LoadingState, PageHeader, EmptyState } from '@/components/common';
import { listReports } from '@/services/reportsService';
import { listQuarries } from '@/services/quarriesService';
import { listTrucks } from '@/services/trucksService';
import { listCustomers } from '@/services/customersService';
import { listWorkers } from '@/services/workersService';
import { formatDateAr, formatMoney, formatNumberAr, reportTotals, todayISO } from '@/utils/reportUtils';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({ quarries: 0, trucks: 0, customers: 0, workers: 0 });

  useEffect(() => {
    let alive = true;
    Promise.all([
      listReports(),
      listQuarries().catch(() => []),
      listTrucks().catch(() => []),
      listCustomers().catch(() => []),
      listWorkers().catch(() => []),
    ]).then(([reportsList, quarries, trucks, customers, workers]) => {
      if (!alive) return;
      setReports(reportsList || []);
      setCounts({
        quarries: (quarries || []).length,
        trucks: (trucks || []).length,
        customers: (customers || []).length,
        workers: (workers || []).length,
      });
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const hasReports = reports.length > 0;

  const overall = reports.reduce(
    (acc, r) => {
      const t = reportTotals(r);
      acc.loadedWeight += t.loadedWeight;
      acc.sales += t.sales;
      acc.expenses += t.expenses;
      acc.hours += t.hours;
      acc.stoppedHours += t.stoppedHours || 0;
      acc.shiftsCount += t.shiftsCount;
      acc.remaining += t.remaining;
      return acc;
    },
    { loadedWeight: 0, sales: 0, expenses: 0, hours: 0, stoppedHours: 0, shiftsCount: 0, remaining: 0 },
  );

  const todayReport = reports.find((r) => r.date === todayISO()) || null;
  const todayTotals = todayReport ? reportTotals(todayReport) : null;

  const latestReports = [...reports]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 6);

  return (
    <>
      <Helmet>
        <title>الرئيسية — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="لوحة الرئيسية لمتابعة إنتاج ومبيعات ومصاريف وتشغيل مصنع كربونات الكالسيوم." />
      </Helmet>

      <div className="space-y-6 select-none font-sans antialiased">
        
        {/* Top Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
          <PageHeader title="الرئيسية" subtitle={formatDateAr(todayISO())} />
          
          
        </div>

        {loading ? (
          <LoadingState />
        ) : !hasReports ? (
          <EmptyState title="لا توجد بيانات تشغيل بعد" description="ابدأ بإنشاء تقرير يومي جديد." />
        ) : (
          <div className="space-y-6">
            
            {/* 1. Hero Widget: حالة تشغيل اليوم بأسلوب تقني عالي الجودة */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-secondary/30 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {todayReport ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 border border-primary/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        تقرير اليوم مسجل
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold px-2 py-0.5 border border-amber-500/20">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        بانتظار تقرير اليوم
                      </span>
                    )}
                    <span className="text-xs font-semibold text-muted-foreground">{formatDateAr(todayISO())}</span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-foreground">
                    {todayReport ? `المشغل : ${todayReport.operator || 'غير محدد'}` : 'لم يُسجَّل تقرير تشغيل لليوم حتى الآن'}
                  </h2>

                  <p className="text-xs text-muted-foreground font-medium max-w-2xl leading-relaxed">
                    {todayReport
                      ? `تم تشغيل ${formatNumberAr(todayTotals.shiftsCount)} وردية بإجمالي ${formatNumberAr(todayTotals.hours)} ساعة عمل. الخامة: ${todayReport.raw?.type || '—'} (الكسارة: ${todayReport.raw?.crusher || '—'})`
                      : `آخر تقرير تم اعتماده كان بتاريخ ${formatDateAr(latestReports[0]?.date)}.`
                    }
                  </p>
                </div>

                {/* اليوم في أرقام سريعة */}
                {todayReport && (
                  <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center shrink-0 border-t lg:border-t-0 lg:border-r border-border/80 pt-4 lg:pt-0 lg:pr-6">
                    <div className="rounded-xl bg-card border border-border/80 p-3 text-right">
                      <span className="block text-[10px] font-bold text-muted-foreground">مبيعات اليوم</span>
                      <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">{formatMoney(todayTotals.sales)}</span>
                    </div>
                    <div className="rounded-xl bg-card border border-border/80 p-3 text-right">
                      <span className="block text-[10px] font-bold text-muted-foreground">المتبقي (آجل)</span>
                      <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">{formatMoney(todayTotals.remaining)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. الإجماليات المالية والإنتاجية (Industrial Metrics Grid) */}
            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  الإجماليات العامة للمصنع
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* الإنتاج */}
                <div className="rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-bold">إجمالي الإنتاج المحمّل</span>
                    <Factory className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-foreground">{formatNumberAr(overall.loadedWeight)}</span>
                    <span className="text-xs font-bold text-muted-foreground">طن</span>
                  </div>
                </div>

                {/* المبيعات */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 transition-all">
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                    <span className="text-xs font-bold">إجمالي المبيعات</span>
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{formatMoney(overall.sales)}</span>
                  </div>
                </div>

                {/* المصاريف */}
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 transition-all">
                  <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
                    <span className="text-xs font-bold">إجمالي المصاريف</span>
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-black text-rose-700 dark:text-rose-400">{formatMoney(overall.expenses)}</span>
                  </div>
                </div>

                {/* المتبقي */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 transition-all">
                  <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                    <span className="text-xs font-bold">المتبقي (آجل)</span>
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-black text-amber-700 dark:text-amber-400">{formatMoney(overall.remaining)}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. المؤشرات التشغيلية السريعة (Compact Stat Strip) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3">
                <div className="rounded-lg bg-secondary p-2 text-foreground shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground">التقارير اليومية</span>
                  <span className="text-xs font-black text-foreground">{formatNumberAr(reports.length)} تقرير</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3">
                <div className="rounded-lg bg-secondary p-2 text-foreground shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground">ساعات التشغيل</span>
                  <span className="text-xs font-black text-foreground">{formatNumberAr(overall.hours)} ساعة</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3">
                <div className="rounded-lg bg-secondary p-2 text-foreground shrink-0">
                  <PauseCircle className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground">ساعات التوقف</span>
                  <span className="text-xs font-black text-foreground">{formatNumberAr(overall.stoppedHours)} ساعة</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3">
                <div className="rounded-lg bg-secondary p-2 text-foreground shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground">عدد الورديات</span>
                  <span className="text-xs font-black text-foreground">{formatNumberAr(overall.shiftsCount)} وردية</span>
                </div>
              </div>
            </div>

            {/* 4. التقارير الأخيرة + تفاصيل التشغيل المباشرة */}
            <div className="grid gap-6 lg:grid-cols-3">
              
              {/* أحدث التقارير Daily Reports Log */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">أحدث التقارير المسجلة</h3>
                </div>

                <div className="rounded-xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60">
                  {latestReports.map((r) => {
                    const rt = reportTotals(r);
                    return (
                      <Link
                        key={r.id}
                        to={`/operations/daily-reports/${r.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg border border-border bg-secondary p-2 text-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                {formatDateAr(r.date)}
                              </span>
                              <ArrowUpLeft className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                              <span>{formatNumberAr(rt.shiftsCount)} وردية</span>
                              <span>•</span>
                              <span>{formatNumberAr(rt.hours)} ساعة</span>
                              <span>•</span>
                              <span className="text-foreground/90 font-bold">{formatNumberAr(rt.loadedWeight)} طن</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-0 border-border/40 pt-2 sm:pt-0 shrink-0">
                          <span className="text-[10px] text-muted-foreground sm:hidden">إجمالي المبيعات</span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(rt.sales)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* تفاصيل اليوم + الكيانات الأساسية */}
              <div className="space-y-4">
                
                {/* اليوم بالتفصيل */}
                <div className="rounded-xl border border-border/80 bg-card p-4">
                  <h4 className="text-xs font-bold text-foreground pb-2.5 mb-3 border-b border-border/60 flex items-center justify-between">
                    <span>{todayReport ? 'تفاصيل تقرير اليوم' : 'تقرير اليوم'}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{todayReport?.date || ''}</span>
                  </h4>

                  {todayReport ? (
                    <div className="space-y-2 text-xs">
                      {[
                        ['المشغل', todayReport.operator || '—'],
                        ['الورديات', formatNumberAr(todayTotals.shiftsCount)],
                        ['ساعات التشغيل', `${formatNumberAr(todayTotals.hours)} ساعة`],
                        ['عدد العمال', formatNumberAr(todayReport.workersCount)],
                        ['نوع الخامة', todayReport.raw?.type || '—'],
                        ['الكسارة', todayReport.raw?.crusher || '—'],
                        ['عمليات التعبئة', formatNumberAr((todayReport.production || []).length)],
                        ['عمليات التحميل', formatNumberAr((todayReport.loading || []).length)],
                        ['المتبقي (آجل)', formatMoney(todayTotals.remaining)],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                          <span className="text-muted-foreground font-medium">{k}</span>
                          <span className="font-bold text-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4 leading-relaxed">
                      لم يتم إنشاء تقرير يومي لليوم حتى الآن.
                    </p>
                  )}
                </div>

                {/* قاعدة البيانات الكيانات */}
                <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">سجل الكيانات</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-secondary/50 p-2.5 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mountain className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-muted-foreground">الكسارات</span>
                      </div>
                      <span className="font-black text-foreground">{formatNumberAr(counts.quarries)}</span>
                    </div>

                    <div className="rounded-lg bg-secondary/50 p-2.5 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-muted-foreground">القلابات</span>
                      </div>
                      <span className="font-black text-foreground">{formatNumberAr(counts.trucks)}</span>
                    </div>

                    <div className="rounded-lg bg-secondary/50 p-2.5 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-muted-foreground">العملاء</span>
                      </div>
                      <span className="font-black text-foreground">{formatNumberAr(counts.customers)}</span>
                    </div>

                    <div className="rounded-lg bg-secondary/50 p-2.5 border border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-muted-foreground">العاملون</span>
                      </div>
                      <span className="font-black text-foreground">{formatNumberAr(counts.workers)}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}
      </div>
    </>
  );
}