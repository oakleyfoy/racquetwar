import type { Metadata } from "next";

import "./globals.css";
import { SiteChrome } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Racquet War | Competitive Tennis Tournaments & Travel Experiences",
  description:
    "Join our well-organized tournament at beautiful resorts. Experience the fun, create lasting memories, and play with your favorite person regardless of rating.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
