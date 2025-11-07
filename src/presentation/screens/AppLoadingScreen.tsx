import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';

interface AppLoadingScreenProps {
  message?: string;
}

export default function AppLoadingScreen({ 
  message = "Loading your financial data..." 
}: AppLoadingScreenProps) {
  const { theme } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    // Pulsing animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Fade in animation
    const fadeAnimation = Animated.timing(fadeValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });

    fadeAnimation.start();
    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulse = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  return (
    <>
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeValue },
          ]}
        >
          {/* Main Loading Icon */}
          <View style={styles.loadingIconContainer}>
            <Animated.View
              style={[
                styles.outerRing,
                {
                  transform: [{ rotate: spin }, { scale: pulse }],
                  borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  borderTopColor: theme.colors.primary,
                  backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            >
              <Ionicons name="trending-up" size={40} color={theme.colors.primary} />
            </Animated.View>
            
            <Animated.View
              style={[
                styles.innerDots,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <View style={[styles.loadingDot, styles.dot1, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.loadingDot, styles.dot2, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.loadingDot, styles.dot3, { backgroundColor: theme.colors.primary }]} />
            </Animated.View>
          </View>

          {/* Loading Text */}
          <View style={styles.textContainer}>
            <Text style={[styles.loadingMessage, { color: theme.colors.text }]}>{message}</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      transform: [{ scaleX: pulseValue }],
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Background Elements */}
          <View style={styles.backgroundElements}>
            <Animated.View
              style={[
                styles.floatingIcon,
                styles.icon1,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <Ionicons name="wallet" size={24} color={theme.isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(74, 144, 226, 0.1)"} />
            </Animated.View>
            
            <Animated.View
              style={[
                styles.floatingIcon,
                styles.icon2,
                { 
                  transform: [
                    { rotate: spin },
                    { scale: pulse },
                  ],
                },
              ]}
            >
              <Ionicons name="bar-chart" size={20} color={theme.isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(74, 144, 226, 0.1)"} />
            </Animated.View>
            
            <Animated.View
              style={[
                styles.floatingIcon,
                styles.icon3,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <Ionicons name="people" size={18} color={theme.isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(74, 144, 226, 0.1)"} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  outerRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerDots: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  loadingDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot1: {
    top: 10,
    left: '50%',
    marginLeft: -4,
  },
  dot2: {
    top: '50%',
    right: 10,
    marginTop: -4,
  },
  dot3: {
    bottom: 10,
    left: '50%',
    marginLeft: -4,
  },
  textContainer: {
    alignItems: 'center',
  },
  loadingMessage: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: 200,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    transform: [{ scaleX: 0.7 }],
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingIcon: {
    position: 'absolute',
  },
  icon1: {
    top: -40,
    left: -20,
  },
  icon2: {
    top: -20,
    right: -30,
  },
  icon3: {
    bottom: -30,
    left: 20,
  },
});
