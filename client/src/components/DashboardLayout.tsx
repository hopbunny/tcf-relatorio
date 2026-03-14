import { useState } from 'react';
import React from 'react';
import { Link, useLocation } from 'wouter';

import {
  LayoutDashboard,
  Map,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const TCF_LOGO_SIDEBAR = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663435785365/YiWkhqhxEM87kEruUGFQaw/tcf-logo-sidebar_96809523.png';
const TCF_LOGO_LIGHT = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663435785365/YiWkhqhxEM87kEruUGFQaw/tcf-logo-transparent_4cbf4810.png';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Relatórios',
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: '/',
  },
  {
    label: 'Otimizador de Rotas',
    icon: <Map className="h-5 w-5" />,
    href: '/rotas',
    badge: 'IA',
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border transition-all duration-300",
        collapsed ? "h-16 justify-center px-3" : "h-16 px-5 gap-3"
      )}>
        {collapsed ? (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
            <img src={TCF_LOGO_SIDEBAR} alt="TCF" className="w-9 h-9 object-contain" />
          </div>
        ) : (
          <img src={TCF_LOGO_SIDEBAR} alt="TCF Telecom" className="h-14 w-auto object-contain" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-2 mb-3">
            Menu
          </p>
        )}
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center rounded-lg transition-all duration-150 group relative",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <span className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                )}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" />
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-r-full" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center rounded-lg transition-all duration-150",
            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
          )}
          title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Sun className="h-4 w-4 flex-shrink-0" />
          )}
          {!collapsed && (
            <span className="text-sm font-medium">
              {theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}
            </span>
          )}
        </button>

        {/* Collapse button (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full hidden lg:flex items-center rounded-lg transition-all duration-150",
            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
          )}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Recolher</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-shrink-0",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-[220px] bg-sidebar border-r border-sidebar-border",
          "lg:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card flex-shrink-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <img src={TCF_LOGO_LIGHT} alt="TCF Telecom" className="h-10 w-auto object-contain" />
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
