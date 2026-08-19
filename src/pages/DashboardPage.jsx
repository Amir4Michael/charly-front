import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Factory, Wallet, Receipt, Truck, Layers, Clock, FileText, Mountain, Users, Building2, PauseCircle,
} from 'lucide-react';
import { LoadingState, PageHeader, SectionCard, StatCard, EmptyState } from '@/components/common';
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

  // لا توجد أي تقارير تشغيل مسجّلة أصلًا في قاعدة البيانات — هذه هي الحالة الوحيدة التي
  // تكون فيها رسالة "لا توجد بيانات تشغيل بعد" صحيحة فعلًا.
  const hasReports = reports.length > 0;

  // إجماليات مجمّعة من كل التقارير الموجودة (وليس فقط تقرير اليوم)
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

      <PageHeader title="الرئيسية" subtitle={formatDateAr(todayISO())} />

      {loading ? (
        <LoadingState />
      ) : !hasReports ? (
        <EmptyState title="لا توجد بيانات تشغيل بعد" description="ابدأ بإنشاء تقرير يومي جديد." />
      ) : (
        <div className="space-y-6">
          {/* ملخص عام لكل البيانات المسجّلة في النظام */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="إجمالي التقارير اليومية" value={formatNumberAr(reports.length)} unit="تقرير" icon={FileText} />
            <StatCard label="إجمالي ساعات التشغيل" value={formatNumberAr(overall.hours)} unit="ساعة" icon={Clock} />
            <StatCard label="إجمالي ساعات التوقف" value={formatNumberAr(overall.stoppedHours)} unit="ساعة" icon={PauseCircle} />
            <StatCard label="إجمالي عدد الورديات" value={formatNumberAr(overall.shiftsCount)} unit="وردية" icon={Layers} />
            <StatCard label="إجمالي الإنتاج المحمَّل" value={formatNumberAr(overall.loadedWeight)} unit="طن" icon={Factory} />
            <StatCard label="إجمالي المبيعات" value={formatMoney(overall.sales)} icon={Wallet} />
            <StatCard label="إجمالي المصاريف" value={formatMoney(overall.expenses)} icon={Receipt} />
            <StatCard label="إجمالي المتبقي (آجل)" value={formatMoney(overall.remaining)} icon={Wallet} />
          </div>

          {/* عدد الكيانات الأساسية المسجّلة في النظام */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="الكسارات" value={formatNumberAr(counts.quarries)} icon={Mountain} />
            <StatCard label="القلابات" value={formatNumberAr(counts.trucks)} icon={Truck} />
            <StatCard label="العملاء" value={formatNumberAr(counts.customers)} icon={Building2} />
            <StatCard label="العاملون" value={formatNumberAr(counts.workers)} icon={Users} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionCard title="آخر التقارير اليومية" description="أحدث التقارير المسجّلة في النظام">
                {latestReports.length === 0 ? (
                  <EmptyState title="لا توجد تقارير بعد" />
                ) : (
                  <ul className="divide-y divide-border">
                    {latestReports.map((r) => {
                      const rt = reportTotals(r);
                      return (
                        <li key={r.id} className="flex items-start justify-between gap-4 py-3">
                          <div>
                            <Link to={`/operations/daily-reports/${r.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                              {formatDateAr(r.date)}
                            </Link>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatNumberAr(rt.shiftsCount)} وردية · {formatNumberAr(rt.hours)} ساعة تشغيل · {formatNumberAr(rt.loadedWeight)} طن إنتاج
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">{formatMoney(rt.sales)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SectionCard>
            </div>

            <SectionCard title={todayReport ? 'ملخص تشغيل اليوم' : 'لا يوجد تقرير لليوم بعد'}>
              {todayReport ? (
                <dl className="space-y-3 text-sm">
                  {[
                    ['المشغل', todayReport.operator || '—'],
                    ['الورديات', formatNumberAr(todayTotals.shiftsCount)],
                    ['ساعات التشغيل', `${formatNumberAr(todayTotals.hours)} ساعة`],
                    ['عدد العمال', formatNumberAr(todayReport.workersCount)],
                    ['نوع الخامة', todayReport.raw?.type || '—'],
                    ['الكسارة', todayReport.raw?.crusher || '—'],
                    ['عدد عمليات التعبئة', formatNumberAr((todayReport.production || []).length)],
                    ['عدد عمليات التحميل', formatNumberAr((todayReport.loading || []).length)],
                    ['المتبقي (آجل)', formatMoney(todayTotals.remaining)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3 border-b border-border/70 pb-2 last:border-0">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-medium text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  آخر تقرير مسجّل بتاريخ {formatDateAr(latestReports[0]?.date)}. لم يتم إنشاء تقرير لليوم الحالي بعد.
                </p>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </>
  );
}