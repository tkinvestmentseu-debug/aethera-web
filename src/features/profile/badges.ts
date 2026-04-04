export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: (state: any, journal: any) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'first_step',
    title: 'Pierwszy świadomy krok',
    description: 'Wykonano pierwszy rytuał i otwarto osobistą ścieżkę sanktuarium.',
    icon: 'target',
    requirement: (state) => {
      const dates = Object.keys(state.dailyProgress);
      return dates.some(d => (state.dailyProgress[d].completedRituals?.length || 0) > 0);
    }
  },
  {
    id: 'streak_3',
    title: 'Trzy dni ciągłości',
    description: 'Sanktuarium było odwiedzane trzy dni z rzędu.',
    icon: 'flame',
    requirement: (state) => state.streaks.highest >= 3
  },
  {
    id: 'tarot_master',
    title: 'Mistrzyni lub mistrz tarota',
    description: 'W archiwum zgromadzono co najmniej dziesięć odczytów tarota.',
    icon: 'clapperboard',
    requirement: (_, journal) => journal.entries.filter((e: any) => e.type === 'tarot').length >= 10
  },
  {
    id: 'dreamer',
    title: 'Tkacz snów',
    description: 'W dzienniku zachowano co najmniej pięć zapisów ze snów.',
    icon: 'moon',
    requirement: (_, journal) => journal.entries.filter((e: any) => e.type === 'dream').length >= 5
  }
];
