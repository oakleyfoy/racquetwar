import { redirect } from "next/navigation";

/**
 * This deployment exists only to serve the Certified Tournament Director
 * application, so the root sends visitors straight to it. The redirect is
 * temporary rather than permanent because racquetwar.com is expected to move
 * here in full later, at which point the root becomes a real home page.
 */
export default function RootPage() {
  redirect("/tournament-director");
}
