"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  isAdminConfigured,
  verifyPassword,
} from "@/lib/ctd/admin-session";
import { deleteApplication, updateApplication } from "@/lib/ctd/applications";

const ADMIN_PATH = "/tournament-director/admin";
const LOGIN_PATH = `${ADMIN_PATH}/login`;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loginAction(formData: FormData) {
  if (!isAdminConfigured()) {
    redirect(`${LOGIN_PATH}?error=unconfigured`);
  }

  const password = String(formData.get("password") ?? "");

  if (!(await verifyPassword(password))) {
    redirect(`${LOGIN_PATH}?error=invalid`);
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, await createSessionToken(), SESSION_COOKIE_OPTIONS);

  redirect(ADMIN_PATH);
}

export async function logoutAction() {
  const store = await cookies();
  store.delete({ name: ADMIN_COOKIE, path: SESSION_COOKIE_OPTIONS.path });

  redirect(LOGIN_PATH);
}

export async function updateApplicationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(ADMIN_PATH);

  await updateApplication(id, {
    status: String(formData.get("status") ?? ""),
    adminNotes: String(formData.get("adminNotes") ?? ""),
  });

  redirect(`${ADMIN_PATH}/${id}?saved=1`);
}

export async function deleteApplicationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect(ADMIN_PATH);

  const deleted = await deleteApplication(id);
  redirect(deleted ? `${ADMIN_PATH}?deleted=1` : `${ADMIN_PATH}?error=notfound`);
}
