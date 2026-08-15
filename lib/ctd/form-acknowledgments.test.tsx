import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
  default: function Script() {
    return null;
  },
}));

import { CtdApplicationForm } from "@/components/ctd/ctd-application-form";
import { AGREEMENTS, AUTHORIZATION_NOTICE } from "@/lib/ctd/fields";

describe("application acknowledgments", () => {
  it("renders exactly three required persisted acknowledgment checkboxes", () => {
    const html = renderToStaticMarkup(
      <CtdApplicationForm minTrainingDate="" recaptchaSiteKey="" />,
    );

    expect(AGREEMENTS).toHaveLength(3);
    expect(html).toContain('name="agreeNotGuaranteed"');
    expect(html).toContain('name="agreeSelectionBasis"');
    expect(html).toContain('name="agreeAccurate"');
    expect(html).not.toContain("agreeNoUnauthorizedEvents");
    expect(html.match(/name="agree[^"]+"/g)).toEqual([
      'name="agreeNotGuaranteed"',
      'name="agreeSelectionBasis"',
      'name="agreeAccurate"',
    ]);
    expect(html).toContain(AUTHORIZATION_NOTICE);
    expect(html).toContain("role=\"note\"");
  });
});
