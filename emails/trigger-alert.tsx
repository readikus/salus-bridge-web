import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import * as React from "react";

interface Props {
  employeeName: string;
  triggerName: string;
  triggerType: string;
  thresholdValue: number;
  actualValue: number;
  organisationName: string;
  alertsUrl: string;
}

export function TriggerAlertEmail({
  employeeName,
  triggerName,
  triggerType,
  thresholdValue,
  actualValue,
  organisationName,
  alertsUrl,
}: Props) {
  const typeLabel =
    triggerType === "FREQUENCY"
      ? "absence frequency"
      : triggerType === "BRADFORD_FACTOR"
        ? "Bradford Factor score"
        : "cumulative absence duration";

  return (
    <EmailLayout preview={`Absence Trigger Alert - ${employeeName}`}>
      <Text style={heading}>Absence Trigger Alert</Text>

      <Text style={paragraph}>
        <strong>{employeeName}</strong> at <strong>{organisationName}</strong> has breached the &apos;{triggerName}
        &apos; threshold for {typeLabel}.
      </Text>

      <Text style={paragraph}>
        Current value: <strong>{actualValue}</strong> (threshold: {thresholdValue})
      </Text>

      <Text style={paragraph}>Please review and take appropriate action.</Text>

      <Section style={buttonContainer}>
        <Button style={button} href={alertsUrl}>
          View Trigger Alerts
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default TriggerAlertEmail;

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
