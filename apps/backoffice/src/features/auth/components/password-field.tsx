"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export function PasswordField({ id, value, onChange, disabled }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="credential-field">
      <label htmlFor={id}>Password</label>
      <div className="credential-control">
        <LockKeyhole size={16} aria-hidden="true" />
        <input
          autoComplete="current-password"
          disabled={disabled}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Masukkan password"
          required
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={visible}
          className="password-toggle"
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}