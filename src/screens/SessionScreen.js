import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput,
} from 'react-native';
import { colors, globalStyles } from '../utils/styles';
import { CREDIT_RATES } from '../data/authorRules';

export default function SessionScreen({ session, setSession }) {
  const [editingBook, setEditingBook] = useState(null);
  const [editFormat, setEditFormat] = useState('');
  const [editGenre, setEditGenre] = useState('');

  const sessionTotal = session.reduce((s, b) => s + b.credit, 0);

  const openEdit = (book) => {
    setEditingBook(book);
    // Find the format key from the label
    const formatKey = Object.entries(CREDIT_RATES).find(([, v]) => v.label === book.format)?.[0] || '';
    setEditFormat(formatKey);
    setEditGenre(book.genre);
  };

  const saveEdit = () => {
    if (!editFormat || !editGenre.trim()) return;
    setSession(prev => prev.map(b => {
      if (b.id !== editingBook.id) return b;
      return {
        ...b,
        format: CREDIT_RATES[editFormat].label,
        formatKey: editFormat,
        genre: editGenre.trim(),
        credit: CREDIT_RATES[editFormat].base,
      };
    }));
    setEditingBook(null);
  };

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={styles.container}>

      {/* ── Edit Modal ── */}
      <Modal visible={!!editingBook} transparent animationType="slide" onRequestClose={() => setEditingBook(null)}>
        <View style={styles.editOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.editTitle}>Edit Book</Text>
            {editingBook && (
              <>
                <Text style={styles.editBookTitle}>{editingBook.title}</Text>
                <Text style={styles.editBookAuthor}>by {editingBook.author}</Text>

                <Text style={[globalStyles.labelText, { marginTop: 16 }]}>Format</Text>
                {Object.entries(CREDIT_RATES).map(([k, v]) => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.editFormatBtn, editFormat === k && styles.editFormatBtnSelected]}
                    onPress={() => setEditFormat(k)}
                  >
                    <Text style={[styles.editFormatText, editFormat === k && { color: colors.textPrimary }]}>
                      {v.label}
                    </Text>
                    <Text style={[styles.editFormatPrice, editFormat === k && { color: colors.green }]}>
                      ${v.base.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={[globalStyles.labelText, { marginTop: 16 }]}>Genre</Text>
                <TextInput
                  style={styles.editGenreInput}
                  value={editGenre}
                  onChangeText={setEditGenre}
                  placeholder="Genre…"
                  placeholderTextColor={colors.textDim}
                />

                {editFormat && editGenre.trim() && (
                  <View style={styles.editCreditPreview}>
                    <Text style={styles.editCreditLabel}>Updated Credit</Text>
                    <Text style={styles.editCreditAmount}>${CREDIT_RATES[editFormat].base.toFixed(2)}</Text>
                  </View>
                )}

                <View style={styles.editBtnRow}>
                  <TouchableOpacity style={styles.editCancelBtn} onPress={() => setEditingBook(null)}>
                    <Text style={styles.editCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editSaveBtn, (!editFormat || !editGenre.trim()) && { opacity: 0.4 }]}
                    onPress={saveEdit}
                    disabled={!editFormat || !editGenre.trim()}
                  >
                    <Text style={styles.editSaveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={globalStyles.sectionTitle}>Current Session</Text>
        {session.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSession([])}>
            <Text style={styles.clearBtnText}>Clear Session</Text>
          </TouchableOpacity>
        )}
      </View>

      {session.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No books added yet.{'\n'}Go to Scan to start.</Text>
        </View>
      ) : (
        <>
          {session.map(b => (
            <View key={b.id} style={styles.bookRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle}>{b.title}</Text>
                <Text style={styles.bookMeta}>{b.author}</Text>
                <Text style={styles.bookMeta}>{b.format} · {b.genre}</Text>
              </View>
              <View style={styles.bookRight}>
                <Text style={styles.bookCredit}>${b.credit.toFixed(2)}</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(b)}>
                  <Text style={styles.editBtnText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSession(prev => prev.filter(x => x.id !== b.id))}>
                  <Text style={styles.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.totalBox}>
            <View>
              <Text style={styles.totalLabel}>Total Credit</Text>
              <Text style={styles.totalCount}>{session.length} book{session.length !== 1 ? 's' : ''} accepted</Text>
            </View>
            <Text style={styles.totalAmount}>${sessionTotal.toFixed(2)}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  clearBtn: { borderWidth: 1, borderColor: '#5a3020', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10 },
  clearBtnText: { color: '#9a5030', fontSize: 12, fontFamily: 'Georgia' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#5a4020', fontSize: 14, textAlign: 'center', fontFamily: 'Georgia', lineHeight: 22 },
  bookRow: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  bookTitle: { fontSize: 15, color: '#f0d88a', fontWeight: 'bold', fontFamily: 'Georgia' },
  bookMeta: { fontSize: 12, color: '#907050', marginTop: 2, fontFamily: 'Georgia' },
  bookRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 },
  bookCredit: { color: colors.green, fontWeight: 'bold', fontSize: 16, fontFamily: 'Georgia' },
  editBtn: { backgroundColor: '#3d2800', borderWidth: 1, borderColor: '#6a4a10', borderRadius: 6, padding: 6 },
  editBtnText: { color: colors.gold, fontSize: 14 },
  removeBtn: { color: '#6a3020', fontSize: 18, padding: 2 },
  totalBox: { marginTop: 8, backgroundColor: '#1e2d10', borderWidth: 1, borderColor: '#4a7020', borderRadius: 10, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, letterSpacing: 2, color: '#80a050', textTransform: 'uppercase', fontFamily: 'Georgia' },
  totalCount: { fontSize: 13, color: '#608040', marginTop: 2, fontFamily: 'Georgia' },
  totalAmount: { fontSize: 34, fontWeight: 'bold', color: colors.green, fontFamily: 'Georgia' },

  // Edit modal
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  editBox: { backgroundColor: '#1e1408', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 2, borderColor: colors.gold, padding: 24, paddingBottom: 40 },
  editTitle: { fontSize: 11, letterSpacing: 3, color: colors.gold, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Georgia' },
  editBookTitle: { fontSize: 17, fontWeight: 'bold', color: colors.goldLight, fontFamily: 'Georgia', marginBottom: 2 },
  editBookAuthor: { fontSize: 13, color: colors.textMuted, fontFamily: 'Georgia', marginBottom: 4 },
  editFormatBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: '#1a1207', borderWidth: 1, borderColor: colors.borderBrown, marginBottom: 6 },
  editFormatBtnSelected: { backgroundColor: '#1e2d10', borderColor: '#4a7020' },
  editFormatText: { fontSize: 14, color: colors.textMuted, fontFamily: 'Georgia' },
  editFormatPrice: { fontSize: 14, color: colors.textDim, fontFamily: 'Georgia' },
  editGenreInput: { backgroundColor: '#1a1207', borderWidth: 1, borderColor: colors.borderBrown, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 14, fontFamily: 'Georgia', marginBottom: 6 },
  editCreditPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#162408', borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 4 },
  editCreditLabel: { fontSize: 13, color: '#80a050', fontFamily: 'Georgia' },
  editCreditAmount: { fontSize: 22, fontWeight: 'bold', color: colors.green, fontFamily: 'Georgia' },
  editBtnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  editCancelBtn: { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.borderBrown },
  editCancelBtnText: { color: colors.textMuted, fontSize: 14, fontFamily: 'Georgia' },
  editSaveBtn: { flex: 1, padding: 13, borderRadius: 8, alignItems: 'center', backgroundColor: '#4a7020' },
  editSaveBtnText: { color: '#d4f0a0', fontSize: 14, fontFamily: 'Georgia', fontWeight: 'bold' },
});
