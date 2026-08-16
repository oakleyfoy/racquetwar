import { query, withTransaction } from "./db";
import {
  DIRECTOR_AUTH_PATH,
  directorSessionTtlMs,
  hashToken,
  loginTokenTtlMs,
  randomToken,
  signDirectorCookie,
  verifyDirectorCookie,
} from "./director-session";
import { APP_URL } from "./site";
import { WORKFLOW_ACTOR } from "./workflow";
import { getWorkflow } from "./workflow-db";

export type DirectorRecord = {
  id: string;
  applicationId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  status: "active" | "deactivated";
};

type DirectorRow = {
  id: string;
  application_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
};

function mapDirector(row: DirectorRow): DirectorRecord {
  return {
    id: row.id,
    applicationId: row.application_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status === "deactivated" ? "deactivated" : "active",
  };
}

export async function getDirector(id: string) {
  const result = await query<DirectorRow>(
    `select id, application_id, email, first_name, last_name, status
     from ctd_directors where id = $1`,
    [id],
  );
  return result.rows[0] ? mapDirector(result.rows[0]) : null;
}

export async function getDirectorByApplicationId(applicationId: string) {
  const result = await query<DirectorRow>(
    `select id, application_id, email, first_name, last_name, status
     from ctd_directors where application_id = $1`,
    [applicationId],
  );
  return result.rows[0] ? mapDirector(result.rows[0]) : null;
}

export async function getDirectorByEmail(email: string) {
  const result = await query<DirectorRow>(
    `select id, application_id, email, first_name, last_name, status
     from ctd_directors where lower(email) = lower($1)`,
    [email.trim()],
  );
  return result.rows[0] ? mapDirector(result.rows[0]) : null;
}

export async function listDirectors() {
  const result = await query<DirectorRow>(
    `select id, application_id, email, first_name, last_name, status
     from ctd_directors
     order by last_name, first_name`,
  );
  return result.rows.map(mapDirector);
}

export async function activateDirectorFromApplication(input: {
  applicationId: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  const workflow = await getWorkflow(input.applicationId);
  if (workflow.currentStatus !== "selected") {
    throw new Error(
      "Director access can only be activated from an application with Selected status.",
    );
  }

  const existing = await query<DirectorRow>(
    `select id, application_id, email, first_name, last_name, status
     from ctd_directors
     where application_id = $1 or lower(email) = lower($2)`,
    [input.applicationId, input.email],
  );
  if (existing.rows[0]) {
    const director = mapDirector(existing.rows[0]);
    if (director.status === "deactivated") {
      await query(
        `update ctd_directors
         set status = 'active', deactivated_at = null, deactivated_by = '',
             updated_at = now()
         where id = $1`,
        [director.id],
      );
      return { ...director, status: "active" as const };
    }
    return director;
  }

  const inserted = await query<DirectorRow>(
    `insert into ctd_directors (
      application_id, email, first_name, last_name, status, created_by
    ) values ($1, $2, $3, $4, 'active', $5)
    returning id, application_id, email, first_name, last_name, status`,
    [
      input.applicationId,
      input.email.trim(),
      input.firstName.trim(),
      input.lastName.trim(),
      WORKFLOW_ACTOR,
    ],
  );
  return mapDirector(inserted.rows[0]);
}

export async function setDirectorActive(id: string, active: boolean) {
  await query(
    `update ctd_directors
     set status = $2,
         deactivated_at = case when $2 = 'deactivated' then now() else null end,
         deactivated_by = case when $2 = 'deactivated' then $3 else '' end,
         updated_at = now()
     where id = $1`,
    [id, active ? "active" : "deactivated", WORKFLOW_ACTOR],
  );
  if (!active) {
    await query(
      `update ctd_director_sessions
       set revoked_at = now()
       where director_id = $1 and revoked_at is null`,
      [id],
    );
    await query(
      `update ctd_director_login_tokens
       set revoked_at = now()
       where director_id = $1 and revoked_at is null and used_at is null`,
      [id],
    );
  }
}

export async function issueDirectorLoginLink(email: string) {
  const director = await getDirectorByEmail(email);
  if (!director || director.status !== "active") {
    return null;
  }

  const raw = randomToken();
  const tokenHash = await hashToken(raw);
  const expiresAt = new Date(Date.now() + loginTokenTtlMs());

  await query(
    `insert into ctd_director_login_tokens (director_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [director.id, tokenHash, expiresAt],
  );

  return {
    director,
    url: `${APP_URL}${DIRECTOR_AUTH_PATH}?token=${raw}`,
  };
}

export async function consumeDirectorLoginToken(rawToken: string) {
  const tokenHash = await hashToken(rawToken);
  const token = await query<{
    id: string;
    director_id: string;
    expires_at: Date;
    used_at: Date | null;
    revoked_at: Date | null;
  }>(
    `select id, director_id, expires_at, used_at, revoked_at
     from ctd_director_login_tokens
     where token_hash = $1`,
    [tokenHash],
  );
  const row = token.rows[0];
  if (!row || row.used_at || row.revoked_at || row.expires_at.getTime() < Date.now()) {
    return null;
  }

  const director = await getDirector(row.director_id);
  if (!director || director.status !== "active") return null;

  const sessionRaw = randomToken();
  const sessionHash = await hashToken(sessionRaw);
  const expiresAt = Date.now() + directorSessionTtlMs();

  const session = await withTransaction(async (client) => {
    await client.query(
      `update ctd_director_login_tokens set used_at = now() where id = $1`,
      [row.id],
    );
    const created = await client.query<{ id: string }>(
      `insert into ctd_director_sessions (director_id, token_hash, expires_at)
       values ($1, $2, $3)
       returning id`,
      [director.id, sessionHash, new Date(expiresAt)],
    );
    return created.rows[0];
  });

  const cookie = await signDirectorCookie(session.id, expiresAt);
  return { director, cookie, sessionId: session.id };
}

export async function loadDirectorFromCookie(token: string | undefined) {
  const parsed = await verifyDirectorCookie(token);
  if (!parsed) return null;

  const session = await query<{
    id: string;
    director_id: string;
    expires_at: Date;
    revoked_at: Date | null;
  }>(
    `select id, director_id, expires_at, revoked_at
     from ctd_director_sessions
     where id = $1`,
    [parsed.sessionId],
  );
  const row = session.rows[0];
  if (!row || row.revoked_at || row.expires_at.getTime() < Date.now()) return null;

  const director = await getDirector(row.director_id);
  if (!director || director.status !== "active") return null;
  return director;
}

export async function revokeDirectorSession(sessionId: string) {
  await query(
    `update ctd_director_sessions set revoked_at = now() where id = $1`,
    [sessionId],
  );
}

export function directorDisplayName(director: DirectorRecord) {
  return `${director.firstName} ${director.lastName}`.trim();
}
