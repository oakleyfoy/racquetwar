import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { loadDirectorFromCookie } from "./director-db";
import { DIRECTOR_COOKIE, DIRECTOR_LOGIN_PATH } from "./director-session";

export async function requireDirectorSession() {
  const token = (await cookies()).get(DIRECTOR_COOKIE)?.value;
  const director = await loadDirectorFromCookie(token);
  if (!director) {
    redirect(DIRECTOR_LOGIN_PATH);
  }
  return director;
}
