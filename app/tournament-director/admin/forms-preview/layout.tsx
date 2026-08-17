import type { Metadata } from "next";

import { requireAdminSession } from "@/lib/ctd/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview Director forms | CTD admin",
  robots: { index: false, follow: false },
};

export default async function FormsPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();
  return children;
}
