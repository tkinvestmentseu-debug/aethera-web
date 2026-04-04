// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const ITEM_H = 44;

interface Props {
  day: number;    // 1-31
  month: number;  // 1-12
  year: number;   // e.g. 1990
  onChange: (day: number, month: number, year: number) => void;
  textColor: string;
  accentColor: string;
  cardBg: string;
}

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = MONTHS;
const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

function WheelColumn({ items, selected, onSelect, textColor, accentColor, format }: any) {
  const ref = useRef<ScrollView>(null);
  const selIdx = items.indexOf(selected);

  useEffect(() => {
    if (selIdx >= 0) {
      ref.current?.scrollTo({ y: selIdx * ITEM_H, animated: false });
    }
  }, []);

  return (
    <ScrollView
      ref={ref}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      style={{ height: ITEM_H * 3, flex: 1 }}
      contentContainerStyle={{ paddingVertical: ITEM_H }}
      onMomentumScrollEnd={e => {
        const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
        if (idx >= 0 && idx < items.length) onSelect(items[idx]);
      }}
    >
      {items.map((item: any, i: number) => (
        <View key={i} style={[styles.item, item === selected && { backgroundColor: accentColor + '18' }]}>
          <Text style={[styles.itemText, { color: item === selected ? accentColor : textColor + 'AA' }]}>
            {format ? format(item) : String(item).padStart(2, '0')}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

export const DateWheelPicker: React.FC<Props> = ({ day, month, year, onChange, textColor, accentColor, cardBg }) => {
  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: accentColor + '30' }]}>
      {/* Selection highlight */}
      <View style={[styles.selBar, { borderColor: accentColor + '55' }]} pointerEvents="none" />
      <WheelColumn items={days} selected={day} onSelect={d => onChange(d, month, year)} textColor={textColor} accentColor={accentColor} cardBg={cardBg} />
      <View style={[styles.sep, { backgroundColor: accentColor + '30' }]} />
      <WheelColumn items={months} selected={months[month - 1]} onSelect={m => onChange(day, months.indexOf(m) + 1, year)} textColor={textColor} accentColor={accentColor} cardBg={cardBg} />
      <View style={[styles.sep, { backgroundColor: accentColor + '30' }]} />
      <WheelColumn items={years} selected={year} onSelect={y => onChange(day, month, y)} textColor={textColor} accentColor={accentColor} cardBg={cardBg} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    height: ITEM_H * 3,
  },
  selBar: {
    position: 'absolute',
    left: 0, right: 0,
    top: ITEM_H,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
    pointerEvents: 'none',
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 17,
    fontWeight: '600',
  },
  sep: {
    width: 1,
  },
});
