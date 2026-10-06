"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Bell, BookOpen, CalendarDays, CalendarRange, ChevronDown, ChevronRight, ClipboardList, FileText, GraduationCap,
  LayoutDashboard, LogOut, Menu, MessageCircle, ReceiptText, Search, UserCheck, UserRound, X
} from "lucide-react";
import { authService } from "../../features/auth/service";
import { demoStudent } from "../../features/demo/data/student";
import { announcements } from "../../features/demo/data/announcements";
import { isAuthenticated } from "../../lib/auth/demo-auth";
import { getUnreadAnnouncementCount, markAnnouncementRead, subscribeToAnnouncementReadState } from "../../features/portal/announcement-read-state";
import { StudentAvatar } from "./student-avatar";

const navGroups = [
  {
    title: "",
    items: [{ label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard }]
  },
  {
    title: "Akademik",
    items: [
      { label: "KRS", href: "/krs", Icon: ClipboardList },
      { label: "Jadwal Kuliah", href: "/jadwal", Icon: CalendarDays },
      {
        label: "Pembelajaran", href: "/pembelajaran", Icon: BookOpen,
        children: [
          { label: "Beranda Pembelajaran", href: "/pembelajaran", Icon: LayoutDashboard },
          { label: "Mata Kuliah", href: "/pembelajaran/mata-kuliah", Icon: BookOpen },
          { label: "Materi", href: "/pembelajaran/materi", Icon: FileText },
          { label: "Tugas", href: "/pembelajaran/tugas", Icon: ClipboardList },
          { label: "Ujian & Quiz", href: "/pembelajaran/ujian", Icon: GraduationCap },
          { label: "Diskusi", href: "/pembelajaran/diskusi", Icon: MessageCircle },
          { label: "Kalender Pembelajaran", href: "/pembelajaran/kalender", Icon: CalendarDays }
        ]
      },
      { label: "Nilai & KHS", href: "/nilai", Icon: GraduationCap },
      { label: "Presensi", href: "/presensi", Icon: UserCheck },
      { label: "Kalender Akademik", href: "/kalender", Icon: CalendarRange }
    ]
  },
  {
    title: "Administrasi",
    items: [
      { label: "Tagihan", href: "/tagihan", Icon: ReceiptText },
      { label: "Dokumen Akademik", href: "/dokumen", Icon: FileText }
    ]
  },
  {
    title: "Informasi",
    items: [
      { label: "Pengumuman", href: "/pengumuman", Icon: Bell }
    ]
  },
  {
    title: "Akun",
    items: [
      { label: "Profil", href: "/profil", Icon: UserRound }
    ]
  }
];

const mobilePrimaryItems = [
  { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Jadwal", href: "/jadwal", Icon: CalendarDays },
  { label: "Nilai", href: "/nilai", Icon: GraduationCap },
  { label: "Presensi", href: "/presensi", Icon: UserCheck },
  { label: "Profil", href: "/profil", Icon: UserRound }
];

function isActivePath(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function DemoPortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [learningExpanded, setLearningExpanded] = useState(pathname.startsWith("/pembelajaran"));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const allNavItems = navGroups.flatMap((group) => group.items.flatMap((item) => [item, ...(item.children ?? [])]));
  const mobileNavItems = navGroups.flatMap((group) => group.items.flatMap((item) => item.children ?? [item]));
  const currentPage = pathname === "/pembelajaran"
    ? "Beranda Pembelajaran"
    : allNavItems.filter((item) => isActivePath(pathname, item.href)).sort((left, right) => right.href.length - left.href.length)[0]?.label ?? "Dashboard";

  function logout() {
    authService.logout();
    router.replace("/login");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchText.trim();
    router.push(query ? `/pengumuman?q=${encodeURIComponent(query)}` : "/pengumuman");
  }

  useEffect(() => {
    if (pathname.startsWith("/pembelajaran")) setLearningExpanded(true);
  }, [pathname]);

  useEffect(() => {
    const updateUnreadCount = () => setUnreadAnnouncementCount(getUnreadAnnouncementCount());
    updateUnreadCount();
    return subscribeToAnnouncementReadState(updateUnreadCount);
  }, []);

  return (
    <div className={`portal-app${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="portal-sidebar" aria-label="Navigasi SiAkad Taruna">
        <Link className="portal-brand" href="/dashboard" aria-label="SiAkad Taruna, dashboard">
          <span className="portal-brand-emblem-frame"><Image className="portal-brand-emblem" alt="Lambang Poltektrans SDP" src="/assets/logo-poltektrans-emblem.png" width={700} height={750} priority /></span>
          <span className="portal-brand-wordmark"><strong>SiAkad Taruna</strong><small>POLTEKTRANS SDP</small></span>
        </Link>

        <nav className="portal-side-nav">
          {navGroups.map((group) => (
            <div className="portal-nav-group" key={group.title || "utama"}>
              <p>{group.title || "Utama"}</p>
              {group.items.map(({ label, href, Icon, children }) => children ? <div className={`portal-nav-parent${pathname.startsWith("/pembelajaran") ? " is-open" : ""}`} key={`${group.title}-${label}`}>
                <div className="portal-nav-parent-row"><Link className={`portal-nav-link${pathname.startsWith("/pembelajaran") ? " is-active" : ""}`} href={href}><Icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></Link><button className="portal-nav-expand" type="button" aria-label={learningExpanded ? "Tutup submenu Pembelajaran" : "Buka submenu Pembelajaran"} aria-expanded={learningExpanded} onClick={() => setLearningExpanded((expanded) => !expanded)}><ChevronRight size={15} /></button></div>
                {learningExpanded ? <div className="portal-nav-children">{children.map(({ label: childLabel, href: childHref, Icon: ChildIcon }) => <Link className={`portal-nav-child${pathname === childHref || (childHref !== "/pembelajaran" && pathname.startsWith(`${childHref}/`)) ? " is-active" : ""}`} href={childHref} key={childHref}><ChildIcon size={15} strokeWidth={1.8} /><span>{childLabel}</span></Link>)}</div> : null}
              </div> : <Link aria-label={label === "Pengumuman" && unreadAnnouncementCount > 0 ? `${label}, ${unreadAnnouncementCount} belum dibaca` : undefined} className={`portal-nav-link${isActivePath(pathname, href) ? " is-active" : ""}`} href={href} key={`${group.title}-${label}`}>
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>{label === "Pengumuman" && unreadAnnouncementCount > 0 ? <span aria-label={`${unreadAnnouncementCount} belum dibaca`} className="portal-nav-unread-count">{unreadAnnouncementCount}</span> : null}
              </Link>)}
            </div>
          ))}
        </nav>

        <button className="portal-nav-link portal-logout" type="button" onClick={logout}>
          <LogOut size={18} strokeWidth={1.8} aria-hidden="true" /><span>Logout</span>
        </button>
      </aside>

      <div className="portal-main-column">
        <header className="portal-topbar">
          <button className="portal-desktop-menu-toggle" type="button" aria-label={sidebarCollapsed ? "Tampilkan navigasi" : "Ciutkan navigasi"} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}><Menu size={20} /></button>
          <div className="portal-mobile-brand"><button type="button" aria-label="Buka menu" onClick={() => setMoreOpen((open) => !open)}><Menu size={21} /></button><strong>SiAkad Taruna</strong></div>
          <div className="portal-breadcrumb"><span>SiAkad Taruna</span><i>/</i><strong>{currentPage}</strong></div>
          <form className="portal-search" role="search" onSubmit={submitSearch}>
            <Search size={17} aria-hidden="true" />
            <input aria-label="Cari mata kuliah, jadwal, informasi, atau menu lainnya" placeholder="Cari mata kuliah, jadwal, informasi, atau menu lainnya..." value={searchText} onChange={(event) => setSearchText(event.target.value)} />
          </form>
          <div className="portal-topbar-actions">
            <details className="portal-notification-menu">
              <summary aria-label={`Notifikasi, ${unreadAnnouncementCount} pengumuman belum dibaca`}><Bell size={19} aria-hidden="true" />{unreadAnnouncementCount > 0 ? <span>{unreadAnnouncementCount > 9 ? "9+" : unreadAnnouncementCount}</span> : null}</summary>
              <div className="portal-popover portal-notifications">
                <strong>Notifikasi</strong>
                {announcements.slice(0, 3).map((announcement) => <Link href={`/pengumuman/${announcement.slug}`} key={announcement.slug} onClick={() => markAnnouncementRead(announcement.slug)}>{announcement.title}<small>{announcement.date}</small></Link>)}
                <Link className="portal-popover-all" href="/pengumuman">Lihat semua pengumuman</Link>
              </div>
            </details>
            <details className="portal-profile-menu">
              <summary><StudentAvatar compact name={demoStudent.name} /><span className="portal-profile-identity"><span className="portal-topbar-name">{demoStudent.name}</span><small>{demoStudent.nim} · {demoStudent.className}</small></span><ChevronDown size={15} aria-hidden="true" /></summary>
              <div className="portal-popover portal-profile-popover">
                <Link href="/profil">Profil Saya</Link>
                <button type="button" onClick={logout}><LogOut size={15} />Keluar</button>
              </div>
            </details>
          </div>
        </header>

        {moreOpen ? <div className="portal-mobile-drawer"><button className="portal-mobile-drawer-close" type="button" onClick={() => setMoreOpen(false)} aria-label="Tutup menu"><X size={18} /></button>{mobileNavItems.map(({ label, href, Icon }) => <Link href={href} key={href} onClick={() => setMoreOpen(false)}><Icon size={17} />{label}</Link>)}<button type="button" onClick={logout}><LogOut size={17} />Logout</button></div> : null}

        <main className="portal-content">{children}</main>

        <nav className="portal-bottom-nav" aria-label="Navigasi cepat">
          {mobilePrimaryItems.map(({ label, href, Icon }) => <Link className={isActivePath(pathname, href) ? "is-active" : ""} href={href} key={href}><Icon size={19} /><small>{label}</small></Link>)}
          <button type="button" onClick={() => setMoreOpen((open) => !open)}><Menu size={19} /><small>Menu</small></button>
        </nav>
      </div>
    </div>
  );
}

export function ProtectedPortal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return <main className="portal-auth-loading" aria-label="Memeriksa sesi demo"><span className="student-login-spinner" /></main>;
  return <DemoPortalShell>{children}</DemoPortalShell>;
}