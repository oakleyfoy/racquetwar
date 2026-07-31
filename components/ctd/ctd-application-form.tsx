"use client";

import Script from "next/script";
import { useRef, useState, type ReactNode } from "react";

import {
  AGREEMENTS,
  BUSINESS_EXPERIENCE_OPTIONS,
  COUNTRIES,
  EMPTY_TERRITORY,
  HOW_HEARD_OPTIONS,
  RECAPTCHA_ACTION,
  SELECTION_NOTICE,
  SKILL_LEVELS,
  SPORTS,
  SPORT_OTHER,
  SUPERVISED_COUNTS,
  TERRITORY_SCOPES,
  TIME_COMMITMENTS,
  TOURNAMENT_EXPERIENCE_NONE,
  TOURNAMENT_EXPERIENCE_OPTIONS,
  UNITED_STATES,
  US_STATES,
  isUnitedStates,
  type CtdApplicationInput,
  type Territory,
  type TerritoryScope,
} from "@/lib/ctd/fields";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}

type FormState = CtdApplicationInput & { company: string };

const INITIAL_STATE: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  mobilePhone: "",
  city: "",
  country: UNITED_STATES,
  state: "",
  region: "",
  zipCode: "",

  primaryTerritory: { ...EMPTY_TERRITORY },
  territoryScope: "",
  additionalTerritories: [],

  sports: [],
  sportOther: "",
  skillLevel: "",
  clubsLeagues: "",

  tournamentExperience: [],
  tournamentExperienceDetail: "",

  employer: "",
  position: "",
  yearsManagementExperience: "",
  industry: "",
  peopleSupervised: "",

  businessExperience: [],

  timeCommitment: "",

  whyCtd: "",
  whySuccessful: "",

  howHeard: "",
  trainingStartDate: "",
  additionalInfo: "",

  agreeNotGuaranteed: false,
  agreeSelectionBasis: false,
  agreeAccurate: false,

  company: "",
};

async function waitForRecaptcha() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    if (window.grecaptcha) return window.grecaptcha;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return null;
}

async function getRecaptchaToken(siteKey: string) {
  const grecaptcha = await waitForRecaptcha();
  if (!grecaptcha) {
    throw new Error(
      "Security verification is still loading. Please wait a moment and try again.",
    );
  }

  return new Promise<string>((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha
        .execute(siteKey, { action: RECAPTCHA_ACTION })
        .then(resolve)
        .catch(() =>
          reject(new Error("Security verification failed. Please try again.")),
        );
    });
  });
}

function Section({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="ctd-section">
      <div className="ctd-section-head">
        <span className="ctd-section-number" aria-hidden="true">
          {number}
        </span>
        <div>
          <h2 className="ctd-section-title">{title}</h2>
          {hint ? <p className="ctd-section-hint">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  span,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  span?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`ctd-field${span ? " ctd-span-2" : ""}`}>
      <label className="ctd-label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="ctd-required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="ctd-hint">{hint}</p> : null}
    </div>
  );
}

function ChoiceGroup({
  legend,
  options,
  columns = 2,
  type,
  name,
  selected,
  onSelect,
  required,
}: {
  legend: string;
  options: readonly { value: string; label: string }[];
  columns?: 1 | 2 | 3;
  type: "checkbox" | "radio";
  name: string;
  selected: string[];
  onSelect: (value: string, checked: boolean) => void;
  required?: boolean;
}) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend className="ctd-label" style={{ marginBottom: 10 }}>
        {legend}
        {required ? (
          <span className="ctd-required" aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>
      <div className={`ctd-choices ctd-choices-${columns}`}>
        {options.map((option) => (
          <label className="ctd-choice" key={option.value}>
            <input
              type={type}
              name={name}
              value={option.value}
              checked={selected.includes(option.value)}
              required={required && type === "radio" && selected.length === 0}
              onChange={(event) => onSelect(option.value, event.target.checked)}
            />
            <span className="ctd-choice-text">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function toOptions(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function TerritoryFields({
  idPrefix,
  value,
  onChange,
  required,
}: {
  idPrefix: string;
  value: Territory;
  onChange: (next: Territory) => void;
  required?: boolean;
}) {
  const usBased = isUnitedStates(value.country);

  return (
    <div className="ctd-grid ctd-grid-3">
      <Field label="Country" htmlFor={`${idPrefix}-country`}>
        <select
          id={`${idPrefix}-country`}
          className="ctd-select"
          value={value.country}
          onChange={(event) =>
            // Clearing state and region prevents a stale value from a previous country.
            onChange({
              ...value,
              country: event.target.value,
              state: "",
              region: "",
            })
          }
        >
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </Field>

      <Field label="City" htmlFor={`${idPrefix}-city`} required={required}>
        <input
          id={`${idPrefix}-city`}
          className="ctd-input"
          type="text"
          value={value.city}
          required={required}
          onChange={(event) => onChange({ ...value, city: event.target.value })}
        />
      </Field>

      {usBased ? (
        <Field label="State" htmlFor={`${idPrefix}-state`} required={required}>
          <select
            id={`${idPrefix}-state`}
            className="ctd-select"
            value={value.state}
            required={required}
            onChange={(event) => onChange({ ...value, state: event.target.value })}
          >
            <option value="">Select a state</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field
          label="State / Province / Region"
          htmlFor={`${idPrefix}-region`}
          required={required}
        >
          <input
            id={`${idPrefix}-region`}
            className="ctd-input"
            type="text"
            value={value.region}
            required={required}
            onChange={(event) =>
              onChange({ ...value, region: event.target.value })
            }
          />
        </Field>
      )}
    </div>
  );
}

export function CtdApplicationForm({
  recaptchaSiteKey,
  minTrainingDate,
}: {
  recaptchaSiteKey: string;
  /** Computed on the server so the rendered markup cannot drift from the client. */
  minTrainingDate: string;
}) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const usBased = isUnitedStates(form.country);

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleInList(
    key: "sports" | "businessExperience",
    value: string,
    checked: boolean,
  ) {
    setForm((current) => {
      const next = checked
        ? [...current[key], value]
        : current[key].filter((entry) => entry !== value);
      return { ...current, [key]: next };
    });
  }

  function toggleTournamentExperience(value: string, checked: boolean) {
    setForm((current) => {
      if (value === TOURNAMENT_EXPERIENCE_NONE) {
        return {
          ...current,
          tournamentExperience: checked ? [TOURNAMENT_EXPERIENCE_NONE] : [],
        };
      }

      const withoutNone = current.tournamentExperience.filter(
        (entry) => entry !== TOURNAMENT_EXPERIENCE_NONE,
      );

      return {
        ...current,
        tournamentExperience: checked
          ? [...withoutNone, value]
          : withoutNone.filter((entry) => entry !== value),
      };
    });
  }

  function setTerritoryScope(value: string) {
    setForm((current) => ({
      ...current,
      territoryScope: value as TerritoryScope,
      additionalTerritories:
        value === "multiple" && current.additionalTerritories.length === 0
          ? [{ ...EMPTY_TERRITORY, country: current.primaryTerritory.country }]
          : value === "multiple"
            ? current.additionalTerritories
            : [],
    }));
  }

  function updateAdditionalTerritory(index: number, next: Territory) {
    setForm((current) => ({
      ...current,
      additionalTerritories: current.additionalTerritories.map((entry, position) =>
        position === index ? next : entry,
      ),
    }));
  }

  function addTerritory() {
    setForm((current) => ({
      ...current,
      additionalTerritories: [
        ...current.additionalTerritories,
        { ...EMPTY_TERRITORY, country: current.primaryTerritory.country },
      ],
    }));
  }

  function removeTerritory(index: number) {
    setForm((current) => ({
      ...current,
      additionalTerritories: current.additionalTerritories.filter(
        (_, position) => position !== index,
      ),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const recaptchaToken = recaptchaSiteKey
        ? await getRecaptchaToken(recaptchaSiteKey)
        : "";

      const response = await fetch("/tournament-director/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, recaptchaToken }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ?? "Something went wrong. Please try again.",
        );
      }

      setSubmitted(true);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.",
      );
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="ctd-card" ref={topRef}>
        <div className="ctd-success">
          <div className="ctd-success-badge" aria-hidden="true">
            ✓
          </div>
          <h2>Application received</h2>
          <p>
            Thank you, {form.firstName}. Your application to become a Founding
            Certified Tournament Director has been submitted and a confirmation
            email is on its way to {form.email}.
          </p>
          <p>
            Our team reviews every application personally and will follow up
            regarding next steps, including interviews and territory
            availability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {recaptchaSiteKey ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
          strategy="lazyOnload"
        />
      ) : null}

      <div className="ctd-card" ref={topRef}>
        <form onSubmit={handleSubmit} noValidate={false}>
          {error ? (
            <div className="ctd-alert" role="alert">
              {error}
            </div>
          ) : null}

          <Section number={1} title="Basic Information">
            <div className="ctd-grid ctd-grid-2">
              <Field label="First Name" htmlFor="firstName" required>
                <input
                  id="firstName"
                  className="ctd-input"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={form.firstName}
                  onChange={(event) => update("firstName", event.target.value)}
                />
              </Field>

              <Field label="Last Name" htmlFor="lastName" required>
                <input
                  id="lastName"
                  className="ctd-input"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={form.lastName}
                  onChange={(event) => update("lastName", event.target.value)}
                />
              </Field>

              <Field label="Email Address" htmlFor="email" required>
                <input
                  id="email"
                  className="ctd-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </Field>

              <Field label="Mobile Phone" htmlFor="mobilePhone" required>
                <input
                  id="mobilePhone"
                  className="ctd-input"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={form.mobilePhone}
                  onChange={(event) => update("mobilePhone", event.target.value)}
                />
              </Field>

              <Field label="Country" htmlFor="country" required>
                <select
                  id="country"
                  className="ctd-select"
                  value={form.country}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      country: event.target.value,
                      state: "",
                      region: "",
                    }))
                  }
                >
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="City" htmlFor="city" required>
                <input
                  id="city"
                  className="ctd-input"
                  type="text"
                  autoComplete="address-level2"
                  required
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                />
              </Field>

              {usBased ? (
                <Field label="State" htmlFor="state" required>
                  <select
                    id="state"
                    className="ctd-select"
                    required
                    value={form.state}
                    onChange={(event) => update("state", event.target.value)}
                  >
                    <option value="">Select a state</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field
                  label="State / Province / Region"
                  htmlFor="region"
                  required
                >
                  <input
                    id="region"
                    className="ctd-input"
                    type="text"
                    required
                    value={form.region}
                    onChange={(event) => update("region", event.target.value)}
                  />
                </Field>
              )}

              <Field
                label={usBased ? "ZIP Code" : "Postal Code"}
                htmlFor="zipCode"
                required
              >
                <input
                  id="zipCode"
                  className="ctd-input"
                  type="text"
                  autoComplete="postal-code"
                  required
                  value={form.zipCode}
                  onChange={(event) => update("zipCode", event.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section
            number={2}
            title="Territory Interest"
            hint="Tell us where you would like to launch and grow Racquet War events."
          >
            <TerritoryFields
              idPrefix="territory"
              value={form.primaryTerritory}
              onChange={(next) => update("primaryTerritory", next)}
              required
            />

            <div style={{ marginTop: 24 }}>
              <ChoiceGroup
                legend="Are you interested in managing:"
                type="radio"
                name="territoryScope"
                columns={3}
                required
                options={TERRITORY_SCOPES.map((scope) => ({
                  value: scope.value,
                  label: scope.label,
                }))}
                selected={form.territoryScope ? [form.territoryScope] : []}
                onSelect={(value, checked) => {
                  if (checked) setTerritoryScope(value);
                }}
              />
            </div>

            {form.territoryScope === "multiple" ? (
              <div style={{ marginTop: 20 }}>
                <p className="ctd-label" style={{ marginBottom: 10 }}>
                  Additional territories
                </p>
                {form.additionalTerritories.map((territory, index) => (
                  <div className="ctd-territory" key={index}>
                    <div className="ctd-territory-head">
                      <span className="ctd-territory-label">
                        Territory {index + 2}
                      </span>
                      <button
                        type="button"
                        className="ctd-linkbutton"
                        onClick={() => removeTerritory(index)}
                      >
                        Remove
                      </button>
                    </div>
                    <TerritoryFields
                      idPrefix={`additional-${index}`}
                      value={territory}
                      onChange={(next) => updateAdditionalTerritory(index, next)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="ctd-addbutton"
                  onClick={addTerritory}
                >
                  + Add another territory
                </button>
              </div>
            ) : null}
          </Section>

          <Section number={3} title="Racquet Sports Experience">
            <ChoiceGroup
              legend="Which sports do you actively participate in?"
              type="checkbox"
              name="sports"
              columns={3}
              options={toOptions(SPORTS)}
              selected={form.sports}
              onSelect={(value, checked) =>
                toggleInList("sports", value, checked)
              }
            />

            <div className="ctd-grid ctd-grid-2" style={{ marginTop: 20 }}>
              {form.sports.includes(SPORT_OTHER) ? (
                <Field label="Which other sport?" htmlFor="sportOther">
                  <input
                    id="sportOther"
                    className="ctd-input"
                    type="text"
                    value={form.sportOther}
                    onChange={(event) =>
                      update("sportOther", event.target.value)
                    }
                  />
                </Field>
              ) : null}

              <Field label="Skill level" htmlFor="skillLevel">
                <select
                  id="skillLevel"
                  className="ctd-select"
                  value={form.skillLevel}
                  onChange={(event) => update("skillLevel", event.target.value)}
                >
                  <option value="">Select a skill level</option>
                  {SKILL_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Are you currently involved with any clubs or leagues?"
                htmlFor="clubsLeagues"
                span
              >
                <textarea
                  id="clubsLeagues"
                  className="ctd-textarea"
                  value={form.clubsLeagues}
                  onChange={(event) =>
                    update("clubsLeagues", event.target.value)
                  }
                />
              </Field>
            </div>
          </Section>

          <Section number={4} title="Tournament Experience">
            <ChoiceGroup
              legend="Have you ever:"
              type="checkbox"
              name="tournamentExperience"
              columns={2}
              options={toOptions(TOURNAMENT_EXPERIENCE_OPTIONS)}
              selected={form.tournamentExperience}
              onSelect={toggleTournamentExperience}
            />

            <div className="ctd-grid" style={{ marginTop: 20 }}>
              <Field
                label="Describe your experience."
                htmlFor="tournamentExperienceDetail"
              >
                <textarea
                  id="tournamentExperienceDetail"
                  className="ctd-textarea"
                  value={form.tournamentExperienceDetail}
                  onChange={(event) =>
                    update("tournamentExperienceDetail", event.target.value)
                  }
                />
              </Field>
            </div>
          </Section>

          <Section number={5} title="Professional Background">
            <div className="ctd-grid ctd-grid-2">
              <Field label="Current Employer" htmlFor="employer">
                <input
                  id="employer"
                  className="ctd-input"
                  type="text"
                  autoComplete="organization"
                  value={form.employer}
                  onChange={(event) => update("employer", event.target.value)}
                />
              </Field>

              <Field label="Current Position" htmlFor="position">
                <input
                  id="position"
                  className="ctd-input"
                  type="text"
                  autoComplete="organization-title"
                  value={form.position}
                  onChange={(event) => update("position", event.target.value)}
                />
              </Field>

              <Field
                label="Years of Management Experience"
                htmlFor="yearsManagementExperience"
              >
                <input
                  id="yearsManagementExperience"
                  className="ctd-input"
                  type="number"
                  min="0"
                  max="70"
                  value={form.yearsManagementExperience}
                  onChange={(event) =>
                    update("yearsManagementExperience", event.target.value)
                  }
                />
              </Field>

              <Field label="Industry" htmlFor="industry">
                <input
                  id="industry"
                  className="ctd-input"
                  type="text"
                  value={form.industry}
                  onChange={(event) => update("industry", event.target.value)}
                />
              </Field>

              <Field
                label="How many people have you supervised?"
                htmlFor="peopleSupervised"
              >
                <select
                  id="peopleSupervised"
                  className="ctd-select"
                  value={form.peopleSupervised}
                  onChange={(event) =>
                    update("peopleSupervised", event.target.value)
                  }
                >
                  <option value="">Select a range</option>
                  {SUPERVISED_COUNTS.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section number={6} title="Business Experience">
            <ChoiceGroup
              legend="Have you ever:"
              type="checkbox"
              name="businessExperience"
              columns={2}
              options={toOptions(BUSINESS_EXPERIENCE_OPTIONS)}
              selected={form.businessExperience}
              onSelect={(value, checked) =>
                toggleInList("businessExperience", value, checked)
              }
            />
          </Section>

          <Section number={7} title="Time Commitment">
            <ChoiceGroup
              legend="How much time can you realistically dedicate?"
              type="radio"
              name="timeCommitment"
              columns={2}
              options={toOptions(TIME_COMMITMENTS)}
              selected={form.timeCommitment ? [form.timeCommitment] : []}
              onSelect={(value, checked) => {
                if (checked) update("timeCommitment", value);
              }}
            />
          </Section>

          <Section number={8} title="Why Racquet War?">
            <div className="ctd-grid">
              <Field
                label="Why do you want to become a Certified Tournament Director?"
                htmlFor="whyCtd"
              >
                <textarea
                  id="whyCtd"
                  className="ctd-textarea"
                  value={form.whyCtd}
                  onChange={(event) => update("whyCtd", event.target.value)}
                />
              </Field>

              <Field
                label="Why do you believe you would be successful?"
                htmlFor="whySuccessful"
              >
                <textarea
                  id="whySuccessful"
                  className="ctd-textarea"
                  value={form.whySuccessful}
                  onChange={(event) =>
                    update("whySuccessful", event.target.value)
                  }
                />
              </Field>
            </div>
          </Section>

          <Section number={9} title="Final Questions">
            <div className="ctd-grid ctd-grid-2">
              <Field label="How did you hear about RW?" htmlFor="howHeard">
                <select
                  id="howHeard"
                  className="ctd-select"
                  value={form.howHeard}
                  onChange={(event) => update("howHeard", event.target.value)}
                >
                  <option value="">Select an option</option>
                  {HOW_HEARD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="When could you begin training?"
                htmlFor="trainingStartDate"
              >
                <input
                  id="trainingStartDate"
                  className="ctd-input"
                  type="date"
                  min={minTrainingDate || undefined}
                  value={form.trainingStartDate}
                  onChange={(event) =>
                    update("trainingStartDate", event.target.value)
                  }
                />
              </Field>

              <Field
                label="Anything else you'd like us to know?"
                htmlFor="additionalInfo"
                span
              >
                <textarea
                  id="additionalInfo"
                  className="ctd-textarea"
                  value={form.additionalInfo}
                  onChange={(event) =>
                    update("additionalInfo", event.target.value)
                  }
                />
              </Field>
            </div>
          </Section>

          <Section number={10} title="Agreement">
            <div className="ctd-notice">{SELECTION_NOTICE}</div>

            <div className="ctd-choices">
              {AGREEMENTS.map((agreement) => (
                <label className="ctd-choice" key={agreement.name}>
                  <input
                    type="checkbox"
                    name={agreement.name}
                    required
                    checked={form[agreement.name]}
                    onChange={(event) =>
                      update(agreement.name, event.target.checked)
                    }
                  />
                  <span className="ctd-choice-text">{agreement.label}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* Honeypot: hidden from people, commonly auto-filled by bots. */}
          <div className="ctd-hp" aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input
              id="company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={(event) => update("company", event.target.value)}
            />
          </div>

          <div className="ctd-submitrow">
            <button className="ctd-submit" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
            <p className="ctd-fineprint">
              Fields marked with an asterisk are required. Your information is
              sent directly to the Racquet War team and is never sold or shared.
              {recaptchaSiteKey
                ? " This form is protected by reCAPTCHA, and the Google Privacy Policy and Terms of Service apply."
                : null}
            </p>
          </div>
        </form>
      </div>
    </>
  );
}
