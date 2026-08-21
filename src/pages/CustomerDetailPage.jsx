import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Printer, 
  ArrowRight, 
  Building2, 
  Phone, 
  MapPin, 
  UserCheck, 
  FileText, 
  TrendingUp, 
  Wallet, 
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Button, EmptyState, LoadingState, PageHeader, WhatsAppButton } from '@/components/common';
import { PrintHeader, PrintFooter } from '@/components/print/PrintLayout';
import HistoricalTransactions from '@/components/HistoricalTransactions';
import { getCustomer, getCustomerStatement } from '@/services/customersService';
import { formatDateAr, formatMoney, formatNumberAr } from '@/utils/reportUtils';
import { getSettings } from '@/services/settingsService';
import { whatsappHref } from '@/lib/phone';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // تُعاد كل مرة نحتاج فيها تحديث كشف الحساب (بعد إضافة/تعديل/حذف معاملة قديمة مثلًا)
  const reloadStatement = useCallback(() => {
    getCustomerStatement(id).then(setStats).catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    getCustomer(id)
      .then((c) => {
        setCustomer(c);
        return getCustomerStatement(id);
      })
      .then((s) => {
        if (s) setStats(s);
        setLoading(false);
      })
      .catch(() => {
        setCustomer(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <LoadingState />;
  if (!customer) return <EmptyState title="العميل غير موجود" action={<Button onClick={() => navigate('/customers')}>رجوع للقائمة</Button>} />;

  const isDebt = (stats?.totalRemaining || 0) > 0;

  return (
    <>
      <Helmet>
        <title>{customer.name} — كشف الحساب</title>
        <meta name="description" content={`كشف حساب العميل ${customer.name}`} />
      </Helmet>

      {/* Top Header Controls (Hidden on Print) */}
      <div className="no-print">
        <PageHeader
          title={customer.name}
          subtitle="بيانات وكشف حساب العميل المفصل"
          breadcrumb={[
            { label: 'الرئيسية', to: '/' }, 
            { label: 'العملاء', to: '/customers' }, 
            { label: customer.name }
          ]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => navigate('/customers')} className="gap-2">
                <ArrowRight className="h-4 w-4" /> رجوع
              </Button>
              <Button onClick={() => window.print()} className="gap-2 shadow-sm">
                <Printer className="h-4 w-4" /> طباعة كشف الحساب
              </Button>
              <WhatsAppButton href={whatsappHref(customer.phone, `كشف حساب العميل — ${customer.name}`)} />
            </div>
          }
        />
      </div>

      <article className="print-sheet app-card mx-auto max-w-5xl p-4 sm:p-8 space-y-8">
        {/* Printable Official Header */}
        <PrintHeader
          title="كشف حساب عميل"
          subtitle={getSettings().factoryName}
          meta={[
            ['اسم العميل', customer.name],
            ['الهاتف', customer.phone || '—'],
            ['إجمالي المبيعات', formatMoney(stats?.totalSales)],
            ['المتبقي (آجل + قديم)', formatMoney(stats?.totalRemaining)],
          ]}
        />

        {/* Customer Profile Banner / Quick Info Card */}
        <section className="no-print rounded-2xl border border-border/80 bg-linear-to-br from-card via-card to-primary/5 p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3.5">
              <div className="rounded-2xl bg-primary/10 p-3.5 text-primary shrink-0">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground">{customer.name}</h2>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">عميل مسجل لدى المصنع</p>
              </div>
            </div>

            {isDebt ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-bold w-fit">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>يوجد رصيد مستحق (آجل): {formatMoney(stats?.totalRemaining)}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold w-fit">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>الحساب متزن / مكتمل السداد</span>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 text-sm">
            <div className="flex items-start gap-2.5">
              <Phone className="h-4 w-4 text-muted-foreground/80 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">رقم الهاتف</p>
                <p className="font-bold text-foreground dir-ltr text-right">{customer.phone || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <UserCheck className="h-4 w-4 text-muted-foreground/80 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">الشخص المسؤول</p>
                <p className="font-bold text-foreground">{customer.contactPerson || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-muted-foreground/80 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">العنوان</p>
                <p className="font-medium text-foreground truncate">{customer.address || '—'}</p>
              </div>
            </div>

            {customer.notes && (
              <div className="flex items-start gap-2.5 sm:col-span-2 lg:col-span-1">
                <FileText className="h-4 w-4 text-muted-foreground/80 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">ملاحظات</p>
                  <p className="font-medium text-foreground text-xs leading-relaxed">{customer.notes}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Printable Customer Details Block */}
        <section className="print-only mb-4 hidden">
          <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold">بيانات العميل</h3>
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="flex gap-2"><dt className="text-muted-foreground">الاسم:</dt><dd className="font-bold">{customer.name}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">الهاتف:</dt><dd className="font-medium">{customer.phone || '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">العنوان:</dt><dd className="font-medium">{customer.address || '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">المسؤول:</dt><dd className="font-medium">{customer.contactPerson || '—'}</dd></div>
          </dl>
        </section>

        {/* Financial KPI Summary Cards */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">ملخص الحساب المالية (الجديد + القديم)</h3>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-2xs">
              <p className="text-xs font-semibold text-muted-foreground">إجمالي المبيعات</p>
              <p className="mt-1 text-xl font-black text-foreground">{formatMoney(stats?.totalSales)}</p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-2xs">
              <p className="text-xs font-semibold text-muted-foreground">إجمالي المدفوعات</p>
              <p className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">{formatMoney(stats?.totalPaid)}</p>
            </div>

            <div className={`rounded-xl border p-4 text-center shadow-2xs ${isDebt ? 'border-destructive/30 bg-destructive/5' : 'border-border/80 bg-card'}`}>
              <p className="text-xs font-semibold text-muted-foreground">المتبقي (آجل + قديم)</p>
              <p className={`mt-1 text-xl font-black ${isDebt ? 'text-destructive' : 'text-foreground'}`}>
                {formatMoney(stats?.totalRemaining)}
              </p>
            </div>
          </div>
        </section>

        {/* Sales History Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/70 pb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">سجل المبيعات (التقارير اليومية)</h3>
          </div>

          {!stats?.sales?.length ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              لا توجد مبيعات مسجلة لهذا العميل في التقارير اليومية.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full min-w-[640px] border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                    <th className="p-2.5 text-right">التاريخ</th>
                    <th className="p-2.5 text-right">درجة النعومة</th>
                    <th className="p-2.5 text-right">الوزن (طن)</th>
                    <th className="p-2.5 text-right">العبوة</th>
                    <th className="p-2.5 text-right">السعر/طن</th>
                    <th className="p-2.5 text-right">طريقة الدفع</th>
                    <th className="p-2.5 text-right">الإجمالي</th>
                    <th className="p-2.5 text-right">المدفوع</th>
                    <th className="p-2.5 text-right">المتبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stats.sales.map((s, i) => {
                    const total = (Number(s.weight) || 0) * (Number(s.price) || 0);
                    const isCredit = s.payment === 'آجل';
                    return (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 font-medium whitespace-nowrap">{formatDateAr(s.date)}</td>
                        <td className="p-2.5 font-bold text-foreground">{s.fineness || '—'}</td>
                        <td className="p-2.5">{formatNumberAr(s.weight)}</td>
                        <td className="p-2.5">{s.packaging || '—'}</td>
                        <td className="p-2.5">{formatMoney(s.price)}</td>
                        <td className="p-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${isCredit ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                            {s.payment || '—'}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-foreground">{formatMoney(total)}</td>
                        <td className="p-2.5">{isCredit ? formatMoney(s.paid) : formatMoney(total)}</td>
                        <td className="p-2.5 font-bold">
                          {isCredit && s.remaining > 0 ? (
                            <span className="text-destructive">{formatMoney(s.remaining)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-muted/80 font-bold text-foreground border-t-2 border-border">
                    <td colSpan={6} className="p-2.5 text-left">الإجمالي النهائي</td>
                    <td className="p-2.5">{formatMoney(stats.totalSales)}</td>
                    <td className="p-2.5 text-emerald-600 dark:text-emerald-400">{formatMoney(stats.totalPaid)}</td>
                    <td className="p-2.5 text-destructive">{formatMoney(stats.totalRemaining)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Full Chronological Ledger Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/70 pb-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">كشف الحساب الكامل (الرصيد التراكمي المتحرك)</h3>
          </div>

          {!stats?.ledger?.length ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              لا توجد عمليات مسجلة لإنشاء كشف حساب.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full min-w-[560px] border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                    <th className="p-2.5 text-right">التاريخ</th>
                    <th className="p-2.5 text-right">نوع العملية</th>
                    <th className="p-2.5 text-right">التفاصيل</th>
                    <th className="p-2.5 text-right">المصدر</th>
                    <th className="p-2.5 text-right">الرصيد بعد العملية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stats.ledger.map((e, i) => {
                    const isHistorical = e.source === 'historical';
                    return (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 font-medium whitespace-nowrap">{formatDateAr(e.date)}</td>
                        <td className="p-2.5 font-bold">{e.type}</td>
                        <td className="p-2.5 text-muted-foreground">{e.description || '—'}</td>
                        <td className="p-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${isHistorical ? 'bg-secondary text-foreground' : 'bg-primary/10 text-primary'}`}>
                            {isHistorical ? 'دفتر قديم' : 'نظام جديد'}
                          </span>
                        </td>
                        <td className={`p-2.5 font-black ${e.balance > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {formatMoney(e.balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Historical Ledger Component */}
        <section className="no-print pt-2">
          <HistoricalTransactions
            entityType="customer"
            entityId={id}
            historical={stats?.historical || []}
            onChanged={reloadStatement}
            directionHint="له = دفعة أو رصيد لصالح العميل (يقلّل ما عليه). عليه = عملية بيع أو دين قديم (يزيد ما عليه)."
          />
        </section>

        {/* Printable Footer Signatures */}
        <PrintFooter signatures={['توقيع العميل', 'مدير المصنع', 'المحاسب', 'التاريخ']} />
      </article>
    </>
  );
}