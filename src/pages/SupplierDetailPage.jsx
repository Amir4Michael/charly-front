import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { Printer, ArrowRight } from 'lucide-react';
import { Button, EmptyState, LoadingState, PageHeader, WhatsAppButton } from '@/components/common';
import { PrintHeader, PrintFooter } from '@/components/print/PrintLayout';
import HistoricalTransactions from '@/components/HistoricalTransactions';
import { getSupplier, SUPPLIER_TYPE_LABELS } from '@/services/suppliersService';
import { listHistoricalTransactions } from '@/services/historicalTransactionsService';
import { getSettings } from '@/services/settingsService';
import { whatsappHref } from '@/lib/phone';

/**
 * صفحة تفاصيل المورد — تعرض فقط البيانات الفعلية الموجودة عن المورد (اسم، جهة اتصال،
 * هاتف، عنوان، ملاحظات). لا رصيد افتراضي مُخترع؛ لو أدخل المستخدم معاملات قديمة فعليًا
 * (قسم HistoricalTransactions) تظهر كسجل مالي حقيقي مستقل، وإلا يبقى القسم فارغًا.
 */
export default function SupplierDetailPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const meta = SUPPLIER_TYPE_LABELS[type];
  const [supplier, setSupplier] = useState(null);
  const [historical, setHistorical] = useState([]);
  const [loading, setLoading] = useState(true);

  const reloadHistorical = useCallback(() => {
    listHistoricalTransactions('supplier', id, type).then(setHistorical).catch(() => {});
  }, [id, type]);

  useEffect(() => {
    setLoading(true);
    getSupplier(type, id)
      .then((s) => {
        setSupplier(s);
        return listHistoricalTransactions('supplier', id, type);
      })
      .then((h) => { if (h) setHistorical(h); setLoading(false); })
      .catch(() => { setSupplier(null); setLoading(false); });
  }, [type, id]);

  if (!meta) {
    return <EmptyState title="نوع مورد غير معروف" description="تحقق من الرابط المستخدم." />;
  }
  if (loading) return <LoadingState />;
  if (!supplier) {
    return (
      <EmptyState
        title="المورد غير موجود"
        action={<Button onClick={() => navigate(`/suppliers/${type}`)}>رجوع للقائمة</Button>}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{supplier.name} — {meta.title}</title>
      </Helmet>

      <div className="no-print">
        <PageHeader
          title={supplier.name}
          subtitle={`بيانات ${meta.singular}`}
          breadcrumb={[
            { label: 'الرئيسية', to: '/' },
            { label: 'الموردون' },
            { label: meta.title, to: `/suppliers/${type}` },
            { label: supplier.name },
          ]}
          actions={
            <>
              <Button variant="secondary" onClick={() => navigate(`/suppliers/${type}`)}><ArrowRight className="h-4 w-4" /> رجوع</Button>
              <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>
              <WhatsAppButton href={whatsappHref(supplier.phone, `بيانات ${meta.singular} — ${supplier.name}`)} />
            </>
          }
        />
      </div>

      <article className="print-sheet app-card mx-auto max-w-4xl p-6 sm:p-10">
        <PrintHeader
          title={`بيانات ${meta.singular}`}
          subtitle={getSettings().factoryName}
          meta={[
            ['اسم المورد', supplier.name],
            ['جهة الاتصال', supplier.contactPerson || '—'],
            ['الهاتف', supplier.phone || '—'],
          ]}
        />

        <section className="mb-6">
          <h3 className="mb-3 border-b border-border pb-1 text-sm font-semibold">بيانات المورد</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['الاسم', supplier.name],
              ['جهة الاتصال', supplier.contactPerson || '—'],
              ['الهاتف', supplier.phone || '—'],
              ['العنوان', supplier.address || '—'],
              ['ملاحظات', supplier.notes || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-muted-foreground">{k}:</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-6">
          <p className="text-sm text-muted-foreground">
            لا يوجد حاليًا ربط تلقائي بين هذا المورد ومعاملات النظام (التقرير اليومي)، لذلك لا يظهر كشف حساب تلقائي.
            يمكنك إضافة معاملات قديمة يدويًا من الدفاتر الورقية أدناه إن وُجدت.
          </p>
        </section>

        <HistoricalTransactions
          entityType="supplier"
          entityId={id}
          supplierType={type}
          historical={historical}
          onChanged={reloadHistorical}
          directionHint="له = مستحق للمورد (نحن مدينون له). عليه = يقلّل المستحق له (مثال: تم الدفع)."
        />

        <PrintFooter signatures={['مدير المصنع', 'مسؤول التوريد', 'التوقيع', 'التاريخ']} />
      </article>
    </>
  );
}
