import {
  BrandIcon,
  MarketingIcon,
  PilotIcon,
  PlanningIcon,
  RegistrationIcon,
  SoftwareIcon,
  TerritoryIcon,
  TrainingIcon,
} from "@/components/ctd/ctd-icons";
import type { AccordionItem } from "@/components/ctd/ctd-accordion";

export const PROGRAM_HERO = {
  eyebrow: "NATIONAL PROGRAM",
  title: "Bring Racquet War to Your Market",
  paragraphs: [
    "War Tournaments LLC is selecting an initial national group of 5–8 candidates for the RW Certified Tournament Director Program.",
    "This program is designed for experienced, community-minded racquet-sports leaders who want to develop and operate professionally supported Racquet War events in their local markets.",
  ],
  badges: [
    "Initial group of 5–8 candidates",
    "National training and support",
    "Potential protected ZIP-code territory",
  ],
} as const;

export const PROGRAM_INTRO = {
  heading: "Build Exceptional Events With National Support",
  paragraphs: [
    "Certified Tournament Directors combine their local relationships and market knowledge with the RW brand, event system and national support provided by War Tournaments.",
    "The opportunity is designed for people who can build excitement locally, recruit players, work professionally with clubs and facilities, and deliver a consistent Racquet War player experience.",
  ],
  note: "The RW Certified Tournament Director Program is an independent-contractor program. It is not employment, a franchise sale or immediate authorization to operate Racquet War events.",
} as const;

export const PROGRAM_SUPPORT = {
  heading: "What War Tournaments Provides",
  cards: [
    {
      title: "RW Brand and Event System",
      body: "Operate approved events using the Racquet War name, event format and player-experience standards.",
      icon: BrandIcon,
    },
    {
      title: "Tournament Director Training",
      body: "Receive structured training covering event planning, facilities, budgeting, registration, player communication, scheduling, sponsorships, event-day operations and closeout.",
      icon: TrainingIcon,
    },
    {
      title: "Tournament Software",
      body: "Use RW’s tournament-management system and operating tools for approved events.",
      icon: SoftwareIcon,
    },
    {
      title: "Registration Support",
      body: "War Tournaments supports registration setup, player processing and approved event administration.",
      icon: RegistrationIcon,
    },
    {
      title: "National Marketing Support",
      body: "Approved events may be promoted through Racquet War’s national website, email audience and marketing channels.",
      icon: MarketingIcon,
    },
    {
      title: "Event-Planning Guidance",
      body: "Receive support before, during and after each approved event, including planning timelines, budget review, facility coordination and closeout.",
      icon: PlanningIcon,
    },
    {
      title: "Pilot Event Process",
      body: "Every candidate must complete an approved Pilot Event and evaluation before a certification decision is made.",
      icon: PilotIcon,
    },
    {
      title: "Potential Protected Territory",
      body: "Certification may include an assigned, potentially protected territory defined by specific ZIP codes.",
      icon: TerritoryIcon,
    },
  ],
} as const;

export const PROGRAM_CANDIDATES = {
  heading: "Who We Are Looking For",
  intro:
    "The strongest candidates will have several of the following qualifications. A person does not need to meet every qualification to apply.",
  qualifications: [
    "Tennis, pickleball, padel or other racquet-sports experience",
    "Tournament, league, club or event-management experience",
    "Relationships with local players, clubs or facilities",
    "The ability to recruit players and develop a local market",
    "Strong communication and organizational skills",
    "Weekend availability",
    "Reliable follow-through",
    "A professional and entrepreneurial approach",
    "Willingness to follow RW brand, budget and event standards",
    "The ability to complete training and operate within the War Tournaments system",
  ],
  panel:
    "War Tournaments evaluates each candidate’s experience, market, relationships, availability and overall fit.",
} as const;

export const PROGRAM_RESPONSIBILITIES = {
  heading: "What Tournament Directors Lead",
  items: [
    "Develop relationships with local clubs and facilities",
    "Help identify strong event locations",
    "Recruit and communicate with local players",
    "Follow the approved event plan and budget",
    "Operate events according to RW standards",
    "Deliver the required player experience",
    "Protect the Racquet War brand",
    "Complete required event documentation and closeout",
    "Communicate consistently with War Tournaments",
  ],
  warning:
    "Candidates may not announce, advertise, schedule, collect money for or operate a Racquet War event until War Tournaments provides written authorization.",
} as const;

export const PROGRAM_PATH = {
  heading: "The Path to Certification",
  steps: [
    {
      label: "EXPRESS INTEREST",
      body: "Review the program and complete the online application.",
    },
    {
      label: "REVIEW AND SCREENING",
      body: "Oakley Foy personally reviews the application and contacts individuals who appear to be a strong potential fit.",
    },
    {
      label: "ONBOARDING AND TRAINING",
      body: "Approved candidates complete required agreements, secure W-9 processing, program policies and Tournament Director training.",
    },
    {
      label: "PILOT EVENT AND EVALUATION",
      body: "The candidate develops and operates an approved Pilot Event with support and evaluation from War Tournaments.",
    },
    {
      label: "CERTIFICATION DECISION",
      body: "After the Pilot Event, War Tournaments evaluates the candidate, event and market. Certification may be approved, conditionally approved, deferred or denied.",
    },
  ],
} as const;

export const PROGRAM_COMPENSATION = {
  heading: "How the Opportunity Works",
  cards: [
    {
      title: "Pilot Event",
      paragraphs: [
        "Pilot candidates receive $10 for each eligible Pilot Event player, whether or not certification is later granted.",
        "War Tournaments absorbs approved Pilot operating costs and approved ordinary deficits. Unauthorized expenses, misconduct and candidate-caused losses are excluded.",
        "Travel, lodging, meals and personal expenses are not reimbursed unless approved in writing in advance.",
      ],
    },
    {
      title: "After Certification",
      paragraphs: [
        "For approved Certified Events, War Tournaments retains a $35 program fee for each eligible paid player. Approved actual event expenses and permitted adjustments are then deducted.",
        "The Tournament Director receives 100% of the remaining approved event proceeds.",
        "Approved cash and in-kind sponsorship value is generally allocated 25% to War Tournaments and 75% to the Tournament Director.",
      ],
    },
  ],
  disclaimer:
    "Compensation depends on actual registration revenue, approved expenses, sponsorships, refunds, adjustments and event performance. No specific income, profit or number of events is guaranteed.",
} as const;

export const PROGRAM_TERRITORY = {
  heading: "Potential Protected ZIP-Code Territory",
  paragraphs: [
    "A Certified Tournament Director may receive a conditionally protected territory consisting of specifically assigned ZIP codes.",
    "While territory protection remains active, another local Tournament Director generally will not be authorized inside the protected ZIP codes. War Tournaments retains the right to operate corporate events in any market.",
  ],
  conditions: [
    "Territory requires certification and written approval",
    "Territory consists of specifically identified ZIP codes",
    "Territory is subject to availability and overlap review",
    "Protection depends on continued certification and compliance",
    "Directors are expected to complete at least three approved Certified Events during each 12-month certification period",
    "The Pilot Event does not count toward the three-event requirement",
    "Territory may be modified, reduced or reassigned based on activity and performance",
    "Territory does not give a Director ownership of players, clubs, facilities, customers or markets",
  ],
  highlight:
    "Territory is a potential benefit of certification—not a guaranteed result of applying or becoming a candidate.",
} as const;

export const PROGRAM_FAQS: AccordionItem[] = [
  {
    question: "Is this a job with War Tournaments?",
    answer:
      "No. Certified Tournament Directors operate as independent contractors under the approved program agreements and individual event authorizations.",
  },
  {
    question: "Am I certified after submitting the application?",
    answer:
      "No. The application begins the review process. Certification requires application approval, onboarding, agreements, training, a Pilot Event and a formal certification decision.",
  },
  {
    question: "Is certification guaranteed?",
    answer:
      "No. Certification may be approved, conditionally approved, deferred or denied after the Pilot Event and evaluation.",
  },
  {
    question: "Is territory guaranteed?",
    answer:
      "No. Territory may be granted only after certification through a written notice identifying the approved ZIP codes.",
  },
  {
    question: "Can I begin promoting a Racquet War event immediately?",
    answer:
      "No. No candidate or Director may announce, advertise, register players for or operate an RW event without written authorization from War Tournaments.",
  },
  {
    question: "Who reviews my application?",
    answer:
      "Oakley Foy personally manages candidate communication and the initial review process.",
  },
  {
    question: "What happens after I apply?",
    answer:
      "War Tournaments reviews your experience, location, relationships and availability. Oakley contacts the individuals who appear to be the strongest potential fit.",
  },
];

export const PROGRAM_FINAL_CTA = {
  heading: "Ready to Bring Racquet War to Your Market?",
  body: "If you believe you could build and lead successful Racquet War events in your area, we want to hear from you.",
  disclaimer:
    "The RW Certified Tournament Director Program is administered by War Tournaments LLC, d/b/a Racquet War. The RACQUET WAR name and marks are owned by War Group LLC. Applying or becoming a candidate does not guarantee acceptance, certification, events, earnings, profit or territory. All event and territory rights require written authorization.",
} as const;
