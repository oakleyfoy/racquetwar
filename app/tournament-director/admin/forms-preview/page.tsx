import { AdminFormPreviewLanding } from "@/components/ctd/admin-form-preview-landing";
import { AdminPortalNav } from "@/components/ctd/admin-portal-nav";
import { requireAdminSession } from "@/lib/ctd/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFormsPreviewPage() {
  await requireAdminSession();

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <AdminPortalNav />
        <h1 className="ctd-section-title">Preview Director forms</h1>
        <p className="ctd-section-hint">
          Inspect the forms a Director will complete. Nothing entered in preview
          is saved, submitted or emailed.
        </p>
        <AdminFormPreviewLanding />
      </div>
    </main>
  );
}
