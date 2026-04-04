import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { themes } from '../../../core/theme/tokens';
import { useAppStore } from '../../../store/useAppStore';
import { JournalEntry } from '../../../store/useJournalStore';

const { width } = Dimensions.get('window');

interface MoodConstellationProps {
  entries: JournalEntry[];
}

export const MoodConstellation = ({ entries }: MoodConstellationProps) => {
  const { themeName } = useAppStore();
  const currentTheme = themes[themeName] || themes.dark;
  const size = width - 80;
  const padding = 40;

  // Mapowanie nastroju na wysokość Y
  const moodToY = (mood?: string) => {
    switch(mood) {
      case 'Znakomita': return padding;
      case 'Dobra': return size * 0.3;
      case 'Spokojna': return size * 0.5;
      case 'Słaba': return size * 0.7;
      case 'Trudna': return size - padding;
      default: return size * 0.5;
    }
  };

  // Bierzemy ostatnie 7 wpisów dla czytelności
  const recentEntries = entries.slice(0, 7).reverse();

  return (
    <View style={styles.container}>
      <Svg height={size} width={size}>
        {recentEntries.map((entry, index) => {
          const x = padding + (index * (size - padding * 2)) / (recentEntries.length - 1 || 1);
          const y = moodToY(entry.mood);
          
          const nextEntry = recentEntries[index + 1];
          let nextX, nextY;
          if (nextEntry) {
            nextX = padding + ((index + 1) * (size - padding * 2)) / (recentEntries.length - 1 || 1);
            nextY = moodToY(nextEntry.mood);
          }

          return (
            <G key={entry.id}>
              {nextEntry && (
                <Line 
                  x1={x} y1={y} x2={nextX} y2={nextY} 
                  stroke={currentTheme.primary} strokeWidth="1" opacity="0.3" 
                />
              )}
              <Circle 
                cx={x} cy={y} r="6" 
                fill={currentTheme.primary} 
                opacity={0.8}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
});
