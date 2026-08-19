import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer, ArrowRight } from 'lucide-react';
import { Button, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { PrintHeader, PrintFooter } from '@/components/print/PrintLayout';
import { getWorker } from '@/services/workersService';
import { listReports } from '@/services/reportsService';
import { computeWorkerStats, formatDateAr, formatMoney, formatNumberAr } from '@/utils/reportUtils';
import { getSettings } from '@/services/settingsService';

export default function WorkerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getWorker(id)
      .then((w) => {
        setWorker(w);
        return listReports();
      })
      .then((reports) => {
        if (reports) setStats(computeWorkerStats(id, reports));
        setLoading(false);
      })
      .catch(() => {
        setWorker(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <LoadingState />;
  if (!worker) return <EmptyState title="العامل غير موجود" action={<Button onClick={() => navigate('/workers')}>رجوع للقائمة</Button>} />;

  return (
    <>
      <Helmet><title>{worker.name} — العمال</title></Helmet>

      <div className="no-print">
        <PageHeader
          title={worker.name}
          subtitle={worker.job || ''}
          breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'العمال', to: '/workers' }, { label: worker.name }]}
          actions={
            <>
              <Button variant="secondary" onClick={() => navigate('/workers')}><ArrowRight className="h-4 w-4" /> رجوع</Button>
              <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>
            </>
          }
        />
      </div>

      <article className="print-sheet app-card mx-auto max-w-4xl p-6 sm:p-10">
        <PrintHeader
          title="كشف حساب العامل"
          subtitle={getSettings().factoryName}
          meta={[
            ['اسم العامل', worker.name],
            ['الوظيفة', worker.job || '—'],
            ['أيام العمل', formatNumberAr(stats?.totalDays)],
            ['المتبقي', formatMoney(stats?.totalRemaining)],
          ]}
        />

        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">بيانات العامل</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['الاسم', worker.name],
              ['الوظيفة', worker.job || '—'],
              ['الهاتف', worker.phone || '—'],
              ['اليومية', worker.dailyRate ? formatMoney(worker.dailyRate) : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-muted-foreground">{k}:</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">ملخص الحساب</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: 'أيام العمل', value: formatNumberAr(stats?.totalDays) },
              { label: 'إجمالي الساعات', value: `${formatNumberAr(stats?.totalHours)} ساعة` },
              { label: 'المستحق', value: formatMoney(stats?.totalDue) },
              { label: 'المتبقي', value: formatMoney(stats?.totalRemaining), highlight: true },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-border bg-secondary/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`mt-1 text-base font-bold ${item.highlight && stats?.totalRemaining > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">سجل أيام العمل</h3>
          {!stats?.workDays?.length ? (
            <p className="text-sm text-muted-foreground">لا توجد أيام عمل مسجلة.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="bg-secondary/70">
                    {['التاريخ', 'الوردية', 'الساعات', 'اليومية', 'المدفوع', 'المتبقي'].map((h) => (
                      <th key={h} className="border border-border px-2 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.workDays.map((d, i) => (
                    <tr key={i} className="hover:bg-secondary/30">
                      <td className="border border-border px-2 py-2">{formatDateAr(d.date)}</td>
                      <td className="border border-border px-2 py-2">{d.shift || '—'}</td>
                      <td className="border border-border px-2 py-2">{formatNumberAr(d.hours)}</td>
                      <td className="border border-border px-2 py-2 font-semibold">{formatMoney(d.dailyAmount)}</td>
                      <td className="border border-border px-2 py-2">{formatMoney(d.paid)}</td>
                      <td className="border border-border px-2 py-2 text-destructive">
                        {Number(d.remaining) > 0 ? formatMoney(d.remaining) : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-secondary font-semibold">
                    <td colSpan={2} className="border border-border px-2 py-2">الإجمالي</td>
                    <td className="border border-border px-2 py-2">{formatNumberAr(stats.totalHours)} ساعة</td>
                    <td className="border border-border px-2 py-2">{formatMoney(stats.totalDue)}</td>
                    <td className="border border-border px-2 py-2">{formatMoney(stats.totalPaid)}</td>
                    <td className="border border-border px-2 py-2 text-destructive">{formatMoney(stats.totalRemaining)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <PrintFooter signatures={['العامل', 'مدير المصنع', 'التوقيع', 'التاريخ']} />
      </article>
    </>
  );
}