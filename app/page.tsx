import { redirect } from "next/navigation";

/**
 * Public visitors land on the program information page first. From there they
 * can start the application. The redirect is temporary rather than permanent
 * because racquetwar.com is expected to move here in full later.
 */
export default function RootPage() {
  redirect("/tournament-director-program");
}
