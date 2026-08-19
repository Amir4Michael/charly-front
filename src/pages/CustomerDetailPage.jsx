import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer, ArrowRight } from 'lucide-react';
import { Button, EmptyState, LoadingState, PageHeader, SectionCard, WhatsAppButton } from '@/components/common';
import { PrintHeader, PrintFooter } from '@/components/print/PrintLayout';
import { getCustomer } from '@/services/customersService';
import { listReports } from '@/services/reportsService';
import { computeCustomerStats, formatDateAr, formatMoney, formatNumberAr } from '@/utils/reportUtils';
import { getSettings } from '@/services/settingsService';
import { whatsappHref } from '@/lib/phone';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCustomer(id)
      .then((c) => {
        setCustomer(c);
        return listReports();
      })
      .then((reports) => {
        if (reports) setStats(computeCustomerStats(id, reports));
        setLoading(false);
      })
      .catch(() => {
        setCustomer(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <LoadingState />;
  if (!customer) return <EmptyState title="العميل غير موجود" action={<Button onClick={() => navigate('/customers')}>رجوع للقائمة</Button>} />;

  return (
    <>
      <Helmet>
        <title>{customer.name} — العملاء</title>
        <meta name="description" content={`كشف حساب العميل ${customer.name}`} />
      </Helmet>

      <div className="no-print">
        <PageHeader
          title={customer.name}
          subtitle="بيانات وكشف حساب العميل"
          breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'العملاء', to: '/customers' }, { label: customer.name }]}
          actions={
            <>
              <Button variant="secondary" onClick={() => navigate('/customers')}>
                <ArrowRight className="h-4 w-4" /> رجوع
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> طباعة كشف الحساب
              </Button>
              <WhatsAppButton href={whatsappHref(customer.phone, `كشف حساب العميل — ${customer.name}`)} />
            </>
          }
        />
      </div>

      <article className="print-sheet app-card mx-auto max-w-4xl p-6 sm:p-10">
        <PrintHeader
          title="كشف حساب العميل"
          subtitle={getSettings().factoryName}
          meta={[
            ['اسم العميل', customer.name],
            ['الهاتف', customer.phone || '—'],
            ['إجمالي المبيعات', formatMoney(stats?.totalSales)],
            ['المتبقي (آجل)', formatMoney(stats?.totalRemaining)],
          ]}
        />

        {/* بيانات العميل */}
        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">بيانات العميل</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['الاسم', customer.name],
              ['الهاتف', customer.phone || '—'],
              ['العنوان', customer.address || '—'],
              ['الشخص المسؤول', customer.contactPerson || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-muted-foreground">{k}:</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
            {customer.notes && (
              <div className="flex gap-2 sm:col-span-2">
                <dt className="text-muted-foreground">ملاحظات:</dt>
                <dd>{customer.notes}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* ملخص الحساب */}
        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">ملخص الحساب</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'إجمالي المبيعات', value: formatMoney(stats?.totalSales), highlight: false },
              { label: 'المدفوع', value: formatMoney(stats?.totalPaid), highlight: false },
              { label: 'المتبقي (آجل)', value: formatMoney(stats?.totalRemaining), highlight: true },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-border bg-secondary/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`mt-1 text-lg font-bold ${item.highlight && stats?.totalRemaining > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* سجل المبيعات */}
        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">سجل المبيعات</h3>
          {!stats?.sales?.length ? (
            <p className="text-sm text-muted-foreground">لا توجد مبيعات مسجلة لهذا العميل.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="bg-secondary/70">
                    {['التاريخ', 'درجة النعومة', 'الوزن (طن)', 'العبوة', 'السعر/طن', 'طريقة الدفع', 'الإجمالي', 'المدفوع', 'المتبقي'].map((h) => (
                      <th key={h} className="border border-border px-2 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.sales.map((s, i) => {
                    const total = (Number(s.weight) || 0) * (Number(s.price) || 0);
                    return (
                      <tr key={i} className="hover:bg-secondary/30">
                        <td className="border border-border px-2 py-2">{formatDateAr(s.date)}</td>
                        <td className="border border-border px-2 py-2 font-medium">{s.fineness || '—'}</td>
                        <td className="border border-border px-2 py-2">{formatNumberAr(s.weight)}</td>
                        <td className="border border-border px-2 py-2">{s.packaging || '—'}</td>
                        <td className="border border-border px-2 py-2">{formatMoney(s.price)}</td>
                        <td className="border border-border px-2 py-2">{s.payment || '—'}</td>
                        <td className="border border-border px-2 py-2 font-semibold">{formatMoney(total)}</td>
                        <td className="border border-border px-2 py-2">{s.payment === 'آجل' ? formatMoney(s.paid) : formatMoney(total)}</td>
                        <td className="border border-border px-2 py-2 font-semibold text-destructive">
                          {s.payment === 'آجل' ? formatMoney(s.remaining) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-secondary font-semibold">
                    <td colSpan={6} className="border border-border px-2 py-2 text-left">الإجمالي</td>
                    <td className="border border-border px-2 py-2">{formatMoney(stats.totalSales)}</td>
                    <td className="border border-border px-2 py-2">{formatMoney(stats.totalPaid)}</td>
                    <td className="border border-border px-2 py-2 text-destructive">{formatMoney(stats.totalRemaining)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <PrintFooter signatures={['العميل', 'مدير المصنع', 'التوقيع', 'التاريخ']} />
      </article>
    </>
  );
}