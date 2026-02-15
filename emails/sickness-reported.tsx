import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import * as React from "react";

interface Props {
  organisationName: string;
  dateReported: string;
  caseUrl: string;
}

export function SicknessReportedEmail({ organisationName, dateReported, caseUrl }: Props) {
  return (
    <EmailLayout preview="Action required: A team member has reported an absence">
      <Text style={heading}>A team member has reported an absence</Text>

      <Text style={paragraph}>
        A member of your team at <strong>{organisationName}</strong> has reported that they are unable to work as of{" "}
        {dateReported}. Please review the details and consider reaching out.
      </Text>

      <Text style={paragraph}>
        You can view the case details and any required actions in SalusBridge.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={caseUrl}>
          View in SalusBridge
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default SicknessReportedEmail;

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
