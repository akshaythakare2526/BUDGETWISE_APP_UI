import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Get device type for responsive design decisions
export const getDeviceType = () => {
  if (screenWidth < 350) return 'small';
  if (screenWidth < 768) return 'phone';
  if (screenWidth < 1024) return 'tablet';
  return 'desktop';
};

// Responsive font scaling
export const responsiveFontSize = (size: number) => {
  const scale = screenWidth / 375; // Based on iPhone X width
  const newSize = size * scale;
  
  // Ensure minimum and maximum font sizes
  const minSize = size * 0.8;
  const maxSize = size * 1.2;
  
  return Math.max(minSize, Math.min(maxSize, newSize));
};

// Responsive width/height scaling
export const responsiveWidth = (percentage: number) => {
  return (screenWidth * percentage) / 100;
};

export const responsiveHeight = (percentage: number) => {
  return (screenHeight * percentage) / 100;
};

// Responsive padding/margin
export const responsiveSpacing = (space: number) => {
  const scale = Math.min(screenWidth / 375, 1.2); // Cap scaling at 1.2x
  return Math.round(space * scale);
};

// Check if device has small screen
export const isSmallScreen = () => screenWidth < 350;

// Check if device has large screen
export const isLargeScreen = () => screenWidth >= 768;

// Get responsive popup width
export const getPopupWidth = (defaultWidth: number, maxPercentage: number = 90) => {
  const maxWidth = (screenWidth * maxPercentage) / 100;
  return Math.min(defaultWidth, maxWidth);
};

// Get responsive icon size
export const getIconSize = (defaultSize: number) => {
  if (isSmallScreen()) return defaultSize * 0.75;
  if (isLargeScreen()) return defaultSize * 1.25;
  return defaultSize;
};

// Device info for debugging
export const getDeviceInfo = () => ({
  width: screenWidth,
  height: screenHeight,
  pixelRatio: PixelRatio.get(),
  deviceType: getDeviceType(),
  isSmall: isSmallScreen(),
  isLarge: isLargeScreen(),
});

// Text size categories for accessibility
export const getTextSize = (category: 'small' | 'body' | 'heading' | 'title') => {
  const baseSizes = {
    small: 12,
    body: 16,
    heading: 20,
    title: 24,
  };
  
  return responsiveFontSize(baseSizes[category]);
};

// Responsive button height for accessibility
export const getButtonHeight = (variant: 'small' | 'medium' | 'large' = 'medium') => {
  const baseHeights = {
    small: 36,
    medium: 44,
    large: 52,
  };
  
  return Math.max(44, responsiveSpacing(baseHeights[variant])); // Minimum 44px for accessibility
};
