import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ExpenseAnalyticsScreen from '../screens/ExpenseAnalyticsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import { View, Text } from 'react-native';
import { useTheme } from '../../core/theme/ThemeContext';

// Placeholder screens for Deposit
function DepositScreen() {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Deposit (Wallet)</Text></View>;
}

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.surface,
          height: 64,
          marginHorizontal: 0,
          marginBottom: 0,
          borderRadius: 0, // Remove curve
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 12,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarIconStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
          height: '100%',
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconColor = focused ? theme.colors.primary : theme.colors.textSecondary;
          if (route.name === 'Home') {
            return <Ionicons name={focused ? "home" : "home-outline"} size={28} color={iconColor} style={{ alignSelf: 'center' }} />;
          } else if (route.name === 'Expense') {
            return <MaterialIcons name="bar-chart" size={26} color={iconColor} style={{ alignSelf: 'center' }} />;
          } else if (route.name === 'Transactions') {
            return <Ionicons name={focused ? "list" : "list-outline"} size={26} color={iconColor} style={{ alignSelf: 'center' }} />;
          } else if (route.name === 'Profile') {
            return <Ionicons name={focused ? "person" : "person-outline"} size={26} color={iconColor} style={{ alignSelf: 'center' }} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Expense" component={ExpenseAnalyticsScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
