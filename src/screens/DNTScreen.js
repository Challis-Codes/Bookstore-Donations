import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, globalStyles } from '../utils/styles';
import { AUTHOR_RULES } from '../data/authorRules';

const rejectAuthors = AUTHOR_RULES.filter(r => r.status === 'reject');
const conditionalAuthors = AUTHOR_RULES.filter(r => r.status === 'conditional');
const acceptAllAuthors = AUTHOR_RULES.filter(r => r.status === 'accept_all');

export default function DNTScreen() {
  const [activeTab, setActiveTab] = useState('conditional');

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={styles.container}>

      {/* Badges */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { borderColor: colors.redBorder, backgroundColor: colors.redBg }]}>
          <Text style={[styles.badgeText, { color: colors.red }]}>
            ✗ Do Not Take ({rejectAuthors.length})
          </Text>
        </View>
        <View style={[styles.badge, { borderColor: colors.amberBorder, backgroundColor: colors.amberBg }]}>
          <Text style={[styles.badgeText, { color: colors.amber }]}>
            ⚠ Conditional ({conditionalAuthors.length})
          </Text>
        </View>
        <View style={[styles.badge, { borderColor: '#4a8020', backgroundColor: '#1a3010' }]}>
          <Text style={[styles.badgeText, { color: '#6fcf60' }]}>
            ✓ Accept All ({acceptAllAuthors.length})
          </Text>
        </View>
      </View>

      {/* Sub-tabs */}
      <View style={styles.subTabs}>
        {[
          { key: 'conditional', label: 'Conditional' },
          { key: 'reject', label: 'Do Not Take' },
          { key: 'accept', label: 'Accept All' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.subTab, activeTab === t.key && styles.subTabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.subTabText, activeTab === t.key && styles.subTabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conditional rules */}
      {activeTab === 'conditional' && conditionalAuthors.map((r, i) => (
        <View key={i} style={styles.conditionalCard}>
          <Text style={styles.conditionalAuthor}>{r.author}</Text>
          <Text style={styles.conditionalNote}>{r.note}</Text>
        </View>
      ))}

      {/* Reject list */}
      {activeTab === 'reject' && (
        <View style={styles.rejectGrid}>
          {rejectAuthors.map((r, i) => (
            <View key={i} style={styles.rejectPill}>
              <Text style={styles.rejectText}>{r.author}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Accept all list */}
      {activeTab === 'accept' && (
        <View style={styles.rejectGrid}>
          {acceptAllAuthors.map((r, i) => (
            <View key={i} style={[styles.rejectPill, { backgroundColor: '#1a3010', borderColor: '#3a6010' }]}>
              <Text style={[styles.rejectText, { color: '#80c050' }]}>{r.author}</Text>
            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Georgia',
  },
  subTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomColor: colors.gold,
  },
  subTabText: {
    fontSize: 12,
    color: colors.textDim,
    fontFamily: 'Georgia',
  },
  subTabTextActive: {
    color: colors.goldLight,
  },
  conditionalCard: {
    backgroundColor: '#2d1a00',
    borderWidth: 1,
    borderColor: '#5a3800',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  conditionalAuthor: {
    fontSize: 14,
    color: '#f0c060',
    fontWeight: 'bold',
    fontFamily: 'Georgia',
  },
  conditionalNote: {
    fontSize: 12,
    color: '#a07840',
    marginTop: 4,
    fontFamily: 'Georgia',
    lineHeight: 18,
  },
  rejectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rejectPill: {
    backgroundColor: '#2d1207',
    borderWidth: 1,
    borderColor: '#4a1a0a',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rejectText: {
    fontSize: 12,
    color: '#c07060',
    fontFamily: 'Georgia',
  },
});
