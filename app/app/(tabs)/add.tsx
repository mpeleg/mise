import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, fontSize, radius, spacing } from '../../src/theme';

type OptionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  onPress: () => void;
};

function OptionCard({ icon, iconBg, iconColor, title, onPress }: OptionProps) {
  return (
    <Pressable style={styles.optionCard} onPress={onPress}>
      <View style={[styles.optionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.optionTitle}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.border} />
    </Pressable>
  );
}

export default function AddScreen() {
  const router = useRouter();
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLinkSubmit = async () => {
    const url = linkUrl.trim();
    if (!url) {
      Alert.alert('Enter a URL', 'Paste a recipe link to import.');
      return;
    }
    setLoading(true);
    // For now, navigate to review with the URL — AI extraction will come later
    setLoading(false);
    setShowLinkInput(false);
    setLinkUrl('');
    router.push({
      pathname: '/review',
      params: { sourceType: 'link', sourceUrl: url },
    });
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/review',
        params: {
          sourceType: 'image',
          photoUri: result.assets[0].uri,
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Add a recipe</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.subtitle}>How do you want to add it?</Text>

        <View style={styles.options}>
          <OptionCard
            icon="link-outline"
            iconBg="#DDD5C8"
            iconColor={colors.text}
            title="Paste a link"
            onPress={() => setShowLinkInput(!showLinkInput)}
          />

          {showLinkInput && (
            <View style={styles.linkInputArea}>
              <TextInput
                style={styles.linkInput}
                value={linkUrl}
                onChangeText={setLinkUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleLinkSubmit}
              />
              <Pressable
                style={[styles.linkButton, !linkUrl.trim() && styles.linkButtonDisabled]}
                onPress={handleLinkSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.linkButtonText}>Import</Text>
                )}
              </Pressable>
            </View>
          )}

          <OptionCard
            icon="image-outline"
            iconBg="#DDD5C8"
            iconColor={colors.text}
            title="From an image"
            onPress={handleImagePick}
          />

          <OptionCard
            icon="create-outline"
            iconBg="#DDD5C8"
            iconColor={colors.text}
            title="Type it in"
            onPress={() =>
              router.push({
                pathname: '/review',
                params: { sourceType: 'manual' },
              })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[4],
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing[20],
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing[24],
  },
  options: {
    gap: spacing[12],
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.text,
  },
  linkInputArea: {
    flexDirection: 'row',
    gap: spacing[8],
    paddingHorizontal: spacing[4],
  },
  linkInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.text,
  },
  linkButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing[20],
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonDisabled: {
    opacity: 0.5,
  },
  linkButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.white,
  },
});
