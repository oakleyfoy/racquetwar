"use client";

export function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return (
    <button className="ctd-submit" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
