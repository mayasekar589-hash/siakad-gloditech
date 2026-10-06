import { clearDemoSession, getDemoSession, setDemoSession, type DemoSession } from "../../lib/auth/demo-auth";

export interface LoginCredentials {
  username: string;
  password: string;
}

export type { DemoSession, DemoUser } from "../../lib/auth/demo-auth";

export type AuthServiceErrorCode = "INVALID_CREDENTIALS" | "STORAGE_UNAVAILABLE";

const demoUsername = "202501001";
const demoPassword = "Taruna@123";

export class AuthServiceError extends Error {
  constructor(public readonly code: AuthServiceErrorCode) {
    super(code === "INVALID_CREDENTIALS" ? "NIM atau password tidak sesuai." : "Sesi demo tidak dapat disimpan di browser ini.");
    this.name = "AuthServiceError";
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<DemoSession> {
    // DEMO AUTH ONLY
    // Replace with real authentication API before production.
    if (credentials.username !== demoUsername || credentials.password !== demoPassword) {
      throw new AuthServiceError("INVALID_CREDENTIALS");
    }

    try {
      setDemoSession();
      const session = getDemoSession();
      if (!session) {
        throw new AuthServiceError("STORAGE_UNAVAILABLE");
      }
      return session;
    } catch {
      throw new AuthServiceError("STORAGE_UNAVAILABLE");
    }
  },

  getSession(): DemoSession | null {
    return getDemoSession();
  },

  logout(): void {
    clearDemoSession();
  }
};