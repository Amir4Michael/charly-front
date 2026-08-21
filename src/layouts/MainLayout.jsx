import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Factory, Database, PackageSearch, Wallet, FileBarChart2,
  Settings, Menu, X, LogOut, CalendarDays, ClipboardList, ClipboardCheck,
  Layers, Mountain, Truck, Users, Contact, Boxes, ShoppingCart, Receipt,
  Landmark, ShieldCheck, SlidersHorizontal, Users2, PackagePlus, Package,
  UserCheck, Factory as FactoryIcon
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
    <div className="flex h-full flex-col select-none">
      {/* Header Info */}
      <div className="flex items-center gap-3 border-b border-sidebar-border/60 px-5 py-5 bg-sidebar-accent/10">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground font-black shadow-sm text-lg">
          ك
        </div>
        <div className="leading-tight overflow-hidden">
          <p className="text-sm font-bold text-white tracking-wide truncate">نظام المصنع</p>
          <p className="text-[11px] font-medium text-sidebar-foreground/70 truncate mt-0.5">{getSettings().factoryName}</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-sidebar-border">
        {NAV.map((item) => {
          const Icon = item.icon;
          if (item.children) {
            return (
              <div key={item.label} className="pt-3.5 first:pt-0">
                <p className="px-3 pb-1.5 text-[11px] font-bold tracking-wider text-sidebar-foreground/50 uppercase">
                  {item.label}
                </p>
                <div className="space-y-0.5">
                  {item.children.map((c) => (
                    <NavLink
                      key={c.to}
                      to={c.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold translate-x-0.5'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-white'
                        )
                      }
                    >
                      <c.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span className="truncate">{c.label}</span>
                    </NavLink>
                  ))}
                </div>
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
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-bold translate-x-0.5'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-white'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="border-t border-sidebar-border/60 px-5 py-4 bg-sidebar-accent/5">
        <p className="text-[11px] font-medium text-sidebar-foreground/50 text-center">
          نظام إدارة وتشغيل المصنع
        </p>
      </div>
    </div>
  );
}

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const { signOut, session, isAdmin } = useAuth();
  const navigate = useNavigate();

  const userName = session?.user?.name || 'مستخدم';
  const firstLetter = userName.charAt(0);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="no-print fixed inset-y-0 right-0 z-40 hidden w-64 border-l border-sidebar-border/40 bg-sidebar lg:block shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay & Sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />
          <div className="absolute inset-y-0 right-0 w-72 bg-sidebar shadow-2xl animate-in slide-in-from-right duration-200">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="absolute left-3 top-4 rounded-xl p-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pr-64 transition-all duration-300">
        <header
          className="sticky top-0 z-30 border-b border-border/80 bg-card/85 backdrop-blur-md no-print shadow-2xs"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="فتح القائمة"
                className="rounded-xl border border-border/80 bg-card p-2.5 text-foreground hover:bg-secondary transition-colors lg:hidden active:scale-95"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/" className="flex items-center gap-2 group">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black lg:hidden">
                  <FactoryIcon className="h-4 w-4" />
                </div>
                <span className="text-sm font-black text-foreground sm:text-base group-hover:text-primary transition-colors">
                  {getSettings().factoryName}
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2.5">
              {/* User Avatar Badge */}
              <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/50 p-1.5 pl-3">
                <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {firstLetter}
                </div>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-foreground leading-tight">{userName}</span>
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                    {isAdmin ? 'مدير النظام' : 'مستخدم'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 h-10 text-xs font-bold text-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-200 active:scale-95"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </header>

        <main
          className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}