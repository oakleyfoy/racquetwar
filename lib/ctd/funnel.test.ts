import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { APPLICATION_PATH, PROGRAM_PATH } from "./site";

const ROOT_SOURCE = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
const PROGRAM_SOURCE = readFileSync(
  resolve(process.cwd(), "components/ctd/ctd-program-page.tsx"),
  "utf8",
);
const APPLY_SOURCE = readFileSync(
  resolve(process.cwd(), "app/tournament-director/page.tsx"),
  "utf8",
);
const SUBMIT_SOURCE = readFileSync(
  resolve(process.cwd(), "app/tournament-director/api/submit/route.ts"),
  "utf8",
);

describe("public funnel", () => {
  it("sends the root route to the program page, not the application", () => {
    expect(ROOT_SOURCE).toContain(`redirect("${PROGRAM_PATH}")`);
    expect(ROOT_SOURCE).not.toContain(`redirect("${APPLICATION_PATH}")`);
    expect(ROOT_SOURCE).not.toContain("redirect(\"/tournament-director\")");
  });

  it("does not create a redirect loop", () => {
    expect(PROGRAM_SOURCE).not.toContain("redirect(");
    expect(APPLY_SOURCE).not.toContain("redirect(");
    expect(PROGRAM_SOURCE).toContain(`href={APPLICATION_PATH}`);
    expect(APPLY_SOURCE).toContain(`href={PROGRAM_PATH}`);
  });

  it("leaves the submit API route on the existing path", () => {
    expect(SUBMIT_SOURCE).toContain("export async function POST");
    expect(SUBMIT_SOURCE).toContain("validateApplication");
    expect(SUBMIT_SOURCE).toContain("verifyRecaptcha");
    expect(SUBMIT_SOURCE).toContain("insertApplication");
  });
});
