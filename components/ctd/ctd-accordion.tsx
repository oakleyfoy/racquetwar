"use client";

import { useId, useState } from "react";

export type AccordionItem = {
  question: string;
  answer: string;
};

export function CtdAccordion({ items }: { items: readonly AccordionItem[] }) {
  const baseId = useId();
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  return (
    <div className="ctd-accordion">
      {items.map((item, index) => {
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;
        const open = Boolean(openItems[index]);

        return (
          <div className="ctd-accordion-item" key={item.question}>
            <h3 className="ctd-accordion-heading">
              <button
                aria-controls={panelId}
                aria-expanded={open}
                className="ctd-accordion-trigger"
                id={buttonId}
                onClick={() =>
                  setOpenItems((current) => ({
                    ...current,
                    [index]: !current[index],
                  }))
                }
                type="button"
              >
                <span>{item.question}</span>
                <span aria-hidden="true" className="ctd-accordion-icon">
                  {open ? "–" : "+"}
                </span>
              </button>
            </h3>
            <div
              className="ctd-accordion-panel"
              hidden={!open}
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
