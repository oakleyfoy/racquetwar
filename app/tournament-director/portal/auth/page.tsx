import { redirect } from "next/navigation";

import { DIRECTOR_LOGIN_PATH } from "@/lib/ctd/director-session";

import { completeDirectorLoginAction } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DirectorAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect(`${DIRECTOR_LOGIN_PATH}?error=invalid`);
  await completeDirectorLoginAction(token);
  return null;
}
