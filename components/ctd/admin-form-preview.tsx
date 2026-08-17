"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { PREVIEW_BANNER_TEXT, PREVIEW_BANNER_TITLE } from "@/lib/ctd/form-preview";

function PreviewControls({ onReset }: { onReset: () => void }) {
  return (
    <div className="ctd-buttonrow">
      <Link className="ctd-admin-navlink" href="/tournament-director/admin/forms-preview">
        BACK TO FORM PREVIEWS
      </Link>
      <button className="ctd-addbutton" type="button" onClick={onReset}>
        RESET PREVIEW
      </button>
    </div>
  );
}

export function AdminFormPreviewShell({ children }: { children: ReactNode }) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <>
      <div className="ctd-preview-banner" role="status">
        <strong>{PREVIEW_BANNER_TITLE}</strong>
        <p>{PREVIEW_BANNER_TEXT}</p>
      </div>
      <PreviewControls onReset={() => setResetKey((value) => value + 1)} />
      <div key={resetKey} data-preview-reset={resetKey}>
        {children}
      </div>
      <PreviewControls onReset={() => setResetKey((value) => value + 1)} />
    </>
  );
}
