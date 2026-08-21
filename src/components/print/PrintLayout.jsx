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
      <div className="print-logo-fallback flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f3a5f] to-[#1d598f] text-base font-black tracking-wider text-white shadow-sm ring-1 ring-[#0f3a5f]/20 print:border print:border-[#0f3a5f] print:bg-none print:text-[#0f3a5f] print:shadow-none">
        CG
      </div>
    );
  }

  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/60 print:shadow-none print:ring-0">
      <img
        src={COMPANY_LOGO}
        alt={COMPANY_NAME}
        className="print-logo h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/**
 * رأس احترافي موحّد لكل مستندات الطباعة (التقرير اليومي، الكسارات، القلابات، العملاء، العمال).
 * title: عنوان المستند (مثال: "التقرير اليومي للتشغيل")
 * meta: مصفوفة أزواج [تسمية، قيمة] تُعرض في شريط بيانات أسفل الرأس (التاريخ، النوع، ...)
 */
export function PrintHeader({ title, subtitle, meta = [] }) {
  return (
    <header className="print-header relative mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/50 to-white p-5 shadow-sm print:border-none print:bg-none print:p-0 print:shadow-none">
      {/* شريط ديكوري أعلى الرأس للمظهر المودرن */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0f3a5f] via-[#1d598f] to-[#0f3a5f] print:hidden" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* قسم بيانات الشركة */}
        <div className="flex items-center gap-3.5">
          <CompanyLogo />
          <div className="space-y-0.5">
            <h1 className="text-xl font-black tracking-tight text-[#0f3a5f]">
              {COMPANY_NAME}
            </h1>
            <p className="text-xs font-semibold text-slate-500 print:text-slate-600">
              {COMPANY_NAME_AR}
            </p>
          </div>
        </div>

        {/* عنوان المستند */}
        <div className="text-right sm:text-left">
          <div className="inline-block rounded-lg bg-[#0f3a5f]/5 px-3 py-1 print:bg-transparent print:p-0">
            <h2 className="text-lg font-bold text-slate-900 print:text-black">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-slate-500 print:text-slate-600">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* شريط البيانات التوضيحية */}
      {meta.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs sm:grid-cols-3 md:grid-cols-4 print:border-y print:border-x-0 print:border-slate-300 print:bg-transparent print:px-0 print:py-2.5">
          {meta.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 overflow-hidden">
              <dt className="shrink-0 font-semibold text-slate-500 print:text-slate-700">
                {k}:
              </dt>
              <dd className="truncate font-bold text-slate-800 print:text-black">
                {v ?? '—'}
              </dd>
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
    <footer className="print-footer mt-12 border-t border-slate-200 pt-6 print:mt-8 print:border-slate-300">
      {/* كروت التوقيعات */}
      <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 print:gap-6">
        {lines.map((label) => (
          <div
            key={label}
            className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/40 p-3 print:border-none print:bg-transparent print:p-0"
          >
            <p className="mb-8 font-semibold text-slate-600 print:mb-10 print:text-slate-800">
              {label}
            </p>
            <div className="relative">
              <p className="border-b-2 border-dashed border-slate-300 print:border-slate-400" />
            </div>
          </div>
        ))}
      </div>

      {/* حقوق وتوثيق المستند */}
      <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-[11px] font-medium text-slate-400 print:mt-6 print:border-slate-200 print:text-[10px] print:text-slate-500">
        <span>{COMPANY_NAME}</span>
        <span>•</span>
        <span>{COMPANY_NAME_AR}</span>
        <span>•</span>
        <span>مستند معتمد صادر من نظام إدارة المصنع</span>
      </div>
    </footer>
  );
}