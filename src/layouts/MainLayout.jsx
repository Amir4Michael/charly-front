import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Factory, Database, PackageSearch, Wallet, FileBarChart2,
  Settings, Menu, X, LogOut, CalendarDays, ClipboardList, ClipboardCheck,
  Layers, Mountain, Truck, Users, Contact, Boxes, ShoppingCart, Receipt,
  Landmark, ShieldCheck, SlidersHorizontal, Users2, PackagePlus, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getSettings } from '@/services/settingsService';

const NAV = [
  { label: 'الرئيسية', to: '/', icon: LayoutDashboard },
  {
    label: 'التشغيل',
    icon: Factory,
    children: [
      { label: 'التقرير اليومي', to: '/operations/daily-reports', icon: ClipboardList },
      { label: 'الجدول الأسبوعي', to: '/operations/weekly-schedule', icon: CalendarDays },
      { label: 'التقرير الأسبوعي', to: '/operations/weekly-report', icon: ClipboardCheck },
    ],
  },
  {
    label: 'البيانات الأساسية',
    icon: Database,
    children: [
      { label: 'الخامات', to: '/materials', icon: Layers },
      { label: 'الكسارات', to: '/quarries', icon: Mountain },
      { label: 'القلابات', to: '/trucks', icon: Truck },
      { label: 'العمال', to: '/workers', icon: Users },
      { label: 'العملاء', to: '/customers', icon: Contact },
      { label: 'أشخاص المصنع', to: '/people', icon: Users2 },
    ],
  },
  {
    label: 'الموردون',
    icon: PackagePlus,
    children: [
      { label: 'موردو الشكاير', to: '/suppliers/shukayer', icon: Package },
      { label: 'موردو البالتات الخشب', to: '/suppliers/woodenPallets', icon: Package },
      { label: 'موردو الجامبو', to: '/suppliers/jumbo', icon: Package },
    ],
  },
  {
    label: 'الإنتاج والمبيعات',
    icon: PackageSearch,
    children: [
      { label: 'الإنتاج والتعبئة', to: '/production', icon: Boxes },
      { label: 'التحميل والمبيعات', to: '/sales', icon: ShoppingCart },
    ],
  },
  {
    label: 'المالية',
    icon: Wallet,
    children: [
      { label: 'المصاريف', to: '/expenses', icon: Receipt },
      { label: 'الحسابات', to: '/accounts', icon: Landmark },
    ],
  },
  { label: 'التقارير', to: '/reports', icon: FileBarChart2 },
  {
    label: 'الإدارة',
    icon: Settings,
    children: [
      { label: 'المستخدمون والصلاحيات', to: '/users', icon: ShieldCheck },
      { label: 'الإعدادات', to: '/settings', icon: SlidersHorizontal },
    ],
  },
];

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
          ك
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">نظام المصنع</p>
          <p className="text-[11px] text-sidebar-foreground">{getSettings().factoryName}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          if (item.children) {
            return (
              <div key={item.label} className="pt-3">
                <p className="px-3 pb-1 text-[11px] font-semibold text-sidebar-foreground/60">{item.label}</p>
                {item.children.map((c) => (
                  <NavLink
                    key={c.to}
                    to={c.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
                      )
                    }
                  >
                    <c.icon className="h-4 w-4" strokeWidth={1.75} />
                    {c.label}
                  </NavLink>
                ))}
              </div>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
                )
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <p className="border-t border-sidebar-border px-5 py-4 text-[11px] text-sidebar-foreground/60">
        نظام إدارة وتشغيل المصنع
      </p>
    </div>
  );
}

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const { signOut, session, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 right-0 z-40 hidden w-64 bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/50"
          />
          <div className="absolute inset-y-0 right-0 w-72 bg-sidebar">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="absolute left-3 top-5 rounded p-1 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pr-64">
        <header
          className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur no-print"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="فتح القائمة"
                className="rounded-md border border-border p-2 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/" className="text-sm font-semibold text-foreground sm:text-base">
                {getSettings().factoryName}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'hidden rounded-full border px-2.5 py-1 text-xs font-medium sm:inline',
                  isAdmin ? 'border-primary/30 bg-accent text-accent-foreground' : 'border-border bg-secondary text-muted-foreground',
                )}
              >
                {session?.user?.name || 'مستخدم'}
              </span>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </button>
            </div>
          </div>
        </header>
        <main
          className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}