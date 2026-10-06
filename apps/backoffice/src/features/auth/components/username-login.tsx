"use client";

import { ArrowRight, LoaderCircle, UserRound } from "lucide-react";
import { useState } from "react";
import { PasswordField } from "./password-field";

interface UsernameLoginProps {
  busy: boolean;
  onSubmit: (username: string, password: string, rememberMe: boolean) => void;
  onRecovery: () => void;
}

export function UsernameLogin({ busy, onSubmit, onRecovery }: UsernameLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(username.trim(), password, rememberMe);
  }

  return (
    <form className="credential-form" noValidate onSubmit={handleSubmit}>
      <div className="credential-field">
        <label htmlFor="institution-username">Username</label>
        <div className="credential-control">
          <UserRound size={16} aria-hidden="true" />
          <input
            autoComplete="username"
            disabled={busy}
            id="institution-username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Masukkan username Anda"
            required
            type="text"
            value={username}
          />
        </div>
      </div>
      <PasswordField disabled={busy} id="username-password" onChange={setPassword} value={password} />
      <div className="login-form-options">
        <label className="remember-option">
          <input checked={rememberMe} disabled={busy} onChange={(event) => setRememberMe(event.target.checked)} type="checkbox" />
          Ingat saya
        </label>
        <button className="recovery-link" disabled={busy} onClick={onRecovery} type="button">Lupa password?</button>
      </div>
      <button className="login-primary-button" disabled={busy} type="submit">
        {busy ? "Memproses..." : "Masuk"}
        {busy ? <LoaderCircle className="login-spinner" size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
      </button>
    </form>
  );
}
