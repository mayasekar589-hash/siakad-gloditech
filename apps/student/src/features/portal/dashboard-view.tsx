import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Check, ChevronRight, GraduationCap, Info, MapPin, UserRound } from "lucide-react";
import { attendanceSummary } from "../demo/data/attendance";
import { demoCourses } from "../demo/data/courses";
import { dashboardSummary } from "../demo/data/dashboard-summary";
import { demoStudent } from "../demo/data/student";

export function DashboardView() {
  const todayCourses = demoCourses.filter((course) => course.day === "Senin");

  return (
    <div className="portal-page dashboard-page">
      <header className="dashboard-hero">
        <Image className="dashboard-hero-image" src="/assets/taruna-kapal.jpg" alt="Taruna Poltektrans berlatih di kapal" fill priority sizes="(max-width: 820px) 100vw, 76vw" />
        <div className="dashboard-hero-wash" aria-hidden="true" />
        <div className="dashboard-hero-copy">
          <p className="portal-eyebrow">{dashboardSummary.academicYear}</p>
          <h1>Selamat datang, {demoStudent.name.split(" ")[1]}.</h1>
          <p className="dashboard-hero-description">Terus melangkah, wujudkan masa depan di sektor transportasi Indonesia.</p>
          <div className="dashboard-status" aria-label="Status akademik">
            <span><i />{demoStudent.status === "ACTIVE" ? "Taruna Aktif" : "Status Taruna"}</span><span><BookOpen size={14} />Semester {demoStudent.semester}</span><span><GraduationCap size={14} />{demoStudent.programStudy}</span>
          </div>
        </div>
        <blockquote className="dashboard-quote">“{dashboardSummary.quote}”<cite>{dashboardSummary.quoteAttribution}</cite></blockquote>
      </header>

      <section className="dashboard-performance" aria-labelledby="performance-heading">
        <div className="dashboard-performance-title"><span className="dashboard-performance-icon"><BarChart3 size={20} /></span><div><p className="portal-eyebrow">Ringkasan semester</p><h2 id="performance-heading">Performa Akademik</h2></div></div>
        {dashboardSummary.performance.map((metric) => <div className="dashboard-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.description}</small></div>)}
        <div className="dashboard-performance-seal" aria-hidden="true"><GraduationCap size={31} /></div>
      </section>

      <div className="dashboard-primary-grid">
        <section className="dashboard-section dashboard-schedule" aria-labelledby="schedule-heading">
          <div className="dashboard-section-heading"><div><p className="portal-eyebrow">{demoStudent.className}</p><h2 id="schedule-heading">Jadwal Hari Ini</h2><p className="dashboard-section-subtitle">{dashboardSummary.scheduleDate}</p></div><Link href="/jadwal" className="portal-text-link">Lihat Jadwal Lengkap<ArrowRight size={15} /></Link></div>
          <div className="dashboard-class-list">
            {todayCourses.slice(0, 3).map((course, index) => <article className={`dashboard-class-row${index === 0 ? " first-class" : ""}`} key={course.code}>
              <div className="dashboard-class-time"><strong>{course.startTime}</strong><span>{course.endTime}</span></div>
              <span className="dashboard-class-marker" aria-hidden="true" />
              <div className="dashboard-class-details"><h3>{course.name}</h3><p><span><MapPin size={12} />{course.room}</span><span><UserRound size={12} />{course.lecturer}</span></p></div>
              {index === 0 ? <span className="dashboard-class-status"><i />Kelas pertama</span> : null}
              <ChevronRight className="dashboard-class-arrow" size={16} aria-hidden="true" />
            </article>)}
          </div>
        </section>

        <section className="dashboard-section dashboard-attendance" aria-labelledby="attendance-heading">
          <div className="dashboard-section-heading"><div><p className="portal-eyebrow">Semester {demoStudent.semester}</p><h2 id="attendance-heading">Presensi Semester {demoStudent.semester}</h2></div><Link href="/presensi" className="portal-text-link" aria-label="Lihat presensi">Lihat Presensi<ArrowRight size={15} /></Link></div>
          <div className="dashboard-attendance-body">
            <div className="dashboard-donut" role="img" aria-label="Kehadiran 92 persen"><div><strong>92%</strong><span>Kehadiran</span></div></div>
            <div className="dashboard-attendance-legend">{attendanceSummary.map((item) => <div key={item.label}><span className={`attendance-dot ${item.label.toLowerCase()}`} />{item.label}<strong>{item.percent}%</strong></div>)}</div>
          </div>
          <div className="dashboard-attendance-note"><Info size={17} /><p><strong>Kehadiran Anda berada dalam kondisi baik.</strong><span>Pertahankan konsistensi kehadiran untuk hasil akademik yang optimal.</span></p></div>
        </section>
      </div>

      <section className="dashboard-journey" aria-labelledby="journey-heading">
        <div className="dashboard-section-heading"><div><p className="portal-eyebrow">Rekam studi</p><h2 id="journey-heading">Perjalanan Akademik</h2></div><Link href="/nilai" className="portal-text-link">Lihat Riwayat Lengkap<ArrowRight size={15} /></Link></div>
        <ol className="dashboard-journey-list">{dashboardSummary.journey.map((semester) => <li className={semester.current ? "is-current" : ""} key={semester.term}>
          <span className="dashboard-journey-mark">{semester.current ? <GraduationCap size={14} /> : <Check size={14} />}</span>
          <div><span>{semester.term}</span><strong>{semester.gpa}</strong><small>{semester.credits}</small></div>
        </li>)}</ol>
        <div className="dashboard-journey-track" aria-hidden="true">{dashboardSummary.journey.map((semester) => <span className={semester.current ? "is-current" : ""} key={semester.term}><i /></span>)}</div>
      </section>
    </div>
  );
}