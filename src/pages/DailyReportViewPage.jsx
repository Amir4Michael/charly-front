import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { Button, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { PrintHeader, PrintFooter } from '@/components/print/PrintLayout';
import { getReport } from '@/services/reportsService';
import { getSettings } from '@/services/settingsService';
import { formatDateAr, formatMoney, formatNumberAr, reportTotals } from '@/utils/reportUtils';

const Block = ({ title, children }) => (
  <section className="mb-6">
    <h3 className="mb-2 border-b border-border pb-1 text-sm font-semibold text-foreground">{title}</h3>
    {children}
  </section>
);

const Rows = ({ head, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[520px] border-collapse text-sm">
      <thead>
        <tr className="bg-secondary/70">
          {head.map((h) => (
            <th key={h} className="border border-border px-2 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`r-${i}`}>
            {r.map((c, j) => (
              <td key={`c-${j}`} className="border border-border px-2 py-2">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function DailyReportViewPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReport(id).then((r) => {
      setReport(r);
      setLoading(false);
      if (r && params.get('print') === '1') setTimeout(() => window.print(), 400);
    });
  }, [id, params]);

  if (loading) return <LoadingState />;
  if (!report)
    return <EmptyState title="التقرير غير موجود" action={<Button onClick={() => navigate('/operations/daily-reports')}>رجوع للقائمة</Button>} />;

  const t = reportTotals(report);

  return (
    <>
      <Helmet>
        <title>عرض التقرير اليومي — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="عرض تفصيلي للتقرير اليومي لتشغيل مصنع كربونات الكالسيوم مع إمكانية الطباعة." />
      </Helmet>

      <div className="no-print">
        <PageHeader
          title="عرض التقرير اليومي"
          subtitle={formatDateAr(report.date)}
          breadcrumb={[
            { label: 'الرئيسية', to: '/' },
            { label: 'التقرير اليومي', to: '/operations/daily-reports' },
            { label: 'عرض' },
          ]}
          actions={
            <>
              <Button variant="secondary" onClick={() => navigate(`/operations/daily-reports/${report.id}/edit`)}>تعديل</Button>
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> طباعة التقرير
              </Button>
            </>
          }
        />
      </div>

      <article className="print-sheet app-card mx-auto max-w-4xl p-6 sm:p-10">
        <PrintHeader
          title="التقرير اليومي للتشغيل"
          subtitle={getSettings().factoryName}
          meta={[
            ['التاريخ', formatDateAr(report.date)],
            ['الورديات المختارة', (report.shifts || []).join('، ') || '—'],
            ['عدد الورديات المحسوبة', `${formatNumberAr(t.shiftsCount)} وردية`],
            ['ساعات التشغيل', `${formatNumberAr(t.hours)} ساعة`],
            ['مديرو المصنع', (report.managers || []).join('، ') || '—'],
            ['الكسارة', report.raw?.crusher || '—'],
          ]}
        />

        <Block title="بيانات عامة">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex gap-2"><dt className="text-muted-foreground">مديرو المصنع:</dt><dd>{(report.managers || []).join('، ') || '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">الورديات:</dt><dd>{(report.shifts || []).join('، ') || '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">المشغل:</dt><dd>{(report.shiftTeams || []).length > 1 ? (report.shiftTeams.map((t) => t.operator).filter(Boolean).join('، ') || '—') : (report.operator || '—')}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">عدد العمال:</dt><dd>{formatNumberAr(report.workersCount)}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">العمال:</dt><dd>{(report.workers || []).map((w) => (typeof w === 'string' ? w : w.name)).join('، ') || '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-muted-foreground">الكسارة:</dt><dd>{report.raw?.crusher || '—'}</dd></div>
          </dl>
        </Block>

        <Block title="الخامة">
          <Rows
            head={['نوع الخامة', 'الوزن', 'الوحدة', 'الكسارة', 'سعر الخامة', 'القيمة الإجمالية']}
            rows={[[
              report.raw?.type || '—',
              formatNumberAr(report.raw?.weight),
              report.raw?.unit || '—',
              report.raw?.crusher || '—',
              report.raw?.price ? formatMoney(report.raw.price) : '—',
              report.raw?.price ? formatMoney((Number(report.raw.weight) || 0) * (Number(report.raw.price) || 0)) : '—',
            ]]}
          />
        </Block>

        <Block title="القلابات">
          <Rows
            head={['اسم القلاب', 'الوزن', 'سعر النقلة', 'الإجمالي', 'المدفوع', 'المتبقي']}
            rows={(report.tippers || []).map((x) => [
              x.name || '—',
              formatNumberAr(x.weight),
              x.rate ? formatMoney(x.rate) : '—',
              x.total ? formatMoney(x.total) : '—',
              x.paid ? formatMoney(x.paid) : '—',
              x.remaining ? formatMoney(x.remaining) : '—',
            ])}
          />
        </Block>

        {(report.operatingHours || []).some((h) => h.runStart || h.runEnd || h.stopHours) && (
          <Block title="ساعات التشغيل والتوقف">
            <Rows
              head={['بداية التشغيل', 'نهاية التشغيل', 'ساعات التشغيل الفعلية', 'ساعات التوقف', 'سبب التوقف']}
              rows={(report.operatingHours || []).map((h) => [
                h.runStart || '—', h.runEnd || '—', formatNumberAr(h.runHours), formatNumberAr(h.stopHours) || '0', h.stopReason || '—',
              ])}
            />
          </Block>
        )}

        {(report.workers || []).length > 0 && typeof report.workers[0] === 'object' && (
          <Block title="العمال">
            <Rows
              head={['اسم العامل', 'عدد الساعات', 'المستحق', 'المدفوع', 'المتبقي']}
              rows={(report.workers || []).map((w) => [
                w.name || '—', formatNumberAr(w.hours), formatMoney(w.dailyAmount), formatMoney(w.paid), formatMoney(w.remaining),
              ])}
            />
          </Block>
        )}

        {(report.shiftTeams || []).length > 1 && (
          <Block title="المشغلون والعمال حسب الوردية">
            {report.shiftTeams.map((team, i) => (
              <div key={team.id || i} className="mb-4 last:mb-0">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  وردية {i + 1} — المشغل: {team.operator || '—'}
                </p>
                <Rows
                  head={['اسم العامل', 'عدد الساعات', 'المستحق', 'المدفوع', 'المتبقي']}
                  rows={(team.workers || []).map((w) => [
                    w.name || '—', formatNumberAr(w.hours), formatMoney(w.dailyAmount), formatMoney(w.paid), formatMoney(w.remaining),
                  ])}
                />
              </div>
            ))}
          </Block>
        )}

        <Block title="الإنتاج والتعبئة">
          <Rows head={['درجة النعومة', 'ساعات التشغيل', 'نوع العبوة', 'العميل']} rows={(report.production || []).map((x) => [x.fineness || '—', formatNumberAr(x.hours), x.packaging || '—', x.customer || '—'])} />
        </Block>

        <Block title="التحميل والمبيعات">
          <Rows
            head={['النوع', 'الوزن', 'العميل', 'العبوة', 'السعر', 'الدفع', 'المدفوع', 'المتبقي', 'الإجمالي', 'السائق', 'رقم السيارة', 'بطاقة السائق', 'نوع السيارة']}
            rows={(report.loading || []).map((x) => [
              x.fineness || '—', formatNumberAr(x.weight), x.customer || '—', x.packaging || '—',
              formatMoney(x.price), x.payment || '—',
              x.payment === 'آجل' ? formatMoney(x.paid) : '—',
              x.payment === 'آجل' ? formatMoney(x.remaining) : '—',
              formatMoney((Number(x.weight) || 0) * (Number(x.price) || 0)),
              x.driverName || '—', x.vehiclePlateNumber || '—', x.driverIdNumber || '—', x.vehicleType || '—',
            ])}
          />
        </Block>

        <Block title="المصاريف">
          {(report.expenses || []).some((x) => x.category || x.entity || x.notes) ? (
            <Rows
              head={['القسم', 'نوع المصروف', 'المبلغ', 'الجهة', 'ملاحظات']}
              rows={(report.expenses || []).map((x) => [x.category || '—', x.type || '—', formatMoney(x.amount), x.entity || '—', x.notes || '—'])}
            />
          ) : (
            <Rows
              head={['نوع / اسم المصروف', 'المبلغ']}
              rows={(report.expenses || []).map((x) => [x.type || '—', formatMoney(x.amount)])}
            />
          )}
        </Block>

        <Block title="الإجماليات">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between border-b border-border pb-1"><dt className="text-muted-foreground">إجمالي ساعات التشغيل</dt><dd className="font-semibold">{formatNumberAr(t.hours)} ساعة</dd></div>
            <div className="flex justify-between border-b border-border pb-1"><dt className="text-muted-foreground">إجمالي ساعات التوقف</dt><dd className="font-semibold">{formatNumberAr(t.stoppedHours)} ساعة</dd></div>
            <div className="flex justify-between border-b border-border pb-1"><dt className="text-muted-foreground">إجمالي عدد الورديات</dt><dd className="font-semibold">{formatNumberAr(t.shiftsCount)} وردية</dd></div>
            <div className="flex justify-between border-b border-border pb-1"><dt className="text-muted-foreground">إجمالي الوزن المحمّل</dt><dd className="font-semibold">{formatNumberAr(t.loadedWeight)} طن</dd></div>
            <div className="flex justify-between border-b border-border pb-1"><dt className="text-muted-foreground">إجمالي المبيعات</dt><dd className="font-semibold">{formatMoney(t.sales)}</dd></div>
            <div className="flex justify-between border-b border-border pb-1"><dt className="text-muted-foreground">إجمالي المصاريف</dt><dd className="font-semibold">{formatMoney(t.expenses)}</dd></div>
            <div className="flex justify-between border-b border-border pb-1"><dt className="text-muted-foreground">المتبقي (آجل)</dt><dd className="font-semibold">{formatMoney(t.remaining)}</dd></div>
            <div className="flex justify-between border-b border-border pb-1"><dt className="text-muted-foreground">الصافي</dt><dd className="font-semibold">{formatMoney(t.sales - t.expenses)}</dd></div>
          </dl>
        </Block>

        <PrintFooter signatures={['المشغل', 'مدير المصنع', 'التوقيع', 'التاريخ']} />
      </article>
    </>
  );
}