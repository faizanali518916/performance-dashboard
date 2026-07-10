import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PGTS Performance Dashboard", template: "%s · PGTS" },
  description: "Performance growth tracking for modern teams",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
