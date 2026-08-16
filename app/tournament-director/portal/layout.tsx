import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournament Director portal | Racquet War",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
