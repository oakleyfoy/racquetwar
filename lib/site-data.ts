export type EventItem = {
  slug: string;
  title: string;
  dateLabel: string;
  location: string;
  resort: string;
  imageSrc: string;
  imageAlt: string;
  level: string;
  format: string;
  overview: string;
  status: string;
  style: string;
  lodging: string;
  support: string;
  highlights: string[];
  schedule: {
    day: string;
    details: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  registrationLabel: string;
  registrationHref: string;
  drawsHref: string;
  imageLabel: string;
};

export type VideoTip = {
  title: string;
  category: string;
  description: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  focus: string;
};

export const siteStats = [
  { label: "Returning players", value: "40%" },
  { label: "New players", value: "60%" },
  { label: "Levels", value: "2.5-5.0" },
  { label: "Minimum matches", value: "4+" },
];

export const featuredEvents: EventItem[] = [
  {
    slug: "amelia-island-classic",
    title: "Amelia Island Classic",
    dateLabel: "October 17-20, 2026",
    location: "Amelia Island, Florida",
    resort: "Host club and hotel partner",
    imageSrc: "/images/hero-tennis.svg",
    imageAlt: "Illustrated tennis match scene for Amelia Island Classic",
    level: "Women’s and mixed doubles, 2.5-5.0",
    format: "Waterfall format with meaningful matches all weekend",
    status: "Registration open",
    style: "Balanced tournament weekend",
    lodging: "Stay at the hotel partner or register as a local player.",
    support: "Best for players who want clear structure, easy logistics, and a polished club setting.",
    overview:
      "A polished tournament weekend built for players who want organized competition, easy logistics, and a fun social scene after the matches.",
    highlights: [
      "Friday through Sunday match play",
      "Hotel package or local-player entry options",
      "Simple schedule, quick access to draws, and helpful support",
    ],
    schedule: [
      { day: "Thursday", details: "Recommended arrival night for players staying on site or coming in from out of town." },
      { day: "Friday", details: "Opening rounds begin in the morning with clear court assignments and easy check-in." },
      { day: "Saturday", details: "Main draw play continues with social time built into the evening." },
      { day: "Sunday", details: "Semifinals, finals, and departure-friendly wrap-up." },
    ],
    faqs: [
      {
        question: "Do I need to stay on property?",
        answer: "No. Local players can enter without booking accommodations, while out-of-town players can choose the hotel package.",
      },
      {
        question: "Who is this event best for?",
        answer: "Players who want a polished balance of strong tennis, manageable scheduling, and an easy weekend setup.",
      },
    ],
    registrationLabel: "Register for Amelia Island",
    registrationHref: "/register?event=amelia-island-classic",
    drawsHref: "/draws-results#amelia-island-classic",
    imageLabel: "Oceanfront tennis weekend",
  },
  {
    slug: "palm-springs-showdown",
    title: "Palm Springs Showdown",
    dateLabel: "November 13-16, 2026",
    location: "Palm Springs, California",
    resort: "Host tennis club and hotel partner",
    imageSrc: "/images/event-crowd.svg",
    imageAlt: "Illustrated tournament crowd and court scene for Palm Springs Showdown",
    level: "Competitive and social doubles divisions",
    format: "Fast-moving draw with guaranteed play and social events",
    status: "Featured event",
    style: "More competitive energy",
    lodging: "Hotel stay options designed for long-weekend players and groups traveling together.",
    support: "Best for players who want a sharper tournament feel with a social weekend still built in.",
    overview:
      "Designed for players who like a stronger competitive feel without losing the Racquet War weekend energy and community feel.",
    highlights: [
      "Premium desert setting",
      "Well-spaced match blocks",
      "Easy draw and results access from one page",
    ],
    schedule: [
      { day: "Thursday", details: "Arrival window and optional early meet-up for players staying nearby." },
      { day: "Friday", details: "Tournament play begins early with clear draw posting and support at check-in." },
      { day: "Saturday", details: "Competitive rounds continue with evening social programming." },
      { day: "Sunday", details: "Final rounds plus departures." },
    ],
    faqs: [
      {
        question: "Is this one better for serious players?",
        answer: "Yes, this weekend leans a bit more competitive while still staying welcoming and social.",
      },
      {
        question: "Will draws be easy to access?",
        answer: "Yes. The redesign keeps event details, schedule, and draws close together so repeat players can move fast.",
      },
    ],
    registrationLabel: "Register for Palm Springs",
    registrationHref: "/register?event=palm-springs-showdown",
    drawsHref: "/draws-results#palm-springs-showdown",
    imageLabel: "Desert club match play",
  },
  {
    slug: "hilton-head-winter-classic",
    title: "Hilton Head Winter Classic",
    dateLabel: "January 22-25, 2027",
    location: "Hilton Head, South Carolina",
    resort: "Host tennis club and hotel partner",
    imageSrc: "/images/community-tennis.svg",
    imageAlt: "Illustrated community tennis weekend scene for Hilton Head Winter Classic",
    level: "Fun-first and competitive-minded players",
    format: "Tournament weekend with structured social programming",
    status: "Coming soon",
    style: "Social tournament weekend",
    lodging: "Stay packages are meant to keep the weekend simple for players traveling in.",
    support: "Best for players who want a friendly atmosphere without losing the tournament structure.",
    overview:
      "A winter tournament weekend where players can compete during the day and enjoy an easy social schedule with friends at night.",
    highlights: [
      "Simple long-weekend planning",
      "Organized club and hotel coordination",
      "Built for both serious and social players",
    ],
    schedule: [
      { day: "Thursday", details: "Travel and arrival day with simple hotel check-in guidance." },
      { day: "Friday", details: "Tournament start plus a welcome mixer for players." },
      { day: "Saturday", details: "Main competition and relaxed evening social events." },
      { day: "Sunday", details: "Closing rounds and departure support." },
    ],
    faqs: [
      {
        question: "Is this a more social event?",
        answer: "It keeps real tournament structure but leans a little more social than the more competitive weekends.",
      },
      {
        question: "Can competitive players still enjoy it?",
        answer: "Yes. The goal is still to give players meaningful matches while keeping the atmosphere welcoming.",
      },
    ],
    registrationLabel: "Register for Hilton Head",
    registrationHref: "/register?event=hilton-head-winter-classic",
    drawsHref: "/draws-results#hilton-head-winter-classic",
    imageLabel: "Coastal winter tournament",
  },
];

export const valueProps = [
  {
    title: "Competition for All Levels",
    body:
      "All levels from 2.5-5.0 can participate. Enjoy the perfect environment, whether you're interested in the highest competition, or just looking for a great time!",
  },
  {
    title: "Exclusive Resorts & Destinations",
    body:
      "You'll get great rates at amazing resorts and destinations - a perfect setting for a tennis weekend getaway.",
  },
  {
    title: "Efficient, Organized & Available",
    body:
      "We're always available to answer your questions or help you get registered. Tournaments always run on time.",
  },
  {
    title: "Fun, Friendly & Exciting",
    body:
      "Win or Lose, you will be planning your next Racquet War Event!",
  },
];

export const howItWorks = [
  {
    step: "1",
    title: "Pick the right event",
    body:
      "Browse events by location, date, and playing style so you can quickly decide whether you want a more competitive weekend or a more social one.",
  },
  {
    step: "2",
    title: "See the details clearly",
    body:
      "Each event page should show the format, skill levels, venue details, schedule snapshot, FAQs, registration link, and draw access in one place.",
  },
  {
    step: "3",
    title: "Play, enjoy, repeat",
    body:
      "Once players know what to expect, Racquet War becomes easy to trust, easy to return to, and easy to recommend to friends.",
  },
];

export const videosAndTips: VideoTip[] = [
  {
    title: "How the Waterfall format works",
    category: "Format video",
    description:
      "A simple explainer showing why players get plenty of meaningful tennis without the weekend feeling overwhelming.",
  },
  {
    title: "What to expect from a Racquet War weekend",
    category: "Event prep",
    description:
      "A short walkthrough covering arrival timing, match flow, social events, and what players should pack for the trip.",
  },
  {
    title: "Choosing the right event for your game",
    category: "Player guide",
    description:
      "Help players decide between a more competitive event, a more social event, or something balanced in the middle.",
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "It felt organized enough for the serious players and fun enough that our whole group wanted to book the next one before we even left.",
    name: "Karen M.",
    focus: "Returning doubles player",
  },
  {
    quote:
      "The best part was knowing where to be, when to play, and how everything worked without chasing people down for answers.",
    name: "Lisa T.",
    focus: "First-time event player",
  },
  {
    quote:
      "You still get the fun-weekend feel, but the tennis side is run well enough that it feels worth it from a competition standpoint too.",
    name: "David R.",
    focus: "Competitive weekend player",
  },
];

export const faqs = [
  {
    question: "Do I have to stay on resort/property to play in the tournament?",
    answer:
      "No, we have plenty of local players who do not need accommodations. The entry fee for just playing in the tournament varies from city to city but the clinic and party can be added on.",
  },
  {
    question: "How many matches will I play each day?",
    answer:
      "Depends on the draw and the number of teams entered. We typically like for everyone to get a minimum of 2 matches on both Friday and Saturday and then the semifinals and finals take place on Sunday. Sometimes with larger draws, teams will have or get to play a 3rd match on Friday or Saturday as well. No matter what, a minimum of 4 matches will be scheduled for all teams over the weekend, and some teams could play up to 6 or 7 total.",
  },
  {
    question: "Should I come in on Thursday or Friday?",
    answer:
      "Matches will for sure start at 8:00 AM on Friday morning and everyone will most likely have their first match by noon on Friday. If you live close enough to drive in on Friday morning then that will work, otherwise I would plan to arrive Thursday night. About 80% of our players staying at the resort do come in on Thursday and stay for 3 nights.",
  },
  {
    question: "What comes with the accommodation packages?",
    answer:
      "All packages includes all accommodations, resort fees, tournament registration fees, Friday night party event and ALL taxes.",
  },
  {
    question: "Can I play in two events?",
    answer:
      "No. With a minimum of 4 matches in each event, and a possibly 7 matches in one event it could end up being 13-14 matches over a 3 day period.",
  },
];

export const eventQuickFilters = [
  {
    title: "Need draws fast?",
    body: "Use the dedicated draws page for quick repeat-player access.",
    href: "/draws-results",
    cta: "Go to Draws & Results",
  },
  {
    title: "Want the most competitive feel?",
    body: "Look for weekends marked as stronger competitive energy.",
    href: "/events/palm-springs-showdown",
    cta: "See Palm Springs",
  },
  {
    title: "Want the most balanced weekend?",
    body: "Choose an event that combines strong play with an easier overall weekend flow.",
    href: "/events/amelia-island-classic",
    cta: "See Amelia Island",
  },
];
