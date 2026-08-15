import { getApplication } from "./applications";
import { query, withTransaction } from "./db";
import { PROGRAM_SLUG, formatTerritory, type CtdApplicationRecord } from "./fields";
import {
  defaultWorkflowStatus,
  isFollowUpDueFilter,
  isWorkflowStatus,
  summarizeWorkflowStatuses,
  WORKFLOW_ACTOR,
  type ActivityType,
  type ScreeningMethod,
  type ScreeningOutcome,
  type TrackerSummary,
  type WorkflowStatus,
} from "./workflow";
import { ADMIN_TIMEZONE } from "./workflow";
import { followUpUrgency } from "./workflow-time";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Queryable = {
  query: <T extends Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>;
};

export type WorkflowRecord = {
  applicationId: string;
  currentStatus: WorkflowStatus;
  assignedTo: string;
  nextAction: string;
  nextFollowUpAt: string | null;
  screeningScheduledAt: string | null;
  screeningTimezone: string;
  screeningMethod: string;
  screeningLocationOrLink: string;
  screeningOutcome: string;
  screeningSummary: string;
  recommendedNextStep: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type WorkflowNote = {
  id: string;
  applicationId: string;
  note: string;
  createdBy: string;
  createdAt: string;
};

export type WorkflowFollowUp = {
  id: string;
  applicationId: string;
  actionDescription: string;
  dueAt: string | null;
  completedAt: string | null;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
};

export type WorkflowActivity = {
  id: string;
  applicationId: string;
  activityType: ActivityType | string;
  previousValue: string | null;
  newValue: string | null;
  description: string;
  createdBy: string;
  createdAt: string;
};

export type TrackerFilters = {
  status?: string;
  state?: string;
  territory?: string;
  assignedTo?: string;
  followUpDue?: string;
  screeningDate?: string;
  search?: string;
};

export type TrackerRow = {
  application: CtdApplicationRecord;
  workflow: WorkflowRecord;
  hasOverdueFollowUp: boolean;
  hasDueTodayFollowUp: boolean;
};

type WorkflowRow = {
  application_id: string;
  current_status: string;
  assigned_to: string | null;
  next_action: string | null;
  next_follow_up_at: Date | null;
  screening_scheduled_at: Date | null;
  screening_timezone: string | null;
  screening_method: string | null;
  screening_location_or_link: string | null;
  screening_outcome: string | null;
  screening_summary: string | null;
  recommended_next_step: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function emptyWorkflow(applicationId: string): WorkflowRecord {
  return {
    applicationId,
    currentStatus: "new",
    assignedTo: "",
    nextAction: "",
    nextFollowUpAt: null,
    screeningScheduledAt: null,
    screeningTimezone: "",
    screeningMethod: "",
    screeningLocationOrLink: "",
    screeningOutcome: "",
    screeningSummary: "",
    recommendedNextStep: "",
    createdAt: null,
    updatedAt: null,
  };
}

function mapWorkflow(row: WorkflowRow | undefined, applicationId: string): WorkflowRecord {
  if (!row) return emptyWorkflow(applicationId);

  return {
    applicationId: row.application_id,
    currentStatus: defaultWorkflowStatus(row.current_status),
    assignedTo: row.assigned_to ?? "",
    nextAction: row.next_action ?? "",
    nextFollowUpAt: iso(row.next_follow_up_at),
    screeningScheduledAt: iso(row.screening_scheduled_at),
    screeningTimezone: row.screening_timezone ?? "",
    screeningMethod: row.screening_method ?? "",
    screeningLocationOrLink: row.screening_location_or_link ?? "",
    screeningOutcome: row.screening_outcome ?? "",
    screeningSummary: row.screening_summary ?? "",
    recommendedNextStep: row.recommended_next_step ?? "",
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function requireStoredApplication(id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const application = await getApplication(id);
  if (!application || application.program !== PROGRAM_SLUG) return null;
  return application;
}

async function recordActivity(
  client: Queryable,
  input: {
    applicationId: string;
    activityType: ActivityType;
    previousValue?: string | null;
    newValue?: string | null;
    description: string;
    createdBy?: string;
  },
) {
  await client.query(
    `insert into ctd_application_activities (
      application_id, activity_type, previous_value, new_value, description, created_by
    ) values ($1, $2, $3, $4, $5, $6)`,
    [
      input.applicationId,
      input.activityType,
      input.previousValue ?? null,
      input.newValue ?? null,
      input.description,
      input.createdBy ?? WORKFLOW_ACTOR,
    ],
  );
}

export async function ensureWorkflow(
  applicationId: string,
  client: Queryable = { query },
) {
  const existing = await client.query<WorkflowRow>(
    `select * from ctd_application_workflows where application_id = $1`,
    [applicationId],
  );
  if (existing.rows[0]) return mapWorkflow(existing.rows[0], applicationId);

  const inserted = await client.query<WorkflowRow>(
    `insert into ctd_application_workflows (application_id, current_status)
     values ($1, 'new')
     on conflict (application_id) do update
       set updated_at = ctd_application_workflows.updated_at
     returning *`,
    [applicationId],
  );

  return mapWorkflow(inserted.rows[0], applicationId);
}

export async function getWorkflow(applicationId: string) {
  const result = await query<WorkflowRow>(
    `select * from ctd_application_workflows where application_id = $1`,
    [applicationId],
  );
  return mapWorkflow(result.rows[0], applicationId);
}

export async function listNotes(applicationId: string) {
  const result = await query<{
    id: string;
    application_id: string;
    note: string;
    created_by: string;
    created_at: Date;
  }>(
    `select id, application_id, note, created_by, created_at
     from ctd_application_notes
     where application_id = $1
     order by created_at desc`,
    [applicationId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    applicationId: row.application_id,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  })) satisfies WorkflowNote[];
}

export async function listFollowUps(applicationId: string) {
  const result = await query<{
    id: string;
    application_id: string;
    action_description: string;
    due_at: Date | null;
    completed_at: Date | null;
    assigned_to: string | null;
    created_by: string;
    created_at: Date;
  }>(
    `select id, application_id, action_description, due_at, completed_at,
            assigned_to, created_by, created_at
     from ctd_application_follow_ups
     where application_id = $1
     order by
       case when completed_at is null then 0 else 1 end,
       due_at asc nulls last,
       created_at desc`,
    [applicationId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    applicationId: row.application_id,
    actionDescription: row.action_description,
    dueAt: iso(row.due_at),
    completedAt: iso(row.completed_at),
    assignedTo: row.assigned_to ?? "",
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  })) satisfies WorkflowFollowUp[];
}

export async function listActivities(applicationId: string) {
  const result = await query<{
    id: string;
    application_id: string;
    activity_type: string;
    previous_value: string | null;
    new_value: string | null;
    description: string;
    created_by: string;
    created_at: Date;
  }>(
    `select id, application_id, activity_type, previous_value, new_value,
            description, created_by, created_at
     from ctd_application_activities
     where application_id = $1
     order by created_at desc`,
    [applicationId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    applicationId: row.application_id,
    activityType: row.activity_type,
    previousValue: row.previous_value,
    newValue: row.new_value,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  })) satisfies WorkflowActivity[];
}

export async function getWorkspace(applicationId: string) {
  const application = await requireStoredApplication(applicationId);
  if (!application) return null;

  const [workflow, notes, followUps, activities] = await Promise.all([
    getWorkflow(applicationId),
    listNotes(applicationId),
    listFollowUps(applicationId),
    listActivities(applicationId),
  ]);

  return { application, workflow, notes, followUps, activities };
}

function trackerWhere(filters: TrackerFilters) {
  const conditions = ["a.program = $1"];
  const params: unknown[] = [PROGRAM_SLUG];

  if (filters.status && isWorkflowStatus(filters.status)) {
    params.push(filters.status);
    conditions.push(`coalesce(w.current_status, 'new') = $${params.length}`);
  }

  if (filters.state?.trim()) {
    params.push(filters.state.trim().toLowerCase());
    conditions.push(`lower(coalesce(a.state, a.region, '')) = $${params.length}`);
  }

  if (filters.territory?.trim()) {
    params.push(`%${filters.territory.trim().toLowerCase()}%`);
    conditions.push(`(
      lower(coalesce(a.primary_territory ->> 'city', '')) like $${params.length}
      or lower(coalesce(a.primary_territory ->> 'state', '')) like $${params.length}
      or lower(coalesce(a.primary_territory ->> 'region', '')) like $${params.length}
    )`);
  }

  if (filters.assignedTo?.trim()) {
    params.push(filters.assignedTo.trim().toLowerCase());
    conditions.push(`lower(coalesce(w.assigned_to, '')) = $${params.length}`);
  }

  if (filters.screeningDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.screeningDate)) {
    params.push(filters.screeningDate);
    conditions.push(
      `(w.screening_scheduled_at at time zone '${ADMIN_TIMEZONE}')::date = $${params.length}::date`,
    );
  }

  const followUpDue = filters.followUpDue ?? "";
  if (isFollowUpDueFilter(followUpDue)) {
    if (followUpDue === "any_open") {
      conditions.push(`exists (
        select 1 from ctd_application_follow_ups f
        where f.application_id = a.id and f.completed_at is null
      )`);
    } else if (followUpDue === "overdue") {
      conditions.push(`exists (
        select 1 from ctd_application_follow_ups f
        where f.application_id = a.id
          and f.completed_at is null
          and f.due_at < now()
      )`);
    } else if (followUpDue === "today") {
      conditions.push(`exists (
        select 1 from ctd_application_follow_ups f
        where f.application_id = a.id
          and f.completed_at is null
          and (f.due_at at time zone '${ADMIN_TIMEZONE}')::date = (now() at time zone '${ADMIN_TIMEZONE}')::date
      )`);
    }
  }

  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    const index = params.length;
    conditions.push(`(
      lower(a.first_name || ' ' || a.last_name) like $${index}
      or lower(a.email) like $${index}
      or lower(a.mobile_phone) like $${index}
      or lower(a.city) like $${index}
      or lower(coalesce(a.state, '')) like $${index}
      or lower(coalesce(a.region, '')) like $${index}
      or lower(a.zip_code) like $${index}
      or lower(coalesce(a.primary_territory ->> 'city', '')) like $${index}
      or lower(coalesce(a.primary_territory ->> 'state', '')) like $${index}
      or lower(coalesce(a.primary_territory ->> 'region', '')) like $${index}
    )`);
  }

  return { conditions, params };
}

const APPLICATION_SELECT = `
  a.id, a.program, a.submitted_at, a.first_name, a.last_name, a.email, a.mobile_phone,
  a.city, a.country, a.state, a.region, a.zip_code,
  a.primary_territory, a.territory_scope, a.additional_territories,
  a.sports, a.sport_other, a.skill_level, a.clubs_leagues,
  a.tournament_experience, a.tournament_experience_detail,
  a.employer, a.position, a.years_management_experience, a.industry, a.people_supervised,
  a.business_experience, a.time_commitment, a.why_ctd, a.why_successful,
  a.how_heard, to_char(a.training_start_date, 'YYYY-MM-DD') as training_start_date,
  a.additional_info, a.agree_not_guaranteed, a.agree_selection_basis, a.agree_accurate,
  a.status, a.admin_notes, a.source_page
`;

export async function listTrackerApplications(filters: TrackerFilters = {}) {
  const { conditions, params } = trackerWhere(filters);

  const result = await query<
    Record<string, unknown> & WorkflowRow & {
      id: string;
      submitted_at: Date;
      first_name: string;
      last_name: string;
      email: string;
      mobile_phone: string;
      city: string;
      country: string;
      state: string | null;
      region: string | null;
      zip_code: string;
      primary_territory: CtdApplicationRecord["primaryTerritory"] | null;
      overdue_follow_up: boolean;
      due_today_follow_up: boolean;
    }
  >(
    `select ${APPLICATION_SELECT},
            w.application_id, w.current_status, w.assigned_to, w.next_action,
            w.next_follow_up_at, w.screening_scheduled_at, w.screening_timezone,
            w.screening_method, w.screening_location_or_link, w.screening_outcome,
            w.screening_summary, w.recommended_next_step, w.created_at, w.updated_at,
            exists (
              select 1 from ctd_application_follow_ups f
              where f.application_id = a.id
                and f.completed_at is null
                and f.due_at < now()
            ) as overdue_follow_up,
            exists (
              select 1 from ctd_application_follow_ups f
              where f.application_id = a.id
                and f.completed_at is null
                and (f.due_at at time zone '${ADMIN_TIMEZONE}')::date
                  = (now() at time zone '${ADMIN_TIMEZONE}')::date
            ) as due_today_follow_up
     from ctd_applications a
     left join ctd_application_workflows w on w.application_id = a.id
     where ${conditions.join(" and ")}
     order by
       case when exists (
         select 1 from ctd_application_follow_ups f
         where f.application_id = a.id
           and f.completed_at is null
           and f.due_at < now()
       ) then 0 else 1 end,
       case when coalesce(w.current_status, 'new') = 'new' then 0 else 1 end,
       case
         when w.screening_scheduled_at is not null
          and w.screening_scheduled_at >= now()
         then w.screening_scheduled_at
       end asc nulls last,
       a.submitted_at desc
     limit 1000`,
    params,
  );

  return result.rows.map((row) => {
    const application = {
      id: row.id,
      program: String(row.program ?? PROGRAM_SLUG),
      submittedAt: row.submitted_at.toISOString(),
      status: "new" as const,
      adminNotes: String(row.admin_notes ?? ""),
      sourcePage: String(row.source_page ?? ""),
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      mobilePhone: row.mobile_phone,
      city: row.city,
      country: row.country,
      state: row.state ?? "",
      region: row.region ?? "",
      zipCode: row.zip_code,
      primaryTerritory: row.primary_territory ?? {
        city: "",
        country: row.country,
        state: "",
        region: "",
      },
      territoryScope: (row.territory_scope as CtdApplicationRecord["territoryScope"]) ?? "",
      additionalTerritories: (row.additional_territories as CtdApplicationRecord["additionalTerritories"]) ?? [],
      sports: (row.sports as string[]) ?? [],
      sportOther: String(row.sport_other ?? ""),
      skillLevel: String(row.skill_level ?? ""),
      clubsLeagues: String(row.clubs_leagues ?? ""),
      tournamentExperience: (row.tournament_experience as string[]) ?? [],
      tournamentExperienceDetail: String(row.tournament_experience_detail ?? ""),
      employer: String(row.employer ?? ""),
      position: String(row.position ?? ""),
      yearsManagementExperience: String(row.years_management_experience ?? ""),
      industry: String(row.industry ?? ""),
      peopleSupervised: String(row.people_supervised ?? ""),
      businessExperience: (row.business_experience as string[]) ?? [],
      timeCommitment: String(row.time_commitment ?? ""),
      whyCtd: String(row.why_ctd ?? ""),
      whySuccessful: String(row.why_successful ?? ""),
      howHeard: String(row.how_heard ?? ""),
      trainingStartDate: String(row.training_start_date ?? ""),
      additionalInfo: String(row.additional_info ?? ""),
      agreeNotGuaranteed: Boolean(row.agree_not_guaranteed),
      agreeSelectionBasis: Boolean(row.agree_selection_basis),
      agreeAccurate: Boolean(row.agree_accurate),
    } satisfies CtdApplicationRecord;

    return {
      application,
      workflow: mapWorkflow(row.application_id ? row : undefined, row.id),
      hasOverdueFollowUp: Boolean(row.overdue_follow_up),
      hasDueTodayFollowUp: Boolean(row.due_today_follow_up),
    } satisfies TrackerRow;
  });
}

export async function getTrackerSummary(): Promise<TrackerSummary> {
  const [statusResult, dueResult] = await Promise.all([
    query<{ status: string; count: string }>(
      `select coalesce(w.current_status, 'new') as status, count(*)::text as count
       from ctd_applications a
       left join ctd_application_workflows w on w.application_id = a.id
       where a.program = $1
       group by coalesce(w.current_status, 'new')`,
      [PROGRAM_SLUG],
    ),
    query<{ count: string }>(
      `select count(distinct f.application_id)::text as count
       from ctd_application_follow_ups f
       join ctd_applications a on a.id = f.application_id
       where a.program = $1
         and f.completed_at is null
         and (
           f.due_at < now()
           or (f.due_at at time zone '${ADMIN_TIMEZONE}')::date
             = (now() at time zone '${ADMIN_TIMEZONE}')::date
         )`,
      [PROGRAM_SLUG],
    ),
  ]);

  const counts: Record<string, number> = {};
  for (const row of statusResult.rows) {
    counts[row.status] = Number(row.count);
  }

  return summarizeWorkflowStatuses(counts, Number(dueResult.rows[0]?.count ?? 0));
}

export async function listTrackerFilterOptions() {
  const result = await query<{
    state: string | null;
    region: string | null;
    territory_city: string | null;
    territory_state: string | null;
    assigned_to: string | null;
  }>(
    `select a.state, a.region,
            a.primary_territory ->> 'city' as territory_city,
            a.primary_territory ->> 'state' as territory_state,
            w.assigned_to
     from ctd_applications a
     left join ctd_application_workflows w on w.application_id = a.id
     where a.program = $1`,
    [PROGRAM_SLUG],
  );

  const states = new Set<string>();
  const territories = new Map<string, string>();
  const assignees = new Set<string>();

  for (const row of result.rows) {
    const state = (row.state || row.region || "").trim();
    if (state) states.add(state);
    const city = row.territory_city?.trim();
    if (city) {
      const label = [city, row.territory_state?.trim()]
        .filter(Boolean)
        .join(", ");
      territories.set(city, label);
    }
    if (row.assigned_to?.trim()) assignees.add(row.assigned_to.trim());
  }

  return {
    states: [...states].sort((a, b) => a.localeCompare(b)),
    territories: [...territories.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    assignees: [...assignees].sort((a, b) => a.localeCompare(b)),
  };
}

export async function updateWorkflowFields(
  applicationId: string,
  updates: Partial<{
    currentStatus: WorkflowStatus;
    assignedTo: string;
    nextAction: string;
    nextFollowUpAt: Date | null;
    screeningScheduledAt: Date | null;
    screeningTimezone: string;
    screeningMethod: string;
    screeningLocationOrLink: string;
    screeningOutcome: string;
    screeningSummary: string;
    recommendedNextStep: string;
  }>,
  activity?: {
    activityType: ActivityType;
    previousValue?: string | null;
    newValue?: string | null;
    description: string;
  },
) {
  return withTransaction(async (client) => {
    await ensureWorkflow(applicationId, client);

    const assignments: string[] = ["updated_at = now()"];
    const params: unknown[] = [applicationId];

    const set = (column: string, value: unknown) => {
      params.push(value);
      assignments.push(`${column} = $${params.length}`);
    };

    if (updates.currentStatus) set("current_status", updates.currentStatus);
    if (updates.assignedTo !== undefined) set("assigned_to", updates.assignedTo);
    if (updates.nextAction !== undefined) set("next_action", updates.nextAction);
    if (updates.nextFollowUpAt !== undefined) {
      set("next_follow_up_at", updates.nextFollowUpAt);
    }
    if (updates.screeningScheduledAt !== undefined) {
      set("screening_scheduled_at", updates.screeningScheduledAt);
    }
    if (updates.screeningTimezone !== undefined) {
      set("screening_timezone", updates.screeningTimezone);
    }
    if (updates.screeningMethod !== undefined) {
      set("screening_method", updates.screeningMethod);
    }
    if (updates.screeningLocationOrLink !== undefined) {
      set("screening_location_or_link", updates.screeningLocationOrLink);
    }
    if (updates.screeningOutcome !== undefined) {
      set("screening_outcome", updates.screeningOutcome);
    }
    if (updates.screeningSummary !== undefined) {
      set("screening_summary", updates.screeningSummary);
    }
    if (updates.recommendedNextStep !== undefined) {
      set("recommended_next_step", updates.recommendedNextStep);
    }

    const result = await client.query<WorkflowRow>(
      `update ctd_application_workflows
       set ${assignments.join(", ")}
       where application_id = $1
       returning *`,
      params,
    );

    if (activity) {
      await recordActivity(client, {
        applicationId,
        ...activity,
      });
    }

    return mapWorkflow(result.rows[0], applicationId);
  });
}

export async function addNote(applicationId: string, note: string) {
  const trimmed = note.trim();
  if (!trimmed) throw new Error("Enter a note.");

  return withTransaction(async (client) => {
    await ensureWorkflow(applicationId, client);
    const result = await client.query<{
      id: string;
      application_id: string;
      note: string;
      created_by: string;
      created_at: Date;
    }>(
      `insert into ctd_application_notes (application_id, note, created_by)
       values ($1, $2, $3)
       returning id, application_id, note, created_by, created_at`,
      [applicationId, trimmed, WORKFLOW_ACTOR],
    );

    await recordActivity(client, {
      applicationId,
      activityType: "note_added",
      description: "Internal note added.",
    });

    const row = result.rows[0];
    return {
      id: row.id,
      applicationId: row.application_id,
      note: row.note,
      createdBy: row.created_by,
      createdAt: row.created_at.toISOString(),
    } satisfies WorkflowNote;
  });
}

export async function addFollowUp(
  applicationId: string,
  input: { description: string; dueAt: Date | null; assignedTo: string },
) {
  const description = input.description.trim();
  if (!description) throw new Error("Enter a follow-up action.");

  return withTransaction(async (client) => {
    await ensureWorkflow(applicationId, client);
    const result = await client.query<{
      id: string;
      application_id: string;
      action_description: string;
      due_at: Date | null;
      completed_at: Date | null;
      assigned_to: string | null;
      created_by: string;
      created_at: Date;
    }>(
      `insert into ctd_application_follow_ups (
        application_id, action_description, due_at, assigned_to, created_by
      ) values ($1, $2, $3, $4, $5)
      returning id, application_id, action_description, due_at, completed_at,
                assigned_to, created_by, created_at`,
      [
        applicationId,
        description,
        input.dueAt,
        input.assignedTo.trim(),
        WORKFLOW_ACTOR,
      ],
    );

    await client.query(
      `update ctd_application_workflows
       set next_action = $2,
           next_follow_up_at = $3,
           updated_at = now()
       where application_id = $1`,
      [applicationId, description, input.dueAt],
    );

    await recordActivity(client, {
      applicationId,
      activityType: "follow_up_created",
      newValue: description,
      description: "Follow-up created.",
    });

    const row = result.rows[0];
    return {
      id: row.id,
      applicationId: row.application_id,
      actionDescription: row.action_description,
      dueAt: iso(row.due_at),
      completedAt: iso(row.completed_at),
      assignedTo: row.assigned_to ?? "",
      createdBy: row.created_by,
      createdAt: row.created_at.toISOString(),
    } satisfies WorkflowFollowUp;
  });
}

export async function setFollowUpCompletion(
  applicationId: string,
  followUpId: string,
  completed: boolean,
) {
  if (!UUID_PATTERN.test(followUpId)) {
    throw new Error("That follow-up was not found.");
  }

  return withTransaction(async (client) => {
    const result = await client.query<{
      id: string;
      action_description: string;
    }>(
      `update ctd_application_follow_ups
       set completed_at = case when $3 then now() else null end
       where id = $1 and application_id = $2
       returning id, action_description`,
      [followUpId, applicationId, completed],
    );

    if (!result.rows[0]) {
      throw new Error("That follow-up was not found.");
    }

    await recordActivity(client, {
      applicationId,
      activityType: completed ? "follow_up_completed" : "follow_up_reopened",
      newValue: result.rows[0].action_description,
      description: completed ? "Follow-up completed." : "Follow-up reopened.",
    });

    return result.rows[0];
  });
}

export async function recordEmailActivity(
  applicationId: string,
  input: { sent: boolean; emailType: string; detail: string },
) {
  await recordActivity(
    { query },
    {
      applicationId,
      activityType: input.sent ? "candidate_email_sent" : "candidate_email_failed",
      newValue: input.emailType,
      description: input.detail,
    },
  );
}

export function formatTrackerTerritory(application: CtdApplicationRecord) {
  return formatTerritory(application.primaryTerritory);
}

export function followUpFlags(followUp: WorkflowFollowUp) {
  return followUpUrgency(followUp.dueAt, followUp.completedAt);
}

export type ScreeningScheduleInput = {
  scheduledAt: Date;
  timeZone: string;
  method: ScreeningMethod;
  locationOrLink: string;
  preparationNote?: string;
};

export async function saveScreeningSchedule(
  applicationId: string,
  input: ScreeningScheduleInput,
  mode: "schedule" | "reschedule",
) {
  const previous = await getWorkflow(applicationId);

  return updateWorkflowFields(
    applicationId,
    {
      currentStatus: "screening_scheduled",
      screeningScheduledAt: input.scheduledAt,
      screeningTimezone: input.timeZone,
      screeningMethod: input.method,
      screeningLocationOrLink: input.locationOrLink,
    },
    {
      activityType:
        mode === "reschedule" ? "screening_rescheduled" : "screening_scheduled",
      previousValue: previous.screeningScheduledAt,
      newValue: input.scheduledAt.toISOString(),
      description:
        mode === "reschedule"
          ? "Screening call rescheduled."
          : "Screening call scheduled.",
    },
  );
}

export async function cancelScreeningSchedule(applicationId: string) {
  const previous = await getWorkflow(applicationId);
  const nextStatus: WorkflowStatus =
    previous.currentStatus === "screening_scheduled"
      ? "screening_invited"
      : previous.currentStatus;

  return updateWorkflowFields(
    applicationId,
    {
      currentStatus: nextStatus,
      screeningScheduledAt: null,
      screeningTimezone: previous.screeningTimezone,
      screeningMethod: "",
      screeningLocationOrLink: "",
    },
    {
      activityType: "screening_canceled",
      previousValue: previous.screeningScheduledAt,
      description: "Screening call canceled.",
    },
  );
}

export async function recordScreeningOutcome(
  applicationId: string,
  input: {
    outcome: ScreeningOutcome;
    summary: string;
    recommendedNextStep: string;
  },
) {
  const nextStatus: WorkflowStatus =
    input.outcome === "candidate_withdrew" ? "withdrawn" : "screening_completed";

  return updateWorkflowFields(
    applicationId,
    {
      currentStatus: nextStatus,
      screeningOutcome: input.outcome,
      screeningSummary: input.summary.trim(),
      recommendedNextStep: input.recommendedNextStep.trim(),
    },
    {
      activityType: "screening_outcome_recorded",
      newValue: input.outcome,
      description: input.summary.trim() || "Screening outcome recorded.",
    },
  );
}
