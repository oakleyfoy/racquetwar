import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BrandIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M4 7.5 12 4l8 3.5v6.2c0 4.1-3.4 6.8-8 8.3-4.6-1.5-8-4.2-8-8.3V7.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 12.2 11 14.7l4.8-5.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function TrainingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M3.5 10.2 12 6l8.5 4.2L12 14.4 3.5 10.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M7 12.4v3.3c0 .8 2.2 2.3 5 2.3s5-1.5 5-2.3v-3.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M20.5 10.4v5.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function SoftwareIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect
        height="12.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="16"
        x="4"
        y="4.5"
      />
      <path
        d="M8 20.5h8M12 17v3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function RegistrationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M8 4.8h8.2A2.3 2.3 0 0 1 18.5 7.1v12.1A2.3 2.3 0 0 1 16.2 21.5H7.8A2.3 2.3 0 0 1 5.5 19.2V7.1A2.3 2.3 0 0 1 7.8 4.8H8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 4.8V3.6A1.1 1.1 0 0 1 10.1 2.5h3.8A1.1 1.1 0 0 1 15 3.6v1.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.8 11.2h6.4M8.8 14.8h4.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function MarketingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M4.5 10.2v3.6c0 .7.6 1.3 1.3 1.3H8l5.2 3.4V5.5L8 8.9H5.8c-.7 0-1.3.6-1.3 1.3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M16.6 9.2a3.4 3.4 0 0 1 0 5.6M18.8 7.2a6.2 6.2 0 0 1 0 9.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function PlanningIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect
        height="14.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="15"
        x="4.5"
        y="5.5"
      />
      <path
        d="M8 3.8v3.2M16 3.8v3.2M4.5 10.2h15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function PilotIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M6 20.2h12M8.2 20.2 12 4.8l3.8 15.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.4 13.6h5.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

export function TerritoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M12 21s6.5-5.2 6.5-10.1A6.5 6.5 0 0 0 5.5 10.9C5.5 15.8 12 21 12 21Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10.6" r="2.1" stroke="currentColor" strokeWidth="1.8" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.4 12.2 11 14.8l4.7-5.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}
