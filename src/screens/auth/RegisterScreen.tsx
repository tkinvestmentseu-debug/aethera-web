// @ts-nocheck
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../core/services/auth.service';
import { hydrateUserProfile } from '../../store/useAuthStore';
import { useTranslation } from 'react-i18next';

const ZODIAC_SIGNS = ['Baran','Byk','Bliźnięta','Rak','Lew','Panna','Waga','Skorpion','Strzelec','Koziorożec','Wodnik','Ryby'];
const ARCHETYPES = ['Mistyk','Wojownik','Mędrzec','Uzdrowiciel','Wizjoner','Strażnik','Twórca','Poszukiwacz'];
const EMOJIS = ['🌙','✨','🌸','🔮','🌿','🦋','🌊','🔥','💫','🌺','⚡','🕊️'];

export const RegisterScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [zodiacSign, setZodiacSign] = useState('Baran');
  const [archetype, setArchetype] = useState('Mistyk');
  const [avatarEmoji, setAvatarEmoji] = useState('🌙');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim()) { Alert.alert('Błąd', t('auth.displayName')); return; }
    setLoading(true);
    try {
      const user = await AuthService.register({ email, password, displayName: displayName.trim(), zodiacSign, archetype, avatarEmoji });
      await hydrateUserProfile(user.uid);
    } catch (e: any) {
      const msg = e?.code === 'auth/email-already-in-use'
        ? t('auth.errorEmailInUse')
        : e?.code === 'auth/weak-password'
        ? t('auth.errorWeakPassword')
        : t('auth.errorConnection');
      Alert.alert('Błąd', msg);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Błąd', t('auth.email')); return; }
    if (password.length < 6) { Alert.alert('Błąd', t('auth.errorWeakPassword')); return; }
    setStep(2);
  };

  return (
    <LinearGradient colors={['#0D0D1A', '#1A0D2E']} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.logo}>✦ Aethera</Text>
            <Text style={styles.step}>{step === 1 ? t('auth.step1') : t('auth.step2')}</Text>

            {step === 1 ? (
              <>
                <TextInput style={styles.input} placeholder={t('auth.email')} placeholderTextColor="rgba(255,255,255,0.4)"
                  value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                <TextInput style={styles.input} placeholder={t('auth.password')} placeholderTextColor="rgba(255,255,255,0.4)"
                  value={password} onChangeText={setPassword} secureTextEntry />
                <Pressable style={styles.btn} onPress={nextStep}>
                  <Text style={styles.btnText}>{t('auth.nextStep')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <TextInput style={styles.input} placeholder={t('auth.displayName')} placeholderTextColor="rgba(255,255,255,0.4)"
                  value={displayName} onChangeText={setDisplayName} />

                <Text style={styles.label}>{t('auth.zodiacSign')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {ZODIAC_SIGNS.map(z => (
                    <Pressable key={z} onPress={() => setZodiacSign(z)}
                      style={[styles.chip, zodiacSign === z && styles.chipActive]}>
                      <Text style={[styles.chipText, zodiacSign === z && { color: '#fff' }]}>{z}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.label}>{t('auth.archetype')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {ARCHETYPES.map(a => (
                    <Pressable key={a} onPress={() => setArchetype(a)}
                      style={[styles.chip, archetype === a && styles.chipActive]}>
                      <Text style={[styles.chipText, archetype === a && { color: '#fff' }]}>{a}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.label}>{t('auth.symbol')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {EMOJIS.map(e => (
                    <Pressable key={e} onPress={() => setAvatarEmoji(e)}
                      style={[styles.emojiBtn, avatarEmoji === e && styles.emojiBtnActive]}>
                      <Text style={{ fontSize: 24 }}>{e}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable style={styles.btn} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('auth.registerButton')}</Text>}
                </Pressable>
                <Pressable onPress={() => setStep(1)} style={{ marginTop: 12 }}>
                  <Text style={styles.link}>{t('auth.backStep')}</Text>
                </Pressable>
              </>
            )}

            <Pressable onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
              <Text style={styles.link}>{t('auth.hasAccount')} <Text style={{ color: '#A78BFA' }}>{t('auth.login')}</Text></Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { padding: 32, paddingTop: 20 },
  logo: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4, letterSpacing: 2 },
  step: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 32, fontSize: 13 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 16, color: '#fff', marginBottom: 14, fontSize: 15 },
  btn: { backgroundColor: '#7C3AED', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  chipText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  emojiBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emojiBtnActive: { borderColor: '#A78BFA', backgroundColor: 'rgba(124,58,237,0.25)' },
});
