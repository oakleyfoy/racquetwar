import { AdminFormPreviewShell } from "@/components/ctd/admin-form-preview";
import { AdminPortalNav } from "@/components/ctd/admin-portal-nav";
import { PortalSponsorshipForm } from "@/components/ctd/portal-sponsorship-form";
import { requireAdminSession } from "@/lib/ctd/admin-guard";
import { blankSponsorshipPreview } from "@/lib/ctd/form-preview-data";
import { PREVIEW_DIRECTOR_NAME } from "@/lib/ctd/form-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminSponsorshipFormPreviewPage() {
  await requireAdminSession();

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <AdminPortalNav />
        <h1 className="ctd-section-title">
          Sponsorship Disclosure and Approval Request
        </h1>
        <AdminFormPreviewShell>
          <PortalSponsorshipForm
            mode="admin-preview"
            request={blankSponsorshipPreview()}
            directorName={PREVIEW_DIRECTOR_NAME}
            events={[]}
            canEdit
          />
        </AdminFormPreviewShell>
      </div>
    </main>
  );
}
