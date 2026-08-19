import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Printer, Wallet, Receipt, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import {
  Button, EmptyState, LoadingState, PageHeader, SectionCard, StatCard,
} from '@/components/common';
import { getAccountsOverview } from '@/services/accountsService';
import { formatMoney, todayISO } from '@/utils/reportUtils';
import { getSettings } from '@/services/settingsService';

function LedgerTable({ title, rows, to, columns }) {
  return (
    <SectionCard title={title}>
      {!rows.length ? (
        <EmptyState title="لا توجد بيانات" />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-secondary/70">
                {columns.map((c) => (
                  <th key={c} className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">{c}</th>
                ))}
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium">{r.name}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatMoney(r.due)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatMoney(r.paid)}</td>
                  <td className={`whitespace-nowrap px-3 py-2.5 font-semibold ${r.remaining > 0 ? 'text-destructive' : ''}`}>{formatMoney(r.remaining)}</td>
                  <td className="px-3 py-2.5">
                    <Link to={`${to}/${r.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      كشف الحساب <ArrowLeft className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

const emptySummary = {
  totalSales: 0, totalExpenses: 0, net: 0, receivable: 0, payableTrucks: 0, payableWorkers: 0,
  customerRows: [], quarryRows: [], truckRows: [], workerRows: [],
};

export default function AccountsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(emptySummary);

  useEffect(() => {
    getAccountsOverview()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <>
      <Helmet>
        <title>الحسابات — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="نظرة شاملة على حسابات مصنع كربونات الكالسيوم: المبيعات والمصاريف والمستحقات." />
      </Helmet>

      <div className="no-print">
        <PageHeader
          title="الحسابات"
          subtitle={`نظرة مالية شاملة على مستوى المصنع — ${todayISO()}`}
          breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'المالية' }, { label: 'الحسابات' }]}
          actions={<Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>}
        />
      </div>

      <div className="print-sheet space-y-6">
        <header className="hidden text-center print:block">
          <h2 className="text-xl font-bold">{getSettings().factoryName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">التقرير المالي الشامل</p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="إجمالي المبيعات" value={formatMoney(summary.totalSales)} icon={TrendingUp} />
          <StatCard label="إجمالي المصاريف" value={formatMoney(summary.totalExpenses)} icon={TrendingDown} />
          <StatCard label="الصافي" value={formatMoney(summary.net)} icon={Wallet} />
          <StatCard label="المستحق من العملاء" value={formatMoney(summary.receivable)} icon={Receipt} />
          <StatCard label="المستحق للقلابات" value={formatMoney(summary.payableTrucks)} icon={Receipt} />
          <StatCard label="المستحق للعمال" value={formatMoney(summary.payableWorkers)} icon={Receipt} />
        </div>

        <LedgerTable
          title="حسابات العملاء"
          rows={summary.customerRows}
          to="/customers"
          columns={['العميل', 'إجمالي المبيعات', 'المدفوع', 'المتبقي']}
        />
        <LedgerTable
          title="حسابات القلابات"
          rows={summary.truckRows}
          to="/trucks"
          columns={['القلاب', 'المستحق', 'المدفوع', 'المتبقي']}
        />
        <LedgerTable
          title="حسابات العمال"
          rows={summary.workerRows}
          to="/workers"
          columns={['العامل', 'المستحق', 'المدفوع', 'المتبقي']}
        />

        <SectionCard title="توريدات الكسارات" description="إجمالي الأوزان المستلمة من كل كسارة (بالطن)">
          {!summary.quarryRows.length ? (
            <EmptyState title="لا توجد بيانات" />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {summary.quarryRows.map((q) => (
                <Link key={q.id} to={`/quarries/${q.id}`} className="rounded-md border border-border p-3 text-center hover:bg-secondary/40">
                  <p className="text-xs text-muted-foreground">{q.name}</p>
                  <p className="mt-1 text-base font-bold">{Number(q.due).toLocaleString('ar-EG')} طن</p>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
