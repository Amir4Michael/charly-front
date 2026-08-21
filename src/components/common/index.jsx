import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Search, X, Inbox, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ————— أزرار ————— */
const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent shadow-2xs',
  secondary: 'bg-card text-foreground hover:bg-secondary border-border/80 shadow-2xs',
  ghost: 'bg-transparent text-foreground hover:bg-secondary border-transparent',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent shadow-2xs',
};

export function Button({ variant = 'primary', className, type = 'button', loading, children, ...props }) {
  return (
    <button
      type={type}
      disabled={loading || props.disabled}
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border px-4 h-11 text-sm font-bold transition-all duration-200 select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none disabled:transform-none',
        variants[variant],
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}

/**
 * زر مشاركة عبر واتساب — يفتح رابط wa.me في تبويب جديد.
 */
export function WhatsAppButton({ href, disabled, className, children = 'واتساب', ...props }) {
  if (!href || disabled) {
    return (
      <span
        title="لا يوجد رقم هاتف صالح"
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/60 px-4 h-11 text-sm font-bold text-muted-foreground/60 opacity-60 cursor-not-allowed select-none',
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
        'inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 h-11 text-sm font-bold text-emerald-600 dark:text-emerald-400 transition-all duration-200 hover:bg-emerald-600 hover:text-white shadow-2xs active:scale-[0.98] select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
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
  'w-full h-11 rounded-xl border border-border/80 bg-card px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export function Field({ label, hint, error, children, className }) {
  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {label && <label className="block text-xs font-semibold text-foreground/90">{label}</label>}
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
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
    <select {...props} className={cn(fieldBase, 'appearance-none cursor-pointer', className)}>
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
        <ul className="absolute z-30 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-border/80 bg-popover/95 p-1 shadow-lg backdrop-blur-md">
          {filtered.map((o) => (
            <li key={o}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-right text-sm font-medium hover:bg-secondary/80 transition-colors"
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
      <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(fieldBase, 'pr-10')}
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
    <nav className="mb-2.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {item.to ? (
            <Link to={item.to} className="hover:text-primary transition-colors font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-semibold">{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronLeft className="h-3.5 w-3.5 opacity-60" />}
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
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionCard({ title, description, children, actions, className }) {
  return (
    <section className={cn('app-card p-4 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-2xs', className)}>
      <div className="mb-4 flex flex-col gap-2 border-b border-border/60 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
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
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs transition-all hover:shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-black text-foreground tracking-tight">
            {value}
            {unit && <span className="mr-1.5 text-xs font-bold text-muted-foreground">{unit}</span>}
          </p>
        </div>
        {Icon && (
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ————— حالات ————— */
export function Badge({ children, tone = 'secondary', className }) {
  const tones = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary text-muted-foreground border-border/80',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    danger: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return (
    <span className={cn('inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold', tones[tone] || tones.secondary, className)}>
      {children}
    </span>
  );
}

export function EmptyState({ title = 'لا توجد بيانات', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center">
      <div className="rounded-2xl bg-muted/60 p-3.5 text-muted-foreground mb-3">
        <Inbox className="h-7 w-7" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'جاري التحميل...' }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-12 text-sm font-semibold text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      {label}
    </div>
  );
}

export function ErrorState({ message = 'حدث خطأ غير متوقع', onRetry }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
      <p className="text-sm font-semibold text-destructive">{message}</p>
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
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-2xs">
      <table className="w-full min-w-[720px] border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
            {columns.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-3.5 py-3 text-right text-xs font-bold text-muted-foreground">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 bg-card">
          {rows.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-muted/30 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className="whitespace-nowrap px-3.5 py-3 text-foreground font-medium">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs p-0 sm:items-center sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl animate-in slide-in-from-bottom-4 duration-200">
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button 
            type="button" 
            onClick={onClose} 
            aria-label="إغلاق" 
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="py-1">{children}</div>
        {footer && <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/60 pt-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title = 'تأكيد', message, onConfirm, onCancel, confirmLabel = 'تأكيد', confirmVariant = 'danger', loading = false }) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onCancel}
      title={title}
      footer={
        <>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading} disabled={loading}>
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            إلغاء
          </Button>
        </>
      }
    >
      <p className="text-sm font-medium text-muted-foreground leading-relaxed">{message}</p>
    </Modal>
  );
}