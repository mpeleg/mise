import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Lora_400Regular,
  Lora_600SemiBold,
  Lora_400Regular_Italic,
} from '@expo-google-fonts/lora';
import {
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_600SemiBold,
  Heebo_700Bold,
} from '@expo-google-fonts/heebo';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';
import { migrateLocalDataIfNeeded } from '../src/lib/migration';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Lora_400Regular,
    Lora_600SemiBold,
    Lora_400Regular_Italic,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_600SemiBold,
    Heebo_700Bold,
  });

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();

  // Bootstrap session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Handle deep-link OAuth callback
  useEffect(() => {
    const handleUrl = async (event: { url: string }) => {
      const url = event.url;
      if (!url.includes('auth/callback') && !url.includes('access_token') && !url.includes('code=')) return;

      const fragment = url.split('#')[1] ?? '';
      const hashParams = new URLSearchParams(fragment);
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      if (access_token && refresh_token) {
        WebBrowser.dismissBrowser();
        await supabase.auth.setSession({ access_token, refresh_token });
      } else if (url.includes('code=')) {
        await supabase.auth.exchangeCodeForSession(url);
      }
    };
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  // Run migration once on first sign-in
  useEffect(() => {
    if (session?.user) {
      migrateLocalDataIfNeeded(session.user.id);
    }
  }, [session?.user?.id]);

  // Hide splash once fonts AND session are resolved
  useEffect(() => {
    if (fontsLoaded && session !== undefined) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, session]);

  // Route guard
  useEffect(() => {
    if (session === undefined) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!session && !inAuthGroup) {
      router.replace('/auth');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, segments]);

  if (!fontsLoaded || session === undefined) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="review"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="recipe/[id]" />
      </Stack>
    </>
  );
}
