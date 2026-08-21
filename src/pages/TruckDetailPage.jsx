import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Printer, 
  ArrowRight, 
  Truck, 
  User, 
  Phone, 
  CreditCard, 
  Weight, 
  Receipt, 
  Scale, 
  DollarSign, 
  History, 
  ListOrdered 
} from 'lucide-react';
import { Button, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { PrintHeader, PrintFooter } from '@/components/print/PrintLayout';
import HistoricalTransactions from '@/components/HistoricalTransactions';
import { getTruck, getTruckStatement } from '@/services/trucksService';
import { formatDateAr, formatMoney, formatNumberAr } from '@/utils/reportUtils';
import { getSettings } from '@/services/settingsService';

export default function TruckDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [truck, setTruck] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const reloadStatement = useCallback(() => {
    getTruckStatement(id).then(setStats).catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    getTruck(id)
      .then((t) => {
        setTruck(t);
        return getTruckStatement(id);
      })
      .then((s) => {
        if (s) setStats(s);
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

      {/* Header - No Print */}
      <div className="no-print mb-6">
        <PageHeader
          title={truck.name}
          subtitle={`السائق: ${truck.driver || '—'}`}
          breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'القلابات', to: '/trucks' }, { label: truck.name }]}
          actions={
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/trucks')} 
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all focus:outline-none"
              >
                <ArrowRight className="h-4 w-4" /> رجوع
              </Button>
              <Button 
                onClick={() => window.print()} 
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all focus:outline-none"
              >
                <Printer className="h-4 w-4" /> طباعة الكشف
              </Button>
            </div>
          }
        />
      </div>

      {/* Printable Sheet Card */}
      <article className="print-sheet app-card mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 space-y-8 text-right dir-rtl">
        
        {/* Print Layout Header */}
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

        {/* Truck Basic Info Section */}
        <section className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200/60 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Truck className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">بيانات القلاب</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'اسم القلاب', value: truck.name, icon: Truck },
              { label: 'السائق', value: truck.driver || '—', icon: User },
              { label: 'الهاتف', value: truck.phone || '—', icon: Phone },
              { label: 'رقم اللوحة', value: truck.plateNumber || '—', icon: CreditCard },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-3 rounded-xl bg-white p-3.5 border border-slate-200/70 shadow-2xs">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-xs font-semibold text-slate-500">{item.label}</span>
                    <span className="font-bold text-slate-900 text-sm truncate block mt-0.5">{item.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Financial Summary Cards */}
        <section>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200/60 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Receipt className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">ملخص الحساب</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'عدد المشاوير', value: formatNumberAr(stats?.trips?.length), icon: ListOrdered, color: 'border-blue-200/80 bg-blue-50/40 text-blue-700' },
              { label: 'إجمالي الوزن', value: `${formatNumberAr(stats?.totalWeight)} طن`, icon: Weight, color: 'border-amber-200/80 bg-amber-50/40 text-amber-700' },
              { label: 'المستحق', value: formatMoney(stats?.totalDue), icon: Scale, color: 'border-emerald-200/80 bg-emerald-50/40 text-emerald-700' },
              { label: 'المتبقي', value: formatMoney(stats?.totalRemaining), icon: DollarSign, highlight: true, color: 'border-rose-200/80 bg-rose-50/40 text-rose-700' },
            ].map((item, idx) => {
              const Icon = item.icon;
              const isDanger = item.highlight && stats?.totalRemaining > 0;
              return (
                <div key={idx} className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xs transition-all ${item.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                    <Icon className="h-4 w-4 opacity-75" />
                  </div>
                  <p className={`mt-2 text-xl font-extrabold ${isDanger ? 'text-rose-600' : 'text-slate-900'}`}>
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trips History Table */}
        <section>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200/60 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Truck className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">سجل المشاوير</h3>
          </div>
          {!stats?.trips?.length ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-medium text-slate-500">
              لا توجد مشاوير مسجلة لهذا القلاب.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full min-w-[640px] border-collapse text-sm text-right">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-700 border-b border-slate-200/80">
                    {['التاريخ', 'الكسارة', 'نوع الخامة', 'الوزن (طن)', 'السعر/طن', 'الإجمالي', 'المدفوع', 'المتبقي'].map((h) => (
                      <th key={h} className="px-3.5 py-3 text-xs font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.trips.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3.5 py-3 font-semibold text-slate-800">{formatDateAr(t.date)}</td>
                      <td className="px-3.5 py-3 text-slate-600">{t.quarry || '—'}</td>
                      <td className="px-3.5 py-3 text-slate-600">{t.material || '—'}</td>
                      <td className="px-3.5 py-3 font-semibold text-slate-800">{formatNumberAr(t.weight)}</td>
                      <td className="px-3.5 py-3 text-slate-600">{t.rate ? formatMoney(t.rate) : '—'}</td>
                      <td className="px-3.5 py-3 font-bold text-slate-900">{formatMoney(t.total)}</td>
                      <td className="px-3.5 py-3 font-semibold text-emerald-600">{formatMoney(t.paid)}</td>
                      <td className="px-3.5 py-3 font-bold text-rose-600">
                        {Number(t.remaining) > 0 ? formatMoney(t.remaining) : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/70 font-bold border-t-2 border-slate-200 text-slate-900">
                    <td colSpan={3} className="px-3.5 py-3">الإجمالي</td>
                    <td className="px-3.5 py-3 text-primary">{formatNumberAr(stats.totalWeight)} طن</td>
                    <td className="px-3.5 py-3"></td>
                    <td className="px-3.5 py-3">{formatMoney(stats.totalDue)}</td>
                    <td className="px-3.5 py-3 text-emerald-600">{formatMoney(stats.totalPaid)}</td>
                    <td className="px-3.5 py-3 text-rose-600">{formatMoney(stats.totalRemaining)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Full Ledger Table */}
        <section>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-200/60 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <History className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">كشف الحساب الكامل (مرتب بالتاريخ)</h3>
          </div>
          {!stats?.ledger?.length ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-medium text-slate-500">
              لا توجد عمليات مسجلة لهذا القلاب بعد.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full min-w-[560px] border-collapse text-sm text-right">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-700 border-b border-slate-200/80">
                    {['التاريخ', 'النوع', 'التفاصيل', 'المصدر', 'الرصيد بعد العملية'].map((h) => (
                      <th key={h} className="px-3.5 py-3 text-xs font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.ledger.map((e, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3.5 py-3 font-semibold text-slate-800">{formatDateAr(e.date)}</td>
                      <td className="px-3.5 py-3">
                        <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {e.type}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-600">{e.description || '—'}</td>
                      <td className="px-3.5 py-3">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                          e.source === 'historical' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}>
                          {e.source === 'historical' ? 'قديمة (دفتر)' : 'جديدة (نظام)'}
                        </span>
                      </td>
                      <td className={`px-3.5 py-3 font-bold ${e.balance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {formatMoney(e.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Historical Transactions Component */}
        <HistoricalTransactions
          entityType="truck"
          entityId={id}
          historical={stats?.historical || []}
          onChanged={reloadStatement}
          directionHint="له = مستحق للقلاب زيادة (المصنع مدين له أكثر). عليه = يقلّل ما هو مستحق له (مثال: تم صرفه بالفعل)."
        />

        {/* Print Layout Footer */}
        <PrintFooter signatures={['السائق', 'مدير المصنع', 'التوقيع', 'التاريخ']} />
      </article>
    </>
  );
}