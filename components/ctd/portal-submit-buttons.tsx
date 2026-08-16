"use client";

import { useFormStatus } from "react-dom";

export function PortalSubmitButtons({
  canSubmit,
  submitLabel = "Submit",
}: {
  canSubmit: boolean;
  submitLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="ctd-buttonrow">
      <button
        className="ctd-linkbutton"
        type="submit"
        name="intent"
        value="draft"
        disabled={pending}
      >
        {pending ? "Saving…" : "Save draft"}
      </button>
      {canSubmit ? (
        <button
          className="ctd-submit"
          type="submit"
          name="intent"
          value="submit"
          disabled={pending}
        >
          {pending ? "Submitting…" : submitLabel}
        </button>
      ) : null}
    </div>
  );
}
