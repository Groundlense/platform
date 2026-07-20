import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';

/**
 * App-wide brand bar: company logo on the left, wordmark on the right.
 * Rendered as the navigator header on every screen (except the login screen
 * and transparent popups), above each screen's own contextual header.
 */
export default function BrandHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Image
          source={require('../assets/groundlense-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.wordmark}>GroundLense</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.rust,
  },
  inner: {
    height: 46,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  logo: {
    width: 38,
    height: 38,
  },
  wordmark: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
