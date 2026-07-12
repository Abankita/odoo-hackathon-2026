import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoSphere: ESG Management Platform",
  description: "Hackathon scaffold for ESG data, scoring, and governance workflows."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
