import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadShift — Insurance Lead Routing",
  description:
    "Route life insurance and IUL leads to the right buyer in under 2 seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
