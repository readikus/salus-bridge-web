import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import * as React from "react";

interface Props {
  organisationName: string;
  expiryDate: string;
  caseUrl: string;
}

export function FitNoteExpiringEmail({ organisationName, expiryDate, caseUrl }: Props) {
  return (
    <EmailLayout preview="Reminder: Action needed - document expiring soon">
      <Text style={heading}>A document is expiring soon</Text>

      <Text style={paragraph}>
        A document related to an ongoing case at <strong>{organisationName}</strong> requires attention before{" "}
        {expiryDate}.
      </Text>

      <Text style={paragraph}>
        Please review the case in SalusBridge to determine any next steps.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={caseUrl}>
          Review in SalusBridge
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default FitNoteExpiringEmail;

const heading: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1a1a2e",
  lineHeight: "28px",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
  margin: "0 0 16px",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#1a1a2e",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
