import { clearBackOfficeSession, getBackOfficeSession, saveBackOfficeSession } from "./session-store";

export type AuthProviderType = "local" | "oidc" | "saml" | "oauth";

export interface BackOfficeUser {
  id: string;
  username: string;
  name: string;
  role: string;
  permissions?: string[];
  email?: string;
  avatar?: string;
}

export interface BackOfficeSession {
  user: BackOfficeUser;
  authenticated: boolean;
  loginMethod: "username";
}

export interface UsernameLoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

export type AuthResult =
  | { status: "success"; session: BackOfficeSession; redirectTo: string }
  | { status: "invalid_credentials" }
  | { status: "error"; message: string };

export interface AuthProvider {
  id: string;
  name: string;
  type: AuthProviderType;
  login(request: UsernameLoginRequest): Promise<AuthResult>;
  logout(): Promise<void>;
  getSession(): Promise<BackOfficeSession | null>;
}

const demoCredentials = {
  username: "admin",
  password: "Admin@123"
} as const;

class DemoUsernameProvider implements AuthProvider {
  readonly id = "demo-username";
  readonly name = "Username and password (DEMO)";
  readonly type = "local" as const;

  async login(request: UsernameLoginRequest): Promise<AuthResult> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (request.username.trim().toLowerCase() !== demoCredentials.username || request.password !== demoCredentials.password) {
      return { status: "invalid_credentials" };
    }

    const session: BackOfficeSession = {
      user: {
        id: "demo-super-admin",
        username: demoCredentials.username,
        name: "Administrator SiAkad",
        role: "SUPER_ADMIN"
      },
      authenticated: true,
      loginMethod: "username"
    };

    saveBackOfficeSession(session, request.rememberMe);
    return { status: "success", session, redirectTo: "/dashboard" };
  }

  async logout(): Promise<void> {
    clearBackOfficeSession();
  }

  async getSession(): Promise<BackOfficeSession | null> {
    return getBackOfficeSession();
  }
}

export const authProviders = {
  username: new DemoUsernameProvider()
} satisfies Record<"username", AuthProvider>;

export const activeAuthProvider: AuthProvider = authProviders.username;