import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Search, X, Inbox, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ————— أزرار ————— */
const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent',
  secondary: 'bg-card text-foreground hover:bg-secondary border-border',
  ghost: 'bg-transparent text-foreground hover:bg-secondary border-transparent',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent',
};

export function Button({ variant = 'primary', className, type = 'button', loading, children, ...props }) {
  return (
    <button
      type={type}
      disabled={loading || props.disabled}
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border px-4 h-11 text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none',
        variants[variant],
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/**
 * زر مشاركة عبر واتساب — يفتح رابط wa.me في تبويب جديد.
 * ملاحظة مهمة: هذا يفتح محادثة واتساب مع رسالة نصية جاهزة فقط، ولا يرسل ملف الطباعة/PDF تلقائيًا
 * (إرفاق الملف نفسه يحتاج Backend لتوليد PDF أو Web Share API من المتصفح).
 */
export function WhatsAppButton({ href, disabled, className, children = 'واتساب', ...props }) {
  if (!href || disabled) {
    return (
      <span
        title="لا يوجد رقم هاتف صالح"
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 h-11 text-sm font-medium text-muted-foreground opacity-60',
          className,
        )}
      >
        <MessageCircle className="h-4 w-4" />
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 h-11 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        className,
      )}
    >
      <MessageCircle className="h-4 w-4" />
      {children}
    </a>
  );
}

/* ————— حقول ————— */
const fieldBase =
  'w-full h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring';

export function Field({ label, hint, error, children, className }) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label className="field-label">{label}</label>}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = React.forwardRef(function TextInput({ className, ...props }, ref) {
  return <input ref={ref} {...props} className={cn(fieldBase, className)} />;
});

export function DateInput({ className, ...props }) {
  return <input type="date" {...props} className={cn(fieldBase, className)} />;
}

export function SelectInput({ options = [], placeholder = 'اختر...', className, ...props }) {
  return (
    <select {...props} className={cn(fieldBase, 'appearance-none', className)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function SearchSelect({ options = [], value, onChange, placeholder = 'ابحث أو اكتب...', className }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => options.filter((o) => o.includes(query.trim())),
    [options, query],
  );
  return (
    <div className={cn('relative', className)}>
      <input
        value={open ? query : value || ''}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={fieldBase}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {filtered.map((o) => (
            <li key={o}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className="w-full rounded px-3 py-2 text-right text-sm hover:bg-secondary"
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'بحث...' }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(fieldBase, 'pr-9')}
      />
    </div>
  );
}

export function FilterBar({ children, className }) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end', className)}>
      {children}
    </div>
  );
}

/* ————— عناوين ————— */
export function Breadcrumb({ items = [] }) {
  return (
    <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1">
          {item.to ? (
            <Link to={item.to} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronLeft className="h-3 w-3" />}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({ title, subtitle, breadcrumb, actions }) {
  return (
    <div className="mb-6">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionCard({ title, description, children, actions, className }) {
  return (
    <section className={cn('app-card p-4 sm:p-6', className)}>
      <div className="mb-4 flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ label, value, unit, icon: Icon }) {
  return (
    <div className="app-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {value}
            {unit && <span className="mr-1 text-xs font-medium text-muted-foreground">{unit}</span>}
          </p>
        </div>
        {Icon && (
          <span className="rounded-md bg-accent p-2 text-accent-foreground">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ————— حالات ————— */
/* ————— حالات ————— */
export function Badge({ children, tone = 'secondary', className }) {
  const tones = {
    primary: 'bg-accent text-accent-foreground border-primary/20',
    secondary: 'bg-secondary text-muted-foreground border-border',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    danger: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', tones[tone] || tones.secondary, className)}>
      {children}
    </span>
  );
}

export function EmptyState({ title = 'لا توجد بيانات', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-12 text-center">
      <Inbox className="mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'جاري التحميل...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message = 'حدث خطأ غير متوقع', onRetry }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

/* ————— جدول ————— */
export function DataTable({ columns = [], rows = [], empty }) {
  if (!rows.length) return empty || <EmptyState />;
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-secondary/70">
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {rows.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-secondary/40">
              {columns.map((c) => (
                <td key={c.key} className="whitespace-nowrap px-3 py-3 text-foreground">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ————— نوافذ ————— */
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-lg border border-border bg-card p-5 shadow-lg sm:rounded-lg">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded p-1 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-5 flex justify-start gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title = 'تأكيد', message, onConfirm, onCancel, confirmLabel = 'تأكيد', confirmVariant = 'danger' }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            إلغاء
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  );
}