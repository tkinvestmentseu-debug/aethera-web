import { useAppStore } from '../../store/useAppStore';

/**
 * Returns the current textScale factor from the user's experience settings.
 * Use this to scale raw fontSize values in screens that don't use the
 * Typography component.
 *
 * Example:
 *   const textScale = useTextScale();
 *   <Text style={{ fontSize: 16 * textScale }}>Hello</Text>
 */
export function useTextScale(): number {
  return useAppStore((state) => state.experience.textScale ?? 1.0);
}
