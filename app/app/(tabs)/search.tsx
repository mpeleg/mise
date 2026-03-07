import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, spacing } from '../../src/theme';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Search</Text>
        <Text style={styles.emptySub}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  emptySub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
  },
});
