import { AdminFormPreviewShell } from "@/components/ctd/admin-form-preview";
import { AdminPortalNav } from "@/components/ctd/admin-portal-nav";
import { PortalEventForm } from "@/components/ctd/portal-event-form";
import { requireAdminSession } from "@/lib/ctd/admin-guard";
import { blankEventPreview } from "@/lib/ctd/form-preview-data";
import { PREVIEW_DIRECTOR_NAME } from "@/lib/ctd/form-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminEventFormPreviewPage() {
  await requireAdminSession();

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <AdminPortalNav />
        <h1 className="ctd-section-title">Proposed Event & Budget Form</h1>
        <AdminFormPreviewShell>
          <PortalEventForm
            mode="admin-preview"
            proposal={blankEventPreview()}
            directorName={PREVIEW_DIRECTOR_NAME}
            canEdit
          />
        </AdminFormPreviewShell>
      </div>
    </main>
  );
}
