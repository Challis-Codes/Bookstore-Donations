import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/styles';

export default function ConditionalModal({ visible, rule, bookInfo, onKeep, onDontKeep }) {
  if (!rule || !bookInfo) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.warningLabel}>⚠ Special Rule</Text>
          <Text style={styles.title}>{bookInfo.title}</Text>
          <Text style={styles.author}>by {bookInfo.author}</Text>

          <View style={styles.ruleBox}>
            <Text style={styles.ruleLabel}>Rule for {rule.author}</Text>
            <Text style={styles.ruleText}>{rule.note}</Text>
          </View>

          <Text style={styles.question}>Does this book meet the criteria above?</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.dontKeepBtn]} onPress={onDontKeep}>
              <Text style={[styles.btnText, { color: colors.red }]}>✗ Don't Keep</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.keepBtn]} onPress={onKeep}>
              <Text style={[styles.btnText, { color: colors.greenText }]}>✓ Keep It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  warningLabel: {
    fontSize: 11,
    letterSpacing: 3,
    color: colors.gold,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.goldLight,
    marginBottom: 4,
    fontFamily: 'Georgia',
  },
  author: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 18,
    fontFamily: 'Georgia',
  },
  ruleBox: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
  },
  ruleLabel: {
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  ruleText: {
    fontSize: 15,
    color: '#f0d090',
    lineHeight: 22,
    fontFamily: 'Georgia',
  },
  question: {
    fontSize: 13,
    color: '#a08050',
    textAlign: 'center',
    marginBottom: 18,
    fontFamily: 'Georgia',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  dontKeepBtn: {
    backgroundColor: colors.redBg,
    borderColor: colors.redBorder,
  },
  keepBtn: {
    backgroundColor: colors.greenBg,
    borderColor: colors.greenBorder,
  },
  btnText: {
    fontSize: 14,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
  },
});
