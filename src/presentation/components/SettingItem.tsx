import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';

interface SettingItemProps {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  showChevron?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  switchColor?: string;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  showChevron = true,
  showSwitch = false,
  switchValue = false,
  onSwitchChange,
  switchColor = '#4A90E2',
}) => {
  const { theme } = useTheme();

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: iconColor,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
          }}
        >
          <Ionicons name={icon as any} size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.textSecondary,
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>
      
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: theme.colors.border, true: switchColor }}
          thumbColor={switchValue ? '#fff' : '#f4f3f4'}
        />
      )}
      
      {showChevron && !showSwitch && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.disabled} />
      )}
    </Component>
  );
};
