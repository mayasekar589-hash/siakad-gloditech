"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { activeAuthProvider } from "./auth-provider";
import type { AuthResult } from "./auth-provider";
import { AuthNotice, LoginBranding, LoginCard } from "./components/login-parts";
import { UsernameLogin } from "./components/username-login";

type LoginFeedback =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "success"; message: string }
  | { state: "redirecting"; message: string };

const publicWebsiteUrl = "https://poltektranssdp-palembang.ac.id";

export function LoginPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<LoginFeedback>({ state: "idle" });
  const isSubmitting = useRef(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBusy = feedback.state === "loading" || feedback.state === "success" || feedback.state === "redirecting";

  useEffect(() => {
    let active = true;
    void activeAuthProvider.getSession().then((session) => {
      if (active && session?.authenticated) router.replace("/dashboard");
    });
    return () => {
      active = false;
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [router]);

  async function authenticate(username: string, password: string, rememberMe: boolean) {
    if (isSubmitting.current) return;
    if (!username) {
      setFeedback({ state: "error", message: "Username wajib diisi." });
      return;
    }
    if (!password) {
      setFeedback({ state: "error", message: "Password wajib diisi." });
      return;
    }

    isSubmitting.current = true;
    setFeedback({ state: "loading" });

    try {
      const result: AuthResult = await activeAuthProvider.login({ username, password, rememberMe });
      if (result.status !== "success") {
        setFeedback({ state: "error", message: result.status === "invalid_credentials" ? "Username atau password tidak sesuai." : result.message });
        return;
      }

      setFeedback({ state: "success", message: "Login berhasil. Mengalihkan ke dashboard..." });
      redirectTimer.current = setTimeout(() => {
        setFeedback({ state: "redirecting", message: "Memproses..." });
        router.replace(result.redirectTo);
      }, 300);
    } catch {
      setFeedback({ state: "error", message: "Terjadi kesalahan saat autentikasi. Silakan coba kembali." });
    } finally {
      isSubmitting.current = false;
    }
  }

  const isSuccess = feedback.state === "success" || feedback.state === "redirecting";
  const feedbackIcon = feedback.state === "loading" || feedback.state === "redirecting"
    ? <LoaderCircle className="login-spinner" size={16} aria-hidden="true" />
    : isSuccess
      ? <CheckCircle2 size={16} aria-hidden="true" />
      : <AlertCircle size={16} aria-hidden="true" />;

  function handleRecovery() {
    setFeedback({ state: "error", message: "Pemulihan password belum tersedia untuk akun demo ini." });
  }

  return (
    <main className="login-layout">
      <LoginBranding />
      <section aria-label="Masuk ke SiAkad Back Office" className="login-right-panel">
        <Link className="login-site-link" href={publicWebsiteUrl}>
          <ArrowLeft size={15} aria-hidden="true" /> Kembali ke Website
        </Link>
        <LoginCard>
          <span className="login-badge">SIAKAD BACK OFFICE · DEMO</span>
          <h2>Selamat datang kembali.</h2>
          <p className="login-card-intro">Masuk dengan akun administrator demo untuk mengelola layanan akademik SiAkad Back Office Poltektrans SDP Palembang.</p>
          <div className="login-demo-hint" aria-label="Kredensial akun demo">
            <strong>Akun Demo</strong>
            <span>Username: <b>admin</b></span>
            <span>Password: <b>Admin@123</b></span>
          </div>
          <UsernameLogin busy={isBusy} onRecovery={handleRecovery} onSubmit={(username, password, rememberMe) => void authenticate(username, password, rememberMe)} />
          {feedback.state !== "idle" ? (
            <p aria-live="polite" className="login-feedback" data-tone={feedback.state === "error" ? "error" : isSuccess ? "success" : "info"} role={feedback.state === "error" ? "alert" : "status"}>
              {feedbackIcon}
              <span>{feedback.state === "loading" ? "Memproses..." : feedback.message}</span>
            </p>
          ) : null}
          <AuthNotice />
        </LoginCard>
      </section>
    </main>
  );
}
