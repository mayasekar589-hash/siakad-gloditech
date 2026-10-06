import { BillingWorkspace } from "./billing-workspace";
import { FinanceMasterWorkspace } from "./finance-master-workspace";
import { PaymentWorkspace } from "./payment-workspace";

type FinanceModuleId = "tagihan" | "pembayaran" | "tarif-akademik" | "beasiswa" | "rekonsiliasi";

export function FinanceModulePage({ moduleId }: { moduleId: FinanceModuleId }) {
  switch (moduleId) {
    case "tagihan":
      return <BillingWorkspace />;
    case "pembayaran":
      return <PaymentWorkspace />;
    case "tarif-akademik":
    case "beasiswa":
    case "rekonsiliasi":
      return <FinanceMasterWorkspace moduleId={moduleId} />;
  }
}
