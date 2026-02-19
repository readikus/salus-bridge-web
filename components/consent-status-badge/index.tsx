import { Badge } from "@/components/ui/badge";

interface Props {
  status: string | null | undefined;
}

/**
 * Colour-coded badge for medical records consent status.
 */
export function ConsentStatusBadge({ status }: Props) {
  switch (status) {
    case "GRANTED":
      return <Badge variant="success">Granted</Badge>;
    case "REVOKED":
      return <Badge variant="destructive">Revoked</Badge>;
    case "PENDING":
      return <Badge variant="outline">Pending</Badge>;
    default:
      return <Badge variant="outline">No Consent</Badge>;
  }
}
