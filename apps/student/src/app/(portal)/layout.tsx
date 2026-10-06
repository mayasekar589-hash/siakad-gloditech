import type { ReactNode } from "react";
import { ProtectedPortal } from "../../components/portal/portal-shell";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <ProtectedPortal>{children}</ProtectedPortal>;
}