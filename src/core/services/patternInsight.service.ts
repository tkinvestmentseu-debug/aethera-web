import { useJournalStore, JournalEntry } from '../../store/useJournalStore';
import { useTarotStore, SavedReading } from '../../features/tarot/store/useTarotStore';

export interface WeeklyInsight {
  dominantMood: string;
  averageEnergy: number;
  frequentArchetypes: string[];
  suggestedFocus: string;
  daysActive: number;
}

export class PatternInsightService {
  /**
   * Retrieves all journal entries and tarot readings from the last 7 days
   * to build a coherent emotional and spiritual profile of the user.
   */
  static generateWeeklyInsight(): WeeklyInsight {
    const journalStore = useJournalStore.getState();
    const tarotStore = useTarotStore.getState();

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentEntries = journalStore.entries.filter(e => new Date(e.date) >= oneWeekAgo);
    const recentReadings = tarotStore.pastReadings.filter(r => new Date(r.date) >= oneWeekAgo);

    // 1. Calculate Average Energy
    const energyEntries = recentEntries.filter(e => e.energyLevel !== undefined);
    let avgEnergy = 70; // default baseline
    if (energyEntries.length > 0) {
      const sum = energyEntries.reduce((acc, curr) => acc + (curr.energyLevel || 0), 0);
      avgEnergy = Math.round(sum / energyEntries.length);
    }

    // 2. Determine Dominant Mood
    const moodCounts: Record<string, number> = {};
    recentEntries.forEach(e => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });
    
    // Also include moods logged right before tarot readings
    recentReadings.forEach(r => {
      if (r.moodBefore) {
        moodCounts[r.moodBefore] = (moodCounts[r.moodBefore] || 0) + 1;
      }
    });

    let dominantMood = 'Spokojna';
    let maxMoodCount = 0;
    for (const [mood, count] of Object.entries(moodCounts)) {
      if (count > maxMoodCount) {
        maxMoodCount = count;
        dominantMood = mood;
      }
    }

    // 3. Extract Frequent Tarot Archetypes
    const archetypeCounts: Record<string, number> = {};
    recentReadings.forEach(r => {
      r.cards.forEach(c => {
        if (c.card.suit === 'major') {
          archetypeCounts[c.card.name] = (archetypeCounts[c.card.name] || 0) + 1;
        }
      });
    });
    
    const sortedArchetypes = Object.entries(archetypeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3); // Top 3

    // 4. Suggest Focus based on data
    let suggestedFocus = "Czas na utrzymanie obecnej równowagi.";
    if (avgEnergy < 40 || dominantMood === 'Słaba' || dominantMood === 'Trudna') {
      suggestedFocus = "Odpoczynek, regeneracja i odcięcie od nadmiaru bodźców. Skup się na uziemieniu.";
    } else if (avgEnergy > 80 && (dominantMood === 'Znakomita' || dominantMood === 'Dobra')) {
      suggestedFocus = "Eksploracja nowych ścieżek, manifestacja i kreatywne działanie. Wykorzystaj ten wznoszący prąd.";
    } else if (sortedArchetypes.includes('tarot.cards.major.15.name') || sortedArchetypes.includes('tarot.cards.major.16.name')) {
      suggestedFocus = "Praca z Cieniem. Zmierz się z tym, co wypierasz, aby uwolnić zablokowaną energię.";
    }

    // Calculate unique active days
    const activeDates = new Set([
      ...recentEntries.map(e => new Date(e.date).toISOString().split('T')[0]),
      ...recentReadings.map(r => new Date(r.date).toISOString().split('T')[0])
    ]);

    return {
      dominantMood,
      averageEnergy: avgEnergy,
      frequentArchetypes: sortedArchetypes,
      suggestedFocus,
      daysActive: activeDates.size
    };
  }

  static getPersonalizedPrompt(): string {
    const insight = this.generateWeeklyInsight();
    if (insight.dominantMood === 'Trudna' || insight.dominantMood === 'Słaba') {
      return "Zauważyłem, że ostatnio przechodzisz trudniejszy czas. Czego Twoje ciało i umysł teraz najbardziej potrzebują, by poczuć się bezpiecznie?";
    }
    if (insight.frequentArchetypes.length > 0) {
      return `Energia karty ${insight.frequentArchetypes[0]} często pojawiała się w Twoim polu w tym tygodniu. Jak ta siła manifestuje się dzisiaj w Twoim życiu?`;
    }
    return "Jakie jedno słowo najlepiej opisuje Twoją dzisiejszą wibrację i dlaczego?";
  }
}
