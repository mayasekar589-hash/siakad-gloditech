"use client";

import {
  Bell, ChevronDown, ChevronUp, CircleHelp, LogOut, Menu, PanelLeftClose, PanelLeftOpen,
  Search, ShieldCheck, X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { BackOfficeSession } from "../../auth/auth-provider";
import { adminNavigation, type NavigationItem } from "../config/navigation";

interface DashboardShellProps {
  session: BackOfficeSession;
  onLogout: () => void;
  children: React.ReactNode;
}

function routeMatches(href: string | undefined, activePath: string) {
  return Boolean(href && (href === activePath || (href !== "/dashboard" && activePath.startsWith(`${href}/`))));
}

function itemContainsActiveRoute(item: NavigationItem, activePath: string): boolean {
  return routeMatches(item.href, activePath) || Boolean(item.children?.some((child) => itemContainsActiveRoute(child, activePath)));
}

function NavigationLink({
  item,
  activePath,
  collapsed,
  openGroups,
  onToggleGroup,
  onNavigate,
  depth = 0
}: {
  item: NavigationItem;
  activePath: string;
  collapsed: boolean;
  openGroups: Set<string>;
  onToggleGroup: (id: string) => void;
  onNavigate: () => void;
  depth?: number;
}) {
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);
  const isOpen = openGroups.has(item.id);
  const isActive = routeMatches(item.href, activePath);
  const hasActiveChild = Boolean(item.children?.some((child) => itemContainsActiveRoute(child, activePath)));
  const childListId = `admin-nav-children-${item.id}`;

  if (hasChildren && !item.href) {
    return <div className={`admin-nav-group${isOpen ? " is-open" : ""}${depth ? " is-nested" : ""}`}>
      <button aria-controls={childListId} aria-expanded={isOpen} className={`admin-nav-group-toggle${isOpen ? " is-open" : ""}${hasActiveChild ? " has-active-child" : ""}`} onClick={() => onToggleGroup(item.id)} title={collapsed ? item.label : undefined} type="button">
        <Icon size={15} aria-hidden="true" /><span>{item.label}</span>{collapsed ? null : isOpen ? <ChevronUp className="admin-nav-chevron" size={13} aria-hidden="true" /> : <ChevronDown className="admin-nav-chevron" size={13} aria-hidden="true" />}
      </button>
      <div aria-hidden={!isOpen} className={`admin-nav-children${isOpen ? " is-open" : ""}`} id={childListId} inert={!isOpen}>
        <div className="admin-nav-children-inner">{item.children?.map((child) => <NavigationLink activePath={activePath} collapsed={collapsed} depth={depth + 1} item={child} key={child.id} onNavigate={onNavigate} onToggleGroup={onToggleGroup} openGroups={openGroups} />)}</div>
      </div>
    </div>;
  }

  if (item.href) {
    return <Link aria-current={isActive ? "page" : undefined} className={`admin-nav-link${depth ? " is-child-link" : ""}${isActive ? " is-active" : ""}`} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined}>
      <Icon size={depth ? 14 : 15} aria-hidden="true" /><span>{item.label}</span>
    </Link>;
  }
  return <button aria-disabled="true" className={`admin-nav-link${depth ? " is-child-link" : ""}`} title={collapsed ? item.label : undefined} type="button">
    <Icon size={depth ? 14 : 15} aria-hidden="true" /><span>{item.label}</span>
  </button>;
}

function Sidebar({
  collapsed,
  mobileOpen,
  activePath,
  onCloseMobile,
  onToggleCollapse
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  activePath: string;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(
    adminNavigation.flatMap((section) => section.items.length > 1 && section.items.some((item) => itemContainsActiveRoute(item, activePath)) ? [section.id] : [])
  ));

  useEffect(() => {
    const activeGroups = adminNavigation.filter((section) => section.items.length > 1 && section.items.some((item) => itemContainsActiveRoute(item, activePath))).map((section) => section.id);
    if (!activeGroups.length) return;
    setOpenGroups((current) => {
      const next = new Set(current);
      activeGroups.forEach((id) => next.add(id));
      return next;
    });
  }, [activePath]);

  function toggleGroup(id: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return <>
    {mobileOpen ? <button aria-label="Tutup navigasi" className="sidebar-backdrop" onClick={onCloseMobile} type="button" /> : null}
    <aside aria-label="Navigasi utama" className={`admin-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}>
      <div className="admin-brand-lockup">
        <a className="admin-brand-link" href="/dashboard">
          <span className="admin-brand-mark"><Image alt="Lambang resmi Poltektrans SDP Palembang" height={43} src="/assets/logo-poltektrans.png" width={153} /></span>
          {!collapsed ? <span className="admin-brand-copy"><strong>SiAkad</strong><b>Back Office</b></span> : null}
        </a>
        <button aria-label="Tutup menu" className="sidebar-mobile-close" onClick={onCloseMobile} type="button"><X size={18} /></button>
      </div>
      {!collapsed ? <div className="admin-role-card"><span><ShieldCheck size={16} aria-hidden="true" /></span><div><strong>SUPER ADMIN</strong><small>Akses Penuh Sistem</small></div></div> : <div className="admin-role-collapsed" title="SUPER ADMIN"><ShieldCheck size={17} /></div>}
      <nav className="admin-navigation">
        {adminNavigation.map((section) => <section aria-label={section.label} className="admin-nav-section" key={section.id}>
          {section.items.length > 1 ? <>
            <button aria-controls={`admin-nav-section-${section.id}`} aria-expanded={openGroups.has(section.id)} className={`admin-nav-group-toggle admin-nav-section-toggle${openGroups.has(section.id) ? " is-open" : ""}${section.items.some((item) => itemContainsActiveRoute(item, activePath)) ? " has-active-child" : ""}`} onClick={() => toggleGroup(section.id)} title={collapsed ? section.label : undefined} type="button">
              {section.icon ? <section.icon size={15} aria-hidden="true" /> : null}{!collapsed ? <span>{section.label}</span> : null}{!collapsed ? openGroups.has(section.id) ? <ChevronUp className="admin-nav-chevron" size={13} aria-hidden="true" /> : <ChevronDown className="admin-nav-chevron" size={13} aria-hidden="true" /> : null}
            </button>
            <div aria-hidden={!openGroups.has(section.id)} className={`admin-nav-children admin-nav-section-children${openGroups.has(section.id) ? " is-open" : ""}`} id={`admin-nav-section-${section.id}`} inert={!openGroups.has(section.id)}>
              <div className="admin-nav-children-inner">{section.items.map((item) => <NavigationLink activePath={activePath} collapsed={collapsed} item={item} key={item.id} onNavigate={onCloseMobile} onToggleGroup={toggleGroup} openGroups={openGroups} />)}</div>
            </div>
          </> : <>
            {!collapsed ? <h2>{section.label}</h2> : null}
            {section.items.map((item) => <NavigationLink activePath={activePath} collapsed={collapsed} item={item} key={item.id} onNavigate={onCloseMobile} onToggleGroup={toggleGroup} openGroups={openGroups} />)}
          </>}
        </section>)}
      </nav>
      {!collapsed ? <p className="admin-sidebar-motto">DISIPLIN · PROFESIONAL · BERINTEGRITAS</p> : null}
      <button aria-label={collapsed ? "Perlebar sidebar" : "Ciutkan sidebar"} className="sidebar-collapse-button" onClick={onToggleCollapse} type="button">
        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>
    </aside>
  </>;
}

function Topbar({
  session,
  onOpenMobile,
  onLogout
}: {
  session: BackOfficeSession;
  onOpenMobile: () => void;
  onLogout: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  return <header className="admin-topbar">
    <button aria-label="Buka menu" className="topbar-menu-button" onClick={onOpenMobile} type="button"><Menu size={19} /></button>
    <div className="topbar-search">
      <Search size={15} aria-hidden="true" />
      <input aria-label="Cari mahasiswa, dosen, mata kuliah, kelas, atau informasi lainnya" placeholder="Cari mahasiswa, dosen, mata kuliah, kelas, atau informasi lainnya..." />
      <kbd>Ctrl</kbd><kbd>K</kbd>
    </div>
    <div className="topbar-spacer" />
    <button aria-label="Notifikasi, 12 belum dibaca" className="topbar-icon-button notification-trigger" type="button"><Bell size={17} /><span>12</span></button>
    <button aria-label="Bantuan" className="topbar-icon-button help-trigger" type="button"><CircleHelp size={17} /></button>
    <div className="topbar-profile-wrap">
      <button aria-expanded={profileOpen} className="topbar-profile" onClick={() => setProfileOpen(!profileOpen)} type="button">
        <span className="topbar-avatar">{session.user.name.slice(0, 1).toUpperCase()}</span>
        <span className="topbar-profile-copy"><strong>{session.user.name}</strong><small>{session.user.role}</small></span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {profileOpen ? <div className="topbar-profile-menu"><span>{session.user.username} · Mode Demo</span><button onClick={onLogout} type="button"><LogOut size={14} /> Keluar</button></div> : null}
    </div>
  </header>;
}

export function DashboardShell({ session, onLogout, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activePath = usePathname();

  return <div className={`admin-shell${collapsed ? " sidebar-collapsed" : ""}`}>
    <Sidebar activePath={activePath} collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onToggleCollapse={() => setCollapsed(!collapsed)} />
    <div className="admin-main-column">
      <Topbar onLogout={onLogout} onOpenMobile={() => setMobileOpen(true)} session={session} />
      <main className="admin-main-content">{children}</main>
    </div>
  </div>;
}
