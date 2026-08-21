import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer, ArrowRight, Building2, Truck, Weight, FileText } from 'lucide-react';
import { Button, EmptyState, LoadingState, PageHeader, WhatsAppButton } from '@/components/common';
import { PrintHeader, PrintFooter } from '@/components/print/PrintLayout';
import HistoricalTransactions from '@/components/HistoricalTransactions';
import { getQuarry, getQuarryStatement } from '@/services/quarriesService';
import { formatDateAr, formatMoney, formatNumberAr } from '@/utils/reportUtils';
import { getSettings } from '@/services/settingsService';
import { whatsappHref } from '@/lib/phone';

export default function QuarryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quarry, setQuarry] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const reloadStatement = useCallback(() => {
    getQuarryStatement(id).then(setStats).catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    getQuarry(id)
      .then((q) => {
        setQuarry(q);
        return getQuarryStatement(id);
      })
      .then((s) => {
        if (s) setStats(s);
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

      {/* شريط الإجراءات والترويس للبرنامج - يختفي أثناء الطباعة */}
      <div className="no-print mb-6">
        <PageHeader
          title={quarry.name}
          subtitle="بيانات وسجل التوريدات التفصيلي"
          breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'الكسارات', to: '/quarries' }, { label: quarry.name }]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => navigate('/quarries')} className="gap-1.5 shadow-sm">
                <ArrowRight className="h-4 w-4" /> رجوع
              </Button>
              <Button onClick={() => window.print()} className="gap-1.5 bg-[#0f3a5f] hover:bg-[#1d598f] shadow-sm">
                <Printer className="h-4 w-4" /> طباعة المستند
              </Button>
              <WhatsAppButton href={whatsappHref(quarry.phone, `كشف توريدات الكسارة — ${quarry.name}`)} />
            </div>
          }
        />
      </div>

      {/* ورقة المستند الشاملة للطباعة والعرض */}
      <article className="print-sheet mx-auto max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md transition-all sm:p-10 print:max-w-none print:rounded-none print:border-none print:bg-transparent print:p-0 print:shadow-none">
        
        {/* هيدر المستند الموحد */}
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

        {/* كروت الإحصائيات الرئيسية - ملخص سريع يريح العين */}
        <section className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100/60 p-4 shadow-sm print:border-slate-300 print:bg-transparent print:p-3 print:shadow-none">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f3a5f]/10 text-[#0f3a5f] print:hidden">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 print:text-slate-700">عدد التوريدات الإجمالي</p>
                  <p className="mt-0.5 text-xl font-black text-slate-900 print:text-black">
                    {formatNumberAr(stats?.deliveries?.length)}{' '}
                    <span className="text-xs font-medium text-slate-500">نقلة / شحنة</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-[#0f3a5f]/20 bg-gradient-to-br from-[#0f3a5f]/5 to-slate-50 p-4 shadow-sm print:border-slate-300 print:bg-transparent print:p-3 print:shadow-none">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f3a5f] text-white print:hidden">
                  <Weight className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 print:text-slate-700">إجمالي الوزن المُورَّد</p>
                  <p className="mt-0.5 text-xl font-black text-[#0f3a5f] print:text-black">
                    {formatNumberAr(stats?.totalWeight)}{' '}
                    <span className="text-xs font-bold text-slate-600">طن</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* قسم بيانات الكسارة التفصيلية */}
        <section className="mb-8 rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 print:border-slate-300 print:bg-transparent print:p-0">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-200/80 pb-2 print:border-slate-300">
            <Building2 className="h-4 w-4 text-[#0f3a5f] print:hidden" />
            <h3 className="text-sm font-bold text-slate-800 print:text-black">بيانات الكسارة الأساسية</h3>
          </div>
          <dl className="grid gap-3 text-xs sm:grid-cols-2 sm:text-sm">
            {[
              ['اسم الكسارة', quarry.name],
              ['اسم المالك', quarry.owner || '—'],
              ['رقم الهاتف', quarry.phone || '—'],
              ['العنوان / الموقع', quarry.address || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-200/50 print:bg-transparent print:p-0 print:shadow-none print:ring-0">
                <dt className="font-semibold text-slate-500 print:text-slate-700">{k}:</dt>
                <dd className="font-bold text-slate-900 print:text-black">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* سجل التوريدات - جدول فاخر ومنظم جداً */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-200/80 pb-2 print:border-slate-300">
            <FileText className="h-4 w-4 text-[#0f3a5f] print:hidden" />
            <h3 className="text-sm font-bold text-slate-800 print:text-black">سجل التوريدات التفصيلي</h3>
          </div>

          {!stats?.deliveries?.length ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs font-medium text-slate-500">
              لا توجد توريدات مسجلة لهذه الكسارة حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm print:rounded-none print:border-slate-300 print:shadow-none">
              <table className="w-full min-w-[500px] border-collapse text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0f3a5f] text-white print:bg-slate-100 print:text-black">
                    {['التاريخ', 'نوع الخامة', 'الوزن', 'الوحدة', 'القلابات المستخدمة'].map((h) => (
                      <th key={h} className="border-b border-[#0f3a5f] px-3.5 py-3 font-bold print:border-slate-300">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {stats.deliveries.map((d, i) => (
                    <tr 
                      key={i} 
                      className={i % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-50/80'}
                    >
                      <td className="px-3.5 py-2.5 font-semibold text-slate-700 print:text-black">
                        {formatDateAr(d.date)}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900 print:text-black">
                        <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 print:bg-transparent print:p-0">
                          {d.material || '—'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-black text-[#0f3a5f] print:text-black">
                        {formatNumberAr(d.weight)}
                      </td>
                      <td className="px-3.5 py-2.5 font-medium text-slate-600 print:text-black">
                        {d.unit}
                      </td>
                      <td className="px-3.5 py-2.5 text-xs text-slate-600 print:text-black">
                        {(d.trucks || []).join('، ') || '—'}
                      </td>
                    </tr>
                  ))}
                  
                  {/* صف الإجمالي النهائي */}
                  <tr className="border-t-2 border-[#0f3a5f] bg-slate-100/90 font-black text-slate-900 print:border-slate-400 print:bg-slate-200">
                    <td colSpan={2} className="px-3.5 py-3 text-left font-black text-[#0f3a5f] print:text-black">
                      الإجمالي الكلي:
                    </td>
                    <td className="px-3.5 py-3 text-base text-[#0f3a5f] print:text-black">
                      {formatNumberAr(stats.totalWeight)}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-700 print:text-black">
                      طن
                    </td>
                    <td className="px-3.5 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* قسم المعاملات المالية السابقة والمعاملات المخصصة */}
        <section className="mb-6 rounded-xl border border-slate-200/80 bg-slate-50/30 p-4 print:border-none print:bg-transparent print:p-0">
          <HistoricalTransactions
            entityType="quarry"
            entityId={id}
            historical={stats?.historical || []}
            onChanged={reloadStatement}
            directionHint="له = مستحق للكسارة (المصنع مدين لها). عليه = يقلّل المستحق (مثال: تم الدفع)."
            noBalanceNote="لا يوجد حاليًا مستحق مالي مرتبط بالتوريدات نفسها في النظام (الوزن فقط)؛ المعاملات القديمة هنا سجل مالي مستقل حسب ما تدخله يدويًا."
          />
          {stats?.historical?.length ? (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm print:border-slate-300 print:bg-transparent print:shadow-none">
              <span className="text-xs font-bold text-slate-600 print:text-black">صافي المعاملات المالية القديمة:</span>
              <span className="text-sm font-black text-[#0f3a5f] print:text-black">
                {formatMoney(stats.historicalNetBalance)}
              </span>
            </div>
          ) : null}
        </section>

        {/* فوتر المستند والتوقيعات الرسمية */}
        <PrintFooter signatures={['مدير المصنع', 'مسؤول الكسارة', 'التوقيع', 'التاريخ']} />
      </article>
    </>
  );
}