/** Direct port of onboarding_data.dart's 7-step flow. */
export const OnboardStepKind = { WELCOME: 'welcome', SINGLE_SELECT: 'singleSelect', MULTI_SELECT: 'multiSelect', SUMMARY: 'summary' };

export const onboardSteps = [
  { key: 'welcome', kind: OnboardStepKind.WELCOME },
  { key: 'level', kind: OnboardStepKind.SINGLE_SELECT, question: 'What is your current IELTS level?', options: ['Beginner', 'Around Band 5', 'Around Band 6', 'Around Band 6.5', 'Band 7+', "I'm not sure"] },
  { key: 'target', kind: OnboardStepKind.SINGLE_SELECT, question: 'What band are you aiming for?', options: ['6.0', '6.5', '7.0', '7.5', '8.0', '8.5+'] },
  { key: 'examDate', kind: OnboardStepKind.SINGLE_SELECT, question: 'When is your IELTS exam?', options: ['Within 1 month', '1–3 months', '3–6 months', 'More than 6 months', "I haven't booked it yet"] },
  { key: 'weakSkills', kind: OnboardStepKind.MULTI_SELECT, question: 'Which skills challenge you the most?', options: ['Listening', 'Reading', 'Writing', 'Speaking', 'Vocabulary', 'Grammar'] },
  { key: 'dailyTime', kind: OnboardStepKind.SINGLE_SELECT, question: 'How much time can you study each day?', options: ['20 minutes', '30 minutes', '45 minutes', '1 hour', '2+ hours'] },
  { key: 'summary', kind: OnboardStepKind.SUMMARY },
];
