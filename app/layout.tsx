import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RW Certified Tournament Director Program | War Tournaments",
  description:
    "Apply for consideration for the RW Certified Tournament Director Program operated by War Tournaments LLC.",
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
