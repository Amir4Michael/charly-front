import React, { useState } from 'react';
import { COMPANY_NAME, COMPANY_NAME_AR, COMPANY_LOGO } from '@/config/branding';

/**
 * لوجو الشركة في رأس ورقة الطباعة — يعتمد على المسار الموجود في config/branding.js.
 * لو الصورة غير موجودة (404) أو لم تُضَف بعد، يظهر بديل نصي أنيق بدل أن تنكسر الصفحة.
 */
function CompanyLogo() {
  const [failed, setFailed] = useState(false);

  if (failed || !COMPANY_LOGO) {
    return (
      <div className="print-logo-fallback flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-[#0f3a5f] text-sm font-bold text-[#0f3a5f]">
        CG
      </div>
    );
  }

  return (
    <img
      src={COMPANY_LOGO}
      alt={COMPANY_NAME}
      className="print-logo h-14 w-14 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * رأس احترافي موحّد لكل مستندات الطباعة (التقرير اليومي، الكسارات، القلابات، العملاء، العمال).
 * title: عنوان المستند (مثال: "التقرير اليومي للتشغيل")
 * meta: مصفوفة أزواج [تسمية، قيمة] تُعرض في شريط بيانات أسفل الرأس (التاريخ، النوع، ...)
 */
export function PrintHeader({ title, subtitle, meta = [] }) {
  return (
    <header className="print-header mb-6 border-b-2 border-[#0f3a5f] pb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CompanyLogo />
          <div>
            <p className="text-lg font-bold leading-tight text-[#0f3a5f]">{COMPANY_NAME}</p>
            <p className="text-xs leading-tight text-muted-foreground">{COMPANY_NAME_AR}</p>
          </div>
        </div>
        <div className="text-left">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {meta.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-border pt-3 text-xs sm:grid-cols-3">
          {meta.map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <dt className="text-muted-foreground">{k}:</dt>
              <dd className="font-medium text-foreground">{v ?? '—'}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

/**
 * تذييل احترافي موحّد يحتوي مساحات توقيع جاهزة للاستخدام الفعلي في المصنع.
 * signatures: مصفوفة تسميات مخصّصة، وإلا تُستخدم القيم الافتراضية.
 */
export function PrintFooter({ signatures }) {
  const lines = signatures?.length
    ? signatures
    : ['أُعِدَّ بواسطة (Prepared By)', 'روجع بواسطة (Reviewed By)', 'التوقيع (Signature)', 'التاريخ (Date)'];

  return (
    <footer className="print-footer mt-10 border-t border-border pt-5">
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-xs text-muted-foreground sm:grid-cols-4">
        {lines.map((label) => (
          <div key={label}>
            <p className="mb-6">{label}:</p>
            <p className="border-t border-dashed border-border" />
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        {COMPANY_NAME} — {COMPANY_NAME_AR} — مستند تم إنشاؤه بواسطة نظام إدارة المصنع
      </p>
    </footer>
  );
}