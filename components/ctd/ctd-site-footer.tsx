import {
  BRAND_NAME,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  OPERATOR_NAME,
} from "@/lib/ctd/site";

export function CtdSiteFooter() {
  return (
    <footer className="ctd-pagefooter">
      <p>Questions about the program?</p>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <span className="ctd-footer-sep" aria-hidden="true">
          {" "}
          ·{" "}
        </span>
        <a href={`tel:${CONTACT_PHONE_TEL}`}>{CONTACT_PHONE}</a>
      </p>
      <p>
        {OPERATOR_NAME} | {BRAND_NAME}
      </p>
    </footer>
  );
}
