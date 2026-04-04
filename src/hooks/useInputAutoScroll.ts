/**
 * useInputAutoScroll
 *
 * Provides a ScrollView ref and a helper that, when called from a TextInput's
 * onFocus, scrolls the view so the input is comfortably visible above the
 * software keyboard.
 *
 * Usage:
 *   const { scrollRef, scrollToInput } = useInputAutoScroll();
 *   const myInputRef = useRef<TextInput>(null);
 *
 *   <ScrollView ref={scrollRef} ...>
 *     <MysticalInput
 *       ref={myInputRef}
 *       onFocusScroll={() => scrollToInput(myInputRef)}
 *     />
 *   </ScrollView>
 */
import { useRef, useCallback } from 'react';
import { ScrollView, TextInput, Platform } from 'react-native';

export function useInputAutoScroll(paddingAbove = 120) {
  const scrollRef = useRef<ScrollView>(null);

  const scrollToInput = useCallback(
    (inputRef: React.RefObject<TextInput | null>) => {
      if (!inputRef.current || !scrollRef.current) return;

      const delay = Platform.OS === 'ios' ? 320 : 180;

      setTimeout(() => {
        try {
          (inputRef.current as any).measureLayout(
            scrollRef.current as any,
            (x: number, y: number, _w: number, _h: number) => {
              scrollRef.current?.scrollTo({
                y: Math.max(0, y - paddingAbove),
                animated: true,
              });
            },
            () => {
              /* measurement failed — no-op */
            }
          );
        } catch {
          /* silently ignore if component unmounted */
        }
      }, delay);
    },
    [paddingAbove]
  );

  return { scrollRef, scrollToInput };
}
