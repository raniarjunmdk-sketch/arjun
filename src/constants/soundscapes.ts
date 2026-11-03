import { SoundscapeConfig } from '../types/game';

export const ZEN_SOUNDSCAPES: SoundscapeConfig[] = [
  {
    id: 'bowls',
    name: 'Singing Bowls & Crystal Bells',
    subtitle: 'Resonant Tibetan singing bowl harmonics tuned to 432Hz',
    requiredWins: 1,
    unlockRequirementText: 'Available from Level 1',
    type: 'bowls',
  },
  {
    id: 'rain',
    name: 'Rain on Bamboo Leaves',
    subtitle: 'Gentle continuous rainfall with soothing water drops',
    requiredWins: 8,
    unlockRequirementText: 'Reach Level 8 to unlock',
    type: 'rain',
  },
  {
    id: 'drone',
    name: 'Deep Theta Meditation Drone',
    subtitle: 'Warm binaural grounding frequencies for deep solitary focus',
    requiredWins: 15,
    unlockRequirementText: 'Reach Level 15 to unlock',
    type: 'drone',
  },
  {
    id: 'chimes',
    name: 'Temple Wind Chimes',
    subtitle: 'Delicate pentatonic bronze bells fluttering in mountain breeze',
    requiredWins: 25,
    unlockRequirementText: 'Reach Level 25 to unlock',
    type: 'chimes',
  },
  {
    id: 'stream',
    name: 'Mountain Forest Stream',
    subtitle: 'Cool mountain brook flowing softly over smooth river stones',
    requiredWins: 40,
    unlockRequirementText: 'Reach Level 40 to unlock',
    type: 'stream',
  },
];
