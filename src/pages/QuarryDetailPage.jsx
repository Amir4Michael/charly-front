import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer, ArrowRight } from 'lucide-react';
import { Button, EmptyState, LoadingState, PageHeader, WhatsAppButton } from '@/components/common';
import { PrintHeader, PrintFooter } from '@/components/print/PrintLayout';
import { getQuarry } from '@/services/quarriesService';
import { listReports } from '@/services/reportsService';
import { computeQuarryStats, formatDateAr, formatMoney, formatNumberAr } from '@/utils/reportUtils';
import { getSettings } from '@/services/settingsService';
import { whatsappHref } from '@/lib/phone';

export default function QuarryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quarry, setQuarry] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getQuarry(id)
      .then((q) => {
        setQuarry(q);
        return listReports();
      })
      .then((reports) => {
        if (reports) setStats(computeQuarryStats(id, reports));
        setLoading(false);
      })
      .catch(() => {
        setQuarry(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <LoadingState />;
  if (!quarry) return <EmptyState title="الكسارة غير موجودة" action={<Button onClick={() => navigate('/quarries')}>رجوع للقائمة</Button>} />;

  return (
    <>
      <Helmet>
        <title>{quarry.name} — الكسارات</title>
      </Helmet>

      <div className="no-print">
        <PageHeader
          title={quarry.name}
          subtitle="بيانات وسجل التوريدات"
          breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'الكسارات', to: '/quarries' }, { label: quarry.name }]}
          actions={
            <>
              <Button variant="secondary" onClick={() => navigate('/quarries')}><ArrowRight className="h-4 w-4" /> رجوع</Button>
              <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>
              <WhatsAppButton href={whatsappHref(quarry.phone, `كشف توريدات الكسارة — ${quarry.name}`)} />
            </>
          }
        />
      </div>

      <article className="print-sheet app-card mx-auto max-w-4xl p-6 sm:p-10">
        <PrintHeader
          title="كشف توريدات الكسارة"
          subtitle={getSettings().factoryName}
          meta={[
            ['اسم الكسارة', quarry.name],
            ['المالك', quarry.owner || '—'],
            ['الهاتف', quarry.phone || '—'],
            ['عدد التوريدات', formatNumberAr(stats?.deliveries?.length)],
            ['إجمالي الوزن المُورَّد', `${formatNumberAr(stats?.totalWeight)} طن`],
          ]}
        />

        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">بيانات الكسارة</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['الاسم', quarry.name],
              ['المالك', quarry.owner || '—'],
              ['الهاتف', quarry.phone || '—'],
              ['العنوان', quarry.address || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-muted-foreground">{k}:</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">ملخص التوريدات</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'عدد التوريدات', value: formatNumberAr(stats?.deliveries?.length) },
              { label: 'إجمالي الوزن المُورَّد', value: `${formatNumberAr(stats?.totalWeight)} طن` },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-border bg-secondary/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">سجل التوريدات</h3>
          {!stats?.deliveries?.length ? (
            <p className="text-sm text-muted-foreground">لا توجد توريدات مسجلة لهذه الكسارة.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="bg-secondary/70">
                    {['التاريخ', 'نوع الخامة', 'الوزن', 'الوحدة', 'القلابات المستخدمة'].map((h) => (
                      <th key={h} className="border border-border px-2 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.deliveries.map((d, i) => (
                    <tr key={i} className="hover:bg-secondary/30">
                      <td className="border border-border px-2 py-2">{formatDateAr(d.date)}</td>
                      <td className="border border-border px-2 py-2 font-medium">{d.material || '—'}</td>
                      <td className="border border-border px-2 py-2">{formatNumberAr(d.weight)}</td>
                      <td className="border border-border px-2 py-2">{d.unit}</td>
                      <td className="border border-border px-2 py-2">{(d.trucks || []).join('، ') || '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-secondary font-semibold">
                    <td colSpan={2} className="border border-border px-2 py-2">الإجمالي</td>
                    <td className="border border-border px-2 py-2">{formatNumberAr(stats.totalWeight)}</td>
                    <td className="border border-border px-2 py-2">طن</td>
                    <td className="border border-border px-2 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <PrintFooter signatures={['مدير المصنع', 'مسؤول الكسارة', 'التوقيع', 'التاريخ']} />
      </article>
    </>
  );
}