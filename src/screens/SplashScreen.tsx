import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
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
      navigation.replace('HomeLibrary');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={() => navigation.replace('HomeLibrary')}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        {/* App icon */}
        <Image
          source={require('../../assets/icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />

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
  icon: {
    width: 180,
    height: 180,
    marginBottom: 16,
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
