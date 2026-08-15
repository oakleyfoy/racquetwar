"use client";

export function AdminConfirmForm({
  action,
  confirmMessage,
  confirmIntent,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage?: string;
  confirmIntent?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent)
          .submitter as HTMLButtonElement | null;
        const intent = submitter?.getAttribute("value") ?? "";
        const shouldConfirm = confirmIntent
          ? intent === confirmIntent
          : Boolean(confirmMessage);

        if (!shouldConfirm || !confirmMessage) return;

        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }

        const form = event.currentTarget;
        let confirmed = form.querySelector<HTMLInputElement>(
          'input[name="confirmed"]',
        );
        if (!confirmed) {
          confirmed = document.createElement("input");
          confirmed.type = "hidden";
          confirmed.name = "confirmed";
          form.appendChild(confirmed);
        }
        confirmed.value = "1";
      }}
    >
      {children}
    </form>
  );
}
