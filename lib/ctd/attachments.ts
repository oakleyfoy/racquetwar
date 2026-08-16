const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED = [
  {
    mime: "application/pdf",
    extensions: ["pdf"],
    magic: [[0x25, 0x50, 0x44, 0x46]],
  },
  {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: ["docx"],
    magic: [[0x50, 0x4b, 0x03, 0x04]],
  },
  {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: ["xlsx"],
    magic: [[0x50, 0x4b, 0x03, 0x04]],
  },
  {
    mime: "image/jpeg",
    extensions: ["jpg", "jpeg"],
    magic: [[0xff, 0xd8, 0xff]],
  },
  {
    mime: "image/png",
    extensions: ["png"],
    magic: [[0x89, 0x50, 0x4e, 0x47]],
  },
] as const;

export const ATTACHMENT_MAX_BYTES = MAX_BYTES;
export const ATTACHMENT_ACCEPT = ".pdf,.docx,.xlsx,.jpg,.jpeg,.png";

function extensionOf(name: string) {
  const trimmed = name.trim().toLowerCase();
  const index = trimmed.lastIndexOf(".");
  return index >= 0 ? trimmed.slice(index + 1) : "";
}

export function sanitizeFilename(name: string) {
  const base = name.replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, " ").trim();
  return (base || "attachment").slice(0, 180);
}

function matchesMagic(bytes: Uint8Array, expected: readonly number[]) {
  return expected.every((value, index) => bytes[index] === value);
}

export function validateAttachment(file: {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
}) {
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("That file is empty or larger than the 8 MB limit.");
  }

  const extension = extensionOf(file.name);
  const allowed = ALLOWED.find((entry) =>
    (entry.extensions as readonly string[]).includes(extension),
  );
  if (!allowed) {
    throw new Error("Upload a PDF, DOCX, XLSX, JPG, or PNG file.");
  }

  const declared = file.type.toLowerCase();
  if (declared && declared !== allowed.mime && declared !== "application/octet-stream") {
    throw new Error("The file type does not match the file extension.");
  }

  if (!allowed.magic.some((signature) => matchesMagic(file.bytes, signature))) {
    throw new Error("The file contents do not match the expected file type.");
  }

  return {
    originalName: sanitizeFilename(file.name),
    mimeType: allowed.mime,
    sizeBytes: file.size,
  };
}

export async function readFormFile(file: File | null) {
  if (!file || file.size === 0) return null;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const meta = validateAttachment({
    name: file.name,
    type: file.type,
    size: file.size,
    bytes: buffer,
  });
  return { ...meta, bytes: buffer };
}
