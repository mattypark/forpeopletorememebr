/**
 * Onboarding question definitions. Answers land in Supabase auth
 * user_metadata under `onboarding`, with `onboarded: true` set once the flow
 * finishes (or is skipped) so it only ever shows once.
 */
export interface OnboardingQuestion {
  id: string;
  kicker: string;
  question: string;
  multi: boolean;
  options: string[];
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "source",
    kicker: "Quick one",
    question: "Where did you hear about Bery?",
    multi: false,
    options: [
      "A friend",
      "X / Twitter",
      "TikTok",
      "YouTube",
      "Instagram",
      "School or a club",
      "Somewhere else",
    ],
  },
  {
    id: "useFor",
    kicker: "Your world",
    question: "What will you use Bery for?",
    multi: true,
    options: [
      "Networking events & meetups",
      "School & campus connections",
      "Work, clients & sales",
      "Investors & fundraising",
      "Friends & social life",
      "Conferences & communities",
    ],
  },
  {
    id: "meetRate",
    kicker: "Your pace",
    question: "How many new people do you meet in a month?",
    multi: false,
    options: ["A few (1–5)", "A steady stream (5–15)", "A lot (15–50)", "It's a blur (50+)"],
  },
  {
    id: "struggle",
    kicker: "The real problem",
    question: "What slips through the cracks today?",
    multi: true,
    options: [
      "I forget names and faces",
      "I never follow up",
      "I can't recall who can help with what",
      "My contacts are scattered everywhere",
    ],
  },
];

export type OnboardingAnswers = Record<string, string[]>;

/** True when the signed-in user still needs onboarding. */
export function needsOnboarding(
  userMetadata: Record<string, unknown> | undefined | null,
): boolean {
  return !userMetadata?.onboarded;
}
