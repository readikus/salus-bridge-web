import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface Props {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SalusBridge</Text>
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated message from SalusBridge. Please do not reply to this email.
            </Text>
            <Text style={footerText}>
              <Link href="https://salusbridge.com" style={footerLink}>
                salusbridge.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "580px",
};

const header: React.CSSProperties = {
  padding: "24px 32px",
};

const logo: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#1a1a2e",
  margin: "0",
};

const content: React.CSSProperties = {
  padding: "0 32px",
};

const hr: React.CSSProperties = {
  borderColor: "#e6ebf1",
  margin: "32px 0 24px",
};

const footer: React.CSSProperties = {
  padding: "0 32px",
};

const footerText: React.CSSProperties = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "4px 0",
};

const footerLink: React.CSSProperties = {
  color: "#8898aa",
};
