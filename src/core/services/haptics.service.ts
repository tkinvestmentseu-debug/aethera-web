import * as Haptics from 'expo-haptics';

export type HapticsRuntimeState = 'idle' | 'ready' | 'failed';

type HapticsRuntimeStatus = {
  state: HapticsRuntimeState;
  message?: string;
};

type HapticsDiagnosticSnapshot = {
  enabled: boolean;
  runtime: HapticsRuntimeStatus;
  lastAction: string;
};

export class HapticsService {
  private static enabled = true;
  private static runtimeStatus: HapticsRuntimeStatus = { state: 'idle' };
  private static listeners = new Set<(status: HapticsRuntimeStatus) => void>();
  private static lastAction = 'Brak akcji haptycznej w tej sesji.';

  private static resolveImpactStyle(style: Haptics.ImpactFeedbackStyle | 'light' | 'medium' | 'heavy') {
    if (style === 'medium') return Haptics.ImpactFeedbackStyle.Medium;
    if (style === 'heavy') return Haptics.ImpactFeedbackStyle.Heavy;
    if (style === 'light') return Haptics.ImpactFeedbackStyle.Light;
    return style;
  }

  private static isEnabled() {
    return this.enabled;
  }

  private static setRuntimeStatus(state: HapticsRuntimeState, message?: string) {
    this.runtimeStatus = { state, message };
    this.listeners.forEach((listener) => {
      try {
        listener(this.runtimeStatus);
      } catch {
        // Listener failure must not break interaction feedback.
      }
    });
  }

  private static markReady() {
    this.lastAction = 'Haptyka odpowiedziała poprawnie.';
    if (this.runtimeStatus.state !== 'ready') {
      this.setRuntimeStatus('ready');
    }
  }

  private static markFailure(message: string) {
    this.lastAction = message;
    this.setRuntimeStatus('failed', message);
  }

  private static resolveFailureMessage(fallback: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error || '');
    if (message.toLowerCase().includes('unavailable')) {
      return 'Haptyka nie jest wspierana lub nie odpowiedziała na tym urządzeniu.';
    }
    return fallback;
  }

  static subscribeRuntimeStatus(listener: (status: HapticsRuntimeStatus) => void) {
    this.listeners.add(listener);
    listener(this.runtimeStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static getDiagnosticSnapshot(): HapticsDiagnosticSnapshot {
    return {
      enabled: this.enabled,
      runtime: this.runtimeStatus,
      lastAction: this.lastAction,
    };
  }

  static syncEnabledState(enabled: boolean) {
    this.enabled = enabled;
    this.lastAction = enabled ? 'Haptyka została ponownie włączona.' : 'Haptyka została wyłączona przez użytkownika.';
    this.setRuntimeStatus('idle');
  }

  static async selection() {
    if (!this.isEnabled()) {
      this.lastAction = 'Haptyka pozostaje wyłączona w ustawieniach.';
      this.setRuntimeStatus('idle');
      return;
    }
    try {
      await Haptics.selectionAsync();
      this.markReady();
    } catch (error) {
      this.markFailure(this.resolveFailureMessage('Haptyka urządzenia nie odpowiedziała na delikatne potwierdzenie.', error));
    }
  }

  static async impact(style: Haptics.ImpactFeedbackStyle | 'light' | 'medium' | 'heavy' = Haptics.ImpactFeedbackStyle.Light) {
    if (!this.isEnabled()) {
      this.lastAction = 'Haptyka pozostaje wyłączona w ustawieniach.';
      this.setRuntimeStatus('idle');
      return;
    }
    try {
      await Haptics.impactAsync(this.resolveImpactStyle(style));
      this.markReady();
    } catch (error) {
      this.markFailure(this.resolveFailureMessage('Haptyka urządzenia nie odpowiedziała na impuls interakcji.', error));
    }
  }

  static impactLight() { return this.impact('light'); }
  static impactMedium() { return this.impact('medium'); }
  static impactHeavy() { return this.impact('heavy'); }

  static async notify(type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) {
    if (!this.isEnabled()) {
      this.lastAction = 'Haptyka pozostaje wyłączona w ustawieniach.';
      this.setRuntimeStatus('idle');
      return;
    }
    try {
      await Haptics.notificationAsync(type);
      this.markReady();
    } catch (error) {
      this.markFailure(this.resolveFailureMessage('Haptyka urządzenia nie odpowiedziała na sygnał powiadomienia.', error));
    }
  }
}
