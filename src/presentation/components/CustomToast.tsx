import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Props {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

export default function CustomToast({ 
  visible, 
  message, 
  type = 'info', 
  duration = 3000, 
  onHide 
}: Props) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  let backgroundColor = '#4A90E2';
  let iconName: keyof typeof Ionicons.glyphMap = 'information-circle';

  if (type === 'success') {
    backgroundColor = '#3ED598';
    iconName = 'checkmark-circle';
  } else if (type === 'error') {
    backgroundColor = '#FF7A7A';
    iconName = 'close-circle';
  } else if (type === 'warning') {
    backgroundColor = '#FFB84D';
    iconName = 'warning';
  }

  useEffect(() => {
    if (visible) {
      // Slide in from top
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 60,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onHide) onHide();
      });
    }
  }, [visible, slideAnim, duration, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { 
          backgroundColor,
          transform: [{ translateY: slideAnim }] 
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={iconName} size={24} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.toastText} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon: {
    marginRight: 12,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
});
