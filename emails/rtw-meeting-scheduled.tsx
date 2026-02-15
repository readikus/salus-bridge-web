import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import * as React from "react";

interface Props {
  organisationName: string;
  scheduledDate: string;
  caseUrl: string;
}

export function RtwMeetingScheduledEmail({ organisationName, scheduledDate, caseUrl }: Props) {
  return (
    <EmailLayout preview="Update: A meeting has been scheduled">
      <Text style={heading}>A meeting has been scheduled</Text>

      <Text style={paragraph}>
        A return-to-work meeting has been scheduled for <strong>{scheduledDate}</strong> at{" "}
        <strong>{organisationName}</strong>. Please review the details.
      </Text>

      <Text style={paragraph}>
        You can view the full meeting details and any preparation notes in SalusBridge.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={caseUrl}>
          View Details
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default RtwMeetingScheduledEmail;

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
