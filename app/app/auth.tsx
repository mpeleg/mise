import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { colors, fonts, fontSize, spacing, radius } from '../src/theme';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpDone, setSignUpDone] = useState(false);

  async function signInWith(provider: 'google' | 'apple') {
    setOauthLoading(provider);
    try {
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success' && result.url) {
        const hash = result.url.split('#')[1];
        const params = new URLSearchParams(hash ?? '');
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const code = new URL(result.url).searchParams.get('code');
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(result.url);
        }
      }
    } catch (e: any) {
      console.error('[auth] Sign-in error:', e.message);
    } finally {
      setOauthLoading(null);
    }
  }

  async function handleEmailAuth() {
    setError(null);
    setEmailLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else setSignUpDone(true);
      }
    } finally {
      setEmailLoading(false);
    }
  }

  const anyLoading = oauthLoading !== null || emailLoading;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Mise</Text>
          <Text style={styles.tagline}>Your personal recipe collection</Text>
        </View>

        {signUpDone ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>Check your email to confirm your account, then sign in.</Text>
            <TouchableOpacity onPress={() => { setSignUpDone(false); setMode('signin'); }}>
              <Text style={styles.toggleText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emailForm}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!anyLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!anyLoading}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleEmailAuth}
              disabled={anyLoading}
            >
              {emailLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={[styles.btnText, styles.btnTextPrimary]}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}>
              <Text style={styles.toggleText}>
                {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.oauthButtons}>
          <TouchableOpacity
            style={[styles.btn, styles.btnGoogle]}
            onPress={() => signInWith('google')}
            disabled={anyLoading}
          >
            {oauthLoading === 'google' ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.btnText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.btn, styles.btnApple]}
              onPress={() => signInWith('apple')}
              disabled={anyLoading}
            >
              {oauthLoading === 'apple' ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={[styles.btnText, styles.btnTextApple]}>
                  Continue with Apple
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[32],
    paddingVertical: spacing[48],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[48],
  },
  logo: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize['3xl'],
    color: colors.text,
    marginBottom: spacing[8],
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  emailForm: {
    width: '100%',
    gap: spacing[12],
    marginBottom: spacing[24],
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing[16],
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.white,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: '#d00',
  },
  toggleText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  successBox: {
    width: '100%',
    gap: spacing[16],
    alignItems: 'center',
    marginBottom: spacing[24],
  },
  successText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.text,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing[24],
    gap: spacing[12],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  oauthButtons: {
    width: '100%',
    gap: spacing[12],
  },
  btn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnGoogle: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btnApple: {
    backgroundColor: colors.accent,
  },
  btnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.base,
    color: colors.text,
  },
  btnTextPrimary: {
    color: colors.white,
  },
  btnTextApple: {
    color: colors.white,
  },
});
