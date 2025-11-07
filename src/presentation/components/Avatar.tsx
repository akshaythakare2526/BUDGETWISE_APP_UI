import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  name: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  borderWidth?: number;
  borderColor?: string;
}

export default function Avatar({ 
  name, 
  size = 100, 
  backgroundColor, 
  textColor = '#FFFFFF',
  fontSize,
  borderWidth = 0,
  borderColor = 'transparent'
}: AvatarProps) {
  // Function to get initials from name
  const getInitials = (fullName: string): string => {
    if (!fullName) return 'U';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    // Take first letter of first name and first letter of last name
    const firstInitial = names[0].charAt(0).toUpperCase();
    const lastInitial = names[names.length - 1].charAt(0).toUpperCase();
    
    return firstInitial + lastInitial;
  };

  // Generate a consistent color based on name
  const generateColorFromName = (name: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#686DE0', '#4834D4', '#F8B500', '#C44569', '#F8B500',
      '#6C5CE7', '#A29BFE', '#FD79A8', '#E17055', '#00B894'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const initials = getInitials(name);
  // Use provided backgroundColor, or generate one from name if none provided
  const dynamicBackgroundColor = backgroundColor || generateColorFromName(name);
  const calculatedFontSize = fontSize || Math.floor(size * 0.4);

  return (
    <View style={[
      styles.avatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: dynamicBackgroundColor,
        borderWidth: borderWidth,
        borderColor: borderColor,
      }
    ]}>
      <Text style={[
        styles.initialsText,
        {
          color: textColor,
          fontSize: calculatedFontSize,
        }
      ]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  initialsText: {
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
