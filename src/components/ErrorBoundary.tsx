// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={eb.container}>
        <LinearGradient colors={['#050510', '#0A0520', '#050510']} style={StyleSheet.absoluteFill} />
        <Text style={eb.orb}>✦</Text>
        <Text style={eb.title}>Coś poszło nie tak</Text>
        <Text style={eb.subtitle}>Dusza aplikacji na chwilę odpłynęła.{'\n'}Spróbuj ponownie.</Text>
        {__DEV__ && this.state.error && (
          <Text style={eb.errorText} numberOfLines={4}>{this.state.error.message}</Text>
        )}
        <Pressable
          onPress={() => this.setState({ hasError: false, error: null })}
          style={eb.btn}
        >
          <LinearGradient colors={['#7C3AED', '#4F46E5']} start={{x:0,y:0}} end={{x:1,y:0}} style={eb.btnGrad}>
            <Text style={eb.btnText}>Wróć do Aethery</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050510', padding: 32 },
  orb: { fontSize: 64, marginBottom: 24, color: '#A78BFA' },
  title: { fontSize: 24, fontWeight: '700', color: '#F0EBE2', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: 'rgba(240,235,226,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  errorText: { fontSize: 11, color: 'rgba(239,68,68,0.7)', textAlign: 'center', marginBottom: 24, fontFamily: 'monospace' },
  btn: { borderRadius: 16, overflow: 'hidden', width: 240 },
  btnGrad: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
