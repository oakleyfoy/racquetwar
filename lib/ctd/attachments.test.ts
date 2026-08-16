import { describe, expect, it } from "vitest";

import { sanitizeFilename, validateAttachment } from "./attachments";

function pdfBytes() {
  return new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
}

describe("attachment validation", () => {
  it("accepts a PDF whose extension, MIME type, and signature match", () => {
    const result = validateAttachment({
      name: "quote.pdf",
      type: "application/pdf",
      size: 8,
      bytes: pdfBytes(),
    });
    expect(result.mimeType).toBe("application/pdf");
    expect(result.originalName).toBe("quote.pdf");
  });

  it("rejects disallowed types and mismatched signatures", () => {
    expect(() =>
      validateAttachment({
        name: "note.exe",
        type: "application/octet-stream",
        size: 4,
        bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
      }),
    ).toThrow(/PDF, DOCX, XLSX, JPG, or PNG/);

    expect(() =>
      validateAttachment({
        name: "quote.pdf",
        type: "application/pdf",
        size: 4,
        bytes: new Uint8Array([0x00, 0x00, 0x00, 0x00]),
      }),
    ).toThrow(/contents do not match/);
  });

  it("rejects oversized files and sanitizes names", () => {
    expect(() =>
      validateAttachment({
        name: "big.pdf",
        type: "application/pdf",
        size: 9 * 1024 * 1024,
        bytes: pdfBytes(),
      }),
    ).toThrow(/8 MB/);
    expect(sanitizeFilename("../../secret.pdf")).toBe("..-..-secret.pdf");
  });
});
