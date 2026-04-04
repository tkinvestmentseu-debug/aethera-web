// @ts-nocheck
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../core/services/auth.service';
import { hydrateUserProfile } from '../../store/useAuthStore';
import { useTranslation } from 'react-i18next';

export const LoginScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Błąd', t('auth.email') + ' / ' + t('auth.password'));
      return;
    }
    setLoading(true);
    try {
      const user = await AuthService.login(email.trim(), password);
      await hydrateUserProfile(user.uid);
    } catch (e: any) {
      const msg = e?.code === 'auth/invalid-credential'
        ? t('auth.errorInvalidCredential')
        : t('auth.errorConnection');
      Alert.alert('Błąd logowania', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0D0D1A', '#1A0D2E']} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <Text style={styles.logo}>✦ Aethera</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{t('auth.loginButton')}</Text>}
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: 20 }}>
            <Text style={styles.link}>
              {t('auth.noAccount')} <Text style={{ color: '#A78BFA' }}>{t('auth.register')}</Text>
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 36, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8, letterSpacing: 2 },
  subtitle: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 40, fontSize: 14 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, padding: 16, color: '#fff',
    marginBottom: 14, fontSize: 15,
  },
  btn: {
    backgroundColor: '#7C3AED', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14 },
});
