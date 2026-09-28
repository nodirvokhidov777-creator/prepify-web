import { MessageCircle, Layers, Users } from 'lucide-react';
import { colors } from '../../../core/theme/colors';

export const SpeakingPart = { PART1: 'part1', PART2: 'part2', PART3: 'part3' };

export function speakingPartLabel(part) {
  switch (part) {
    case SpeakingPart.PART1: return 'PART 1';
    case SpeakingPart.PART2: return 'PART 2';
    case SpeakingPart.PART3: return 'PART 3';
    default: return part;
  }
}
/** Distinct icon + accent per part: Part 1 (quick personal questions) =
 * blue, Part 2 (single long-turn cue card) = violet, Part 3 (extended
 * discussion) = emerald — matching Reading/Listening/Writing's use of
 * accent color to differentiate content categories at a glance. */
export function speakingPartIcon(part) {
  switch (part) {
    case SpeakingPart.PART1: return MessageCircle;
    case SpeakingPart.PART2: return Layers;
    default: return Users;
  }
}
export function speakingPartAccent(part) {
  switch (part) {
    case SpeakingPart.PART1: return colors.blue;
    case SpeakingPart.PART2: return colors.violet;
    default: return colors.emerald;
  }
}
export function speakingPartAccentSoft(part) {
  switch (part) {
    case SpeakingPart.PART1: return colors.blueSoft;
    case SpeakingPart.PART2: return colors.violetSoft;
    default: return colors.emeraldSoft;
  }
}
