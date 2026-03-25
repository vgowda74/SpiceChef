import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Colors, Fonts } from '../lib/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('OnboardingDiet');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={() => navigation.replace('OnboardingDiet')}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        {/* Mark */}
        <View style={styles.markRow}>
          <View style={styles.markDot} />
          <View style={styles.markLine} />
          <View style={styles.markDot} />
        </View>

        {/* Logo */}
        <Text style={styles.logo}>SpiceChef</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Tagline */}
        <Text style={styles.tagline}>Your cookbooks, guided.</Text>
      </Animated.View>

      {/* Bottom label */}
      <Animated.Text style={[styles.tap, { opacity }]}>
        Tap anywhere to begin
      </Animated.Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  markDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accent,
  },
  markLine: {
    width: 40,
    height: 1,
    backgroundColor: Colors.accent,
  },
  logo: {
    fontFamily: Fonts.heading,
    fontSize: 56,
    color: Colors.text,
    letterSpacing: 1,
  },
  divider: {
    width: 36,
    height: 1.5,
    backgroundColor: Colors.accent,
    marginVertical: 20,
  },
  tagline: {
    fontFamily: Fonts.headingItalic,
    fontSize: 18,
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  tap: {
    position: 'absolute',
    bottom: 52,
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.border,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
