"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Eye, EyeOff, FileText, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { AuthServiceError, authService } from "../../features/auth/service";
import { isAuthenticated } from "../../lib/auth/demo-auth";

const institutionalWebsite = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "http://localhost:3002";

export default function StudentLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
      return;
    }

    setReady(true);
  }, [router]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage("NIM wajib diisi.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Password wajib diisi.");
      return;
    }

    setSubmitting(true);

    try {
      await authService.login({ username: trimmedUsername, password });
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof AuthServiceError ? error.message : "NIM atau password tidak sesuai.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return null;
  }

  return (
    <main className="student-login-page">
      <section className="student-login-hero" aria-labelledby="student-brand-title">
        <Image className="student-login-photo" src="/assets/taruna-kapal.jpg" alt="Taruna Poltektrans menjalani praktik di kapal latihan." fill priority sizes="(max-width: 760px) 100vw, 55vw" />
        <div className="student-login-scrim" aria-hidden="true" />
        <div className="student-login-hero-inner">
          <a className="student-institution-brand" href={institutionalWebsite} aria-label="Politeknik Transportasi Sungai, Danau dan Penyeberangan Palembang, kembali ke website institusi">
            <Image src="/assets/logo-poltektrans.png" alt="Logo Politeknik Transportasi Sungai, Danau dan Penyeberangan Palembang" width={2400} height={750} priority />
          </a>

          <div className="student-login-hero-copy">
            <p className="student-login-kicker">Selamat Datang Di</p>
            <h1 id="student-brand-title">SiAkad Taruna</h1>
            <p className="student-login-subtitle">Sistem Informasi Akademik Taruna<br />Politeknik Transportasi SDP Palembang</p>
            <ul className="student-login-features" aria-label="Fitur portal taruna">
              <li><span><BookOpen size={20} aria-hidden="true" /></span><small>Informasi<br />Akademik</small></li>
              <li><span><FileText size={20} aria-hidden="true" /></span><small>KRS<br />dan Nilai</small></li>
              <li><span><CalendarDays size={20} aria-hidden="true" /></span><small>Jadwal<br />Perkuliahan</small></li>
              <li><span><UserRound size={20} aria-hidden="true" /></span><small>Profil<br />Taruna</small></li>
            </ul>
          </div>

          <p className="student-login-motto">Membentuk Taruna yang Unggul,<br />Profesional, dan Berintegritas<br />untuk Sektor Transportasi Indonesia.</p>
        </div>
      </section>

      <section className="student-login-panel" aria-label="Masuk ke SiAkad Taruna">
        <Link className="student-return-link" href={institutionalWebsite}>
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke Website Institusi
        </Link>

        <div className="student-login-card">
          <Image className="student-login-card-logo" src="/assets/logo-poltektrans.png" alt="Logo Politeknik Transportasi Sungai, Danau dan Penyeberangan Palembang" width={2400} height={750} />
          <h2>SiAkad Taruna</h2>
          <span className="student-login-divider" aria-hidden="true" />
          <p className="student-login-card-description">Login untuk mengakses Sistem Informasi Akademik Taruna Politeknik Transportasi SDP Palembang</p>
          <div className="student-demo-hint"><span>Mode Demo</span><p>Gunakan akun demo untuk mencoba SiAkad Taruna.</p><small>NIM 202501001 · Password Taruna@123</small></div>

          <form className="student-login-form" onSubmit={(event) => void submitLogin(event)}>
            <div className="student-login-field">
              <label htmlFor="student-username">NIM / Username</label>
              <div className="student-login-input-wrap">
                <UserRound size={18} aria-hidden="true" />
                <input id="student-username" name="username" type="text" autoComplete="username" placeholder="Masukkan NIM atau username" value={username} onChange={(event) => setUsername(event.target.value)} required disabled={submitting} />
              </div>
            </div>

            <div className="student-login-field">
              <label htmlFor="student-password">Password</label>
              <div className="student-login-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input id="student-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Masukkan password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={submitting} />
                <button className="student-password-toggle" type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} disabled={submitting}>
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="student-login-forgot-row"><Link href="/forgot-password">Lupa password?</Link></div>

            {errorMessage ? <p className="student-login-error" role="alert">{errorMessage}</p> : null}

            <button className="student-login-submit" type="submit" disabled={submitting}>
              {submitting ? <><span className="student-login-spinner" aria-hidden="true" />Memproses...</> : <>Login<ArrowRight size={18} aria-hidden="true" /></>}
            </button>
          </form>

          <div className="student-login-notice" role="note">
            <ShieldCheck size={22} aria-hidden="true" />
            <p>Gunakan akun taruna yang telah terdaftar.<br />Jika mengalami kendala, silakan hubungi bagian akademik.</p>
          </div>
        </div>
      </section>
    </main>
  );
}