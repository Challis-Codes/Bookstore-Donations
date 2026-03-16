import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import ScanScreen from './src/screens/ScanScreen';
import SessionScreen from './src/screens/SessionScreen';
import DNTScreen from './src/screens/DNTScreen';
import { colors } from './src/utils/styles';

const TABS = [
  { key: 'scan', label: '📷 Scan' },
  { key: 'session', label: '📋 Session' },
  { key: 'dnt', label: '🚫 DNT List' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [session, setSession] = useState([]);

  const sessionTotal = session.reduce((s, b) => s + b.credit, 0);

  const renderScreen = () => {
    switch (activeTab) {
      case 'scan':
        return <ScanScreen session={session} setSession={setSession} />;
      case 'session':
        return <SessionScreen session={session} setSession={setSession} />;
      case 'dnt':
        return <DNTScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>Books R Magic</Text>
        <Text style={styles.headerTitle}>📚 Donation Calculator</Text>
        {session.length > 0 && (
          <Text style={styles.headerSession}>
            Session: {session.length} book{session.length !== 1 ? 's' : ''} ·{' '}
            <Text style={{ color: colors.green, fontWeight: 'bold' }}>
              ${sessionTotal.toFixed(2)} credit
            </Text>
          </Text>
        )}
      </View>

      {/* Screen content */}
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: '#2d1f0e',
    borderBottomWidth: 2,
    borderBottomColor: '#8b5e2a',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerSub: {
    fontSize: 10,
    letterSpacing: 4,
    color: colors.gold,
    textTransform: 'uppercase',
    marginBottom: 2,
    fontFamily: 'Georgia',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.goldLight,
    fontFamily: 'Georgia',
  },
  headerSession: {
    marginTop: 6,
    fontSize: 12,
    color: '#a0c878',
    fontFamily: 'Georgia',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2d1f0e',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabActive: {
    borderTopColor: colors.gold,
  },
  tabText: {
    fontSize: 12,
    color: '#9a7a50',
    fontFamily: 'Georgia',
  },
  tabTextActive: {
    color: colors.goldLight,
  },
});
