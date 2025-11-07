import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TokenManager, TokenContext } from '../../data/TokenManager';

export default function ContextIndicator() {
  const [context, setContext] = useState<TokenContext | null>(null);

  useEffect(() => {
    const loadContext = async () => {
      const tokenContext = await TokenManager.getTokenContext();
      setContext(tokenContext);
    };

    loadContext();

    // Set up an interval to check for context changes
    const interval = setInterval(loadContext, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!context) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[
        styles.indicator,
        { backgroundColor: context.isGroupContext ? '#E8F4FD' : '#F0F9FF' }
      ]}>
        <Text style={[
          styles.text,
          { color: context.isGroupContext ? '#2563EB' : '#0F766E' }
        ]}>
          {context.isGroupContext 
            ? `🏢 Group: ${context.groupName}` 
            : '👤 Personal Mode'
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  indicator: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
