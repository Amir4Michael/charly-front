import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer, ArrowRight } from 'lucide-react';
import { Button, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { PrintHeader, PrintFooter } from '@/components/print/PrintLayout';
import { getTruck } from '@/services/trucksService';
import { listReports } from '@/services/reportsService';
import { computeTruckStats, formatDateAr, formatMoney, formatNumberAr } from '@/utils/reportUtils';
import { getSettings } from '@/services/settingsService';

export default function TruckDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [truck, setTruck] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTruck(id)
      .then((t) => {
        setTruck(t);
        return listReports();
      })
      .then((reports) => {
        if (reports) setStats(computeTruckStats(id, reports));
        setLoading(false);
      })
      .catch(() => {
        setTruck(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <LoadingState />;
  if (!truck) return <EmptyState title="القلاب غير موجود" action={<Button onClick={() => navigate('/trucks')}>رجوع للقائمة</Button>} />;

  return (
    <>
      <Helmet><title>{truck.name} — القلابات</title></Helmet>

      <div className="no-print">
        <PageHeader
          title={truck.name}
          subtitle={`السائق: ${truck.driver || '—'}`}
          breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'القلابات', to: '/trucks' }, { label: truck.name }]}
          actions={
            <>
              <Button variant="secondary" onClick={() => navigate('/trucks')}><ArrowRight className="h-4 w-4" /> رجوع</Button>
              <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>
            </>
          }
        />
      </div>

      <article className="print-sheet app-card mx-auto max-w-4xl p-6 sm:p-10">
        <PrintHeader
          title="كشف مشاوير القلاب"
          subtitle={getSettings().factoryName}
          meta={[
            ['اسم القلاب', truck.name],
            ['السائق', truck.driver || '—'],
            ['رقم اللوحة', truck.plateNumber || '—'],
            ['عدد المشاوير', formatNumberAr(stats?.trips?.length)],
            ['إجمالي الوزن', `${formatNumberAr(stats?.totalWeight)} طن`],
          ]}
        />

        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">بيانات القلاب</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['اسم القلاب', truck.name],
              ['السائق', truck.driver || '—'],
              ['الهاتف', truck.phone || '—'],
              ['رقم اللوحة', truck.plateNumber || '—'],
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
              { label: 'عدد المشاوير', value: formatNumberAr(stats?.trips?.length) },
              { label: 'إجمالي الوزن', value: `${formatNumberAr(stats?.totalWeight)} طن` },
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
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">سجل المشاوير</h3>
          {!stats?.trips?.length ? (
            <p className="text-sm text-muted-foreground">لا توجد مشاوير مسجلة.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="bg-secondary/70">
                    {['التاريخ', 'الكسارة', 'نوع الخامة', 'الوزن (طن)', 'السعر/طن', 'الإجمالي', 'المدفوع', 'المتبقي'].map((h) => (
                      <th key={h} className="border border-border px-2 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.trips.map((t, i) => (
                    <tr key={i} className="hover:bg-secondary/30">
                      <td className="border border-border px-2 py-2">{formatDateAr(t.date)}</td>
                      <td className="border border-border px-2 py-2">{t.quarry || '—'}</td>
                      <td className="border border-border px-2 py-2">{t.material || '—'}</td>
                      <td className="border border-border px-2 py-2">{formatNumberAr(t.weight)}</td>
                      <td className="border border-border px-2 py-2">{t.rate ? formatMoney(t.rate) : '—'}</td>
                      <td className="border border-border px-2 py-2 font-semibold">{formatMoney(t.total)}</td>
                      <td className="border border-border px-2 py-2">{formatMoney(t.paid)}</td>
                      <td className="border border-border px-2 py-2 font-semibold text-destructive">
                        {Number(t.remaining) > 0 ? formatMoney(t.remaining) : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-secondary font-semibold">
                    <td colSpan={3} className="border border-border px-2 py-2">الإجمالي</td>
                    <td className="border border-border px-2 py-2">{formatNumberAr(stats.totalWeight)} طن</td>
                    <td className="border border-border px-2 py-2"></td>
                    <td className="border border-border px-2 py-2">{formatMoney(stats.totalDue)}</td>
                    <td className="border border-border px-2 py-2">{formatMoney(stats.totalPaid)}</td>
                    <td className="border border-border px-2 py-2 text-destructive">{formatMoney(stats.totalRemaining)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <PrintFooter signatures={['السائق', 'مدير المصنع', 'التوقيع', 'التاريخ']} />
      </article>
    </>
  );
}