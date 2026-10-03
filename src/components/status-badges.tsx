import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROMO_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  computePaymentStatus,
} from "@/lib/format";
import type { PromoStatus } from "@/lib/types";
import { useI18n } from "@/components/language-provider";

export function PromoStatusBadge({ status }: { status: PromoStatus }) {
  const { t } = useI18n();
  const s = PROMO_STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", s.className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {t(`status.${status}`)}
    </Badge>
  );
}

export function PaymentStatusBadge({
  paidOut,
  received,
  expectedDate,
}: {
  paidOut: boolean;
  received: boolean;
  expectedDate: string | null;
}) {
  const { t } = useI18n();
  const status = computePaymentStatus(paidOut, received, expectedDate);
  const s = PAYMENT_STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", s.className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {t(`payStatus.${status}`)}
    </Badge>
  );
}
