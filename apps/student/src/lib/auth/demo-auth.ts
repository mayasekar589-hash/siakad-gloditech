export type DemoUser = {
  nim: string;
  name: string;
  programStudy: string;
  semester: number;
  className: string;
  status: "ACTIVE";
};

export type DemoSession = {
  authenticated: boolean;
  user: DemoUser;
};

const DEMO_SESSION_KEY = "siakad_demo_session";

export const demoUser: DemoUser = {
  nim: "202501001",
  name: "Muhammad Rizky Pratama",
  programStudy: "D-III Studi Nautika",
  semester: 4,
  className: "Nautika 4A",
  status: "ACTIVE"
};

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!rawSession) {
      return null;
    }

    const parsed = JSON.parse(rawSession) as Partial<DemoSession>;
    if (!parsed.authenticated || !parsed.user) {
      return null;
    }

    const user = parsed.user as Partial<DemoUser>;
    if (
      user.nim !== demoUser.nim ||
      user.name !== demoUser.name ||
      user.programStudy !== demoUser.programStudy ||
      user.semester !== demoUser.semester ||
      user.className !== demoUser.className ||
      user.status !== demoUser.status
    ) {
      return null;
    }

    return {
      authenticated: true,
      user: {
        nim: user.nim as string,
        name: user.name as string,
        programStudy: user.programStudy as string,
        semester: user.semester as number,
        className: user.className as string,
        status: user.status as "ACTIVE"
      }
    };
  } catch {
    return null;
  }
}

export function setDemoSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  const session: DemoSession = {
    authenticated: true,
    user: demoUser
  };

  window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

export function clearDemoSession(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getDemoSession() !== null;
}

// DEMO AUTH ONLY
// Replace with real authentication API before production.
