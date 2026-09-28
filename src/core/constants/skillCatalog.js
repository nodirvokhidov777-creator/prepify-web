import { Headphones, BookOpen, PenLine, Mic, Bookmark, Brain } from 'lucide-react';
export const skillCatalog = {
  Listening: { key: 'Listening', missionLabel: 'Listening Practice', shortLabel: 'Listening', description: 'Train your ear for accents and pace.', icon: Headphones },
  Reading: { key: 'Reading', missionLabel: 'Reading Practice', shortLabel: 'Reading', description: 'Improve comprehension and exam speed.', icon: BookOpen },
  Writing: { key: 'Writing', missionLabel: 'Writing Practice', shortLabel: 'Writing', description: 'Structure stronger Task 1 & 2 responses.', icon: PenLine },
  Speaking: { key: 'Speaking', missionLabel: 'Speaking Practice', shortLabel: 'Speaking', description: 'Build fluency and natural delivery.', icon: Mic },
  Vocabulary: { key: 'Vocabulary', missionLabel: 'Vocabulary Review', shortLabel: 'Vocabulary', description: 'Grow your active academic word bank.', icon: Bookmark },
  Grammar: { key: 'Grammar', missionLabel: 'Grammar Focus', shortLabel: 'Grammar', description: 'Fix recurring structural mistakes.', icon: Brain },
};
export const practiceOrder = ['Listening', 'Reading', 'Writing', 'Speaking', 'Vocabulary', 'Grammar'];
export function skillMeta(key) { return skillCatalog[key]; }
