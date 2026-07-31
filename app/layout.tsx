import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Racquet War",
  description:
    "Apply to become a Founding Certified Tournament Director with Racquet War.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
