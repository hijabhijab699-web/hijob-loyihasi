import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/store/auth';
import { Logo } from '../src/components/Logo';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Splash() {
  const { isLoading, isAuthed, user } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    // Give the splash a beat so the user sees the brand.
    const t = setTimeout(() => {}, 500);
    return () => clearTimeout(t);
  }, []);

  if (!isLoading) {
    if (!isAuthed) return <Redirect href="/(auth)/register" />;
    const needsFace = !user?.onboarding?.faceCaptured;
    const needsBody = !user?.onboarding?.bodyProvided;
    if (needsFace) return <Redirect href="/(onboarding)/face" />;
    if (needsBody) return <Redirect href="/(onboarding)/body" />;
    if (user?.role === 'seller') return <Redirect href="/(seller-tabs)/dashboard" />;
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <LinearGradient
      colors={[colors.oliveDark, colors.olive, colors.oliveSoft]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ alignItems: 'center', gap: 32 }}>
        <Logo size={160} label />
        <ActivityIndicator color={colors.goldSoft} />
      </View>
    </LinearGradient>
  );
}
