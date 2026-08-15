import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE, verifySessionToken } from "./admin-session";

const LOGIN_PATH = "/tournament-director/admin/login";

export async function requireAdminSession() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    redirect(LOGIN_PATH);
  }
}
