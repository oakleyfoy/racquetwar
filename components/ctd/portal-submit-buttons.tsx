"use client";

import { useFormStatus } from "react-dom";

import type { DirectorFormMode } from "@/lib/ctd/form-preview";

export function PortalSubmitButtons({
  canSubmit,
  submitLabel = "Submit",
  mode = "director",
}: {
  canSubmit: boolean;
  submitLabel?: string;
  mode?: DirectorFormMode;
}) {
  const isPreview = mode === "admin-preview";
  const { pending } = useFormStatus();

  return (
    <div className="ctd-buttonrow">
      <button
        className="ctd-linkbutton"
        type="submit"
        name="intent"
        value="draft"
        disabled={pending || isPreview}
      >
        {isPreview
          ? "SAVE DRAFT — PREVIEW ONLY"
          : pending
            ? "Saving…"
            : "Save draft"}
      </button>
      {canSubmit ? (
        <button
          className="ctd-submit"
          type="submit"
          name="intent"
          value="submit"
          disabled={pending || isPreview}
        >
          {isPreview
            ? "SUBMIT — PREVIEW ONLY"
            : pending
              ? "Submitting…"
              : submitLabel}
        </button>
      ) : null}
    </div>
  );
}
