import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../core/theme/ThemeContext';
import { offlineManager, SyncStatus } from '../../services/OfflineManager';

interface NetworkStatusBarProps {
  onSyncPress?: () => void;
}

export default function NetworkStatusBar({ onSyncPress }: NetworkStatusBarProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingOperations: 0,
    lastSync: 0,
    lastSyncFormatted: 'Never'
  });

  const [showDetails, setShowDetails] = useState(false);
  const { theme } = useTheme();
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    // Load initial sync status
    loadSyncStatus();

    // Subscribe to network status changes
    const unsubscribeNetwork = offlineManager.onNetworkStatusChange((isOnline) => {
      setSyncStatus(prev => ({ ...prev, isOnline }));
      loadSyncStatus();
    });

    // Subscribe to sync progress
    const unsubscribeSync = offlineManager.onSyncProgress((progress) => {
      loadSyncStatus();
    });

    // Refresh status every 30 seconds
    const interval = setInterval(loadSyncStatus, 30000);

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const loadSyncStatus = async () => {
    const status = await offlineManager.getSyncStatus();
    setSyncStatus(status);
  };

  const handleSync = async () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      await offlineManager.syncWithServer();
      loadSyncStatus();
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
    Animated.timing(slideAnim, {
      toValue: showDetails ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getStatusColor = () => {
    if (syncStatus.isSyncing) return '#FFA500';
    if (!syncStatus.isOnline) return '#FF6B6B';
    if (syncStatus.pendingOperations > 0) return '#FFD93D';
    return '#6BCF7F';
  };

  const getStatusText = () => {
    if (syncStatus.isSyncing) return 'Syncing...';
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.pendingOperations > 0) return `${syncStatus.pendingOperations} pending`;
    return 'Synced';
  };

  const getStatusIcon = () => {
    if (syncStatus.isSyncing) return 'sync';
    if (!syncStatus.isOnline) return 'cloud-offline';
    if (syncStatus.pendingOperations > 0) return 'time';
    return 'cloud-done';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Main Status Bar */}
      <TouchableOpacity
        style={[styles.statusBar, { borderColor: getStatusColor() }]}
        onPress={toggleDetails}
        activeOpacity={0.7}
      >
        <View style={styles.statusLeft}>
          <Ionicons
            name={getStatusIcon()}
            size={16}
            color={getStatusColor()}
            style={syncStatus.isSyncing ? styles.rotating : undefined}
          />
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            {getStatusText()}
          </Text>
        </View>

        {syncStatus.pendingOperations > 0 && !syncStatus.isSyncing && syncStatus.isOnline && (
          <TouchableOpacity
            style={[styles.syncButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSync}
          >
            <Ionicons name="sync" size={14} color="white" />
            <Text style={styles.syncButtonText}>Sync</Text>
          </TouchableOpacity>
        )}

        <Ionicons
          name={showDetails ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Details Panel */}
      <Animated.View
        style={[
          styles.detailsPanel,
          {
            backgroundColor: theme.colors.card,
            height: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 120],
            }),
            opacity: slideAnim,
          },
        ]}
      >
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
            Network Status:
          </Text>
          <View style={styles.detailValue}>
            <Ionicons
              name={syncStatus.isOnline ? 'wifi-outline' : 'cloud-offline-outline'}
              size={14}
              color={syncStatus.isOnline ? '#6BCF7F' : '#FF6B6B'}
            />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              {syncStatus.isOnline ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
            Pending Operations:
          </Text>
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {syncStatus.pendingOperations}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
            Last Sync:
          </Text>
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {syncStatus.lastSyncFormatted}
          </Text>
        </View>

        {syncStatus.isOnline && (
          <TouchableOpacity
            style={[styles.fullSyncButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSync}
            disabled={syncStatus.isSyncing}
          >
            <Ionicons
              name="sync"
              size={16}
              color="white"
              style={syncStatus.isSyncing ? styles.rotating : undefined}
            />
            <Text style={styles.fullSyncButtonText}>
              {syncStatus.isSyncing ? 'Syncing...' : 'Force Sync'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    margin: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 4,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsPanel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  fullSyncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
  },
  fullSyncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  rotating: {
    // Note: Animation would need to be handled via Animated.View for rotation
  },
});
