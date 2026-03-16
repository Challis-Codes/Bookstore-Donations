import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Image, ActivityIndicator, KeyboardAvoidingView,
  Platform, Modal, Alert, Keyboard,
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { colors, globalStyles } from '../utils/styles';
import { checkAuthor, fetchBookByISBN } from '../utils/helpers';
import {
  ITEM_TYPES, HB_FICTION_GENRES, HB_NONFICTION_GENRES, DVD_TYPES, BIBLE_TYPES,
  calcAdultPaperbackFiction, calcAdultPaperbackNonFiction,
  calcHardbackFiction, calcHardbackNonFiction,
  calcKidTeen, calcComics, calcAudiobook, calcBoxedSet, calcDVD, calcBible,
  applyExclusions, roundToQuarter,
} from '../utils/creditCalc';

// ── Credit calculator dispatcher ──────────────────────────────────────────────
function computeCredit({ itemType, retail, genre, isNewOrPopular, dvdType, bibleType, boxedSetCredit, noDustjacket, isSigned }) {
  const r = parseFloat(retail) || 0;
  let base = null;
  let managerNote = null;

  switch (itemType) {
    case 'adult_pb_fiction':
      base = calcAdultPaperbackFiction(r);
      break;
    case 'adult_pb_nonfiction':
      base = calcAdultPaperbackNonFiction(r);
      break;
    case 'adult_hb_fiction': {
      const res = calcHardbackFiction(genre || 'other', r, isNewOrPopular);
      base = res.credit;
      managerNote = res.note;
      break;
    }
    case 'adult_hb_nonfiction': {
      const res = calcHardbackNonFiction(genre || 'other', r, isNewOrPopular);
      base = res.credit;
      managerNote = res.note;
      break;
    }
    case 'kid_teen':
      base = calcKidTeen(r);
      break;
    case 'comic_pb':
      base = calcComics(false, r);
      break;
    case 'comic_hb':
      base = calcComics(true, r);
      break;
    case 'audiobook':
      base = calcAudiobook(r);
      break;
    case 'boxed_set':
      base = calcBoxedSet(parseFloat(boxedSetCredit) || 0);
      break;
    case 'dvd_kids':
      if (dvdType === 'disney_bluray') {
        base = null;
        managerNote = 'Disney Blu-ray: give $1.50–$2.50 depending on condition.';
      } else {
        base = calcDVD(dvdType);
      }
      break;
    case 'dvd_anime':
      base = null;
      managerNote = 'Anime DVD: give 10% of lowest price found on Amazon.';
      break;
    case 'bible':
      base = calcBible(bibleType);
      break;
    default:
      base = null;
  }

  if (base !== null && (noDustjacket || isSigned)) {
    const adjusted = applyExclusions(base, { noDustjacket, isSigned });
    return { credit: adjusted.credit, notes: adjusted.notes, managerNote };
  }

  return { credit: base, notes: [], managerNote };
}

// ── Needs genre picker? ───────────────────────────────────────────────────────
function needsGenre(itemType) {
  return itemType === 'adult_hb_fiction' || itemType === 'adult_hb_nonfiction';
}
function needsNewPopular(itemType) {
  return itemType === 'adult_hb_fiction' || itemType === 'adult_hb_nonfiction';
}
function needsRetailPrice(itemType) {
  return !['dvd_kids', 'dvd_anime', 'bible'].includes(itemType);
}
function needsDVDType(itemType) { return itemType === 'dvd_kids'; }
function needsBibleType(itemType) { return itemType === 'bible'; }
function needsBoxedSet(itemType) { return itemType === 'boxed_set'; }

// ─────────────────────────────────────────────────────────────────────────────

export default function ScanScreen({ session, setSession }) {
  const [isbn, setIsbn] = useState('');
  const [bookInfo, setBookInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authorRule, setAuthorRule] = useState(null);
  const [showConditional, setShowConditional] = useState(false);
  const [accepted, setAccepted] = useState(null);

  // Credit form state
  const [itemType, setItemType] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [genre, setGenre] = useState('');
  const [isNewOrPopular, setIsNewOrPopular] = useState(false);
  const [dvdType, setDvdType] = useState('');
  const [bibleType, setBibleType] = useState('');
  const [boxedSetCredit, setBoxedSetCredit] = useState('');
  const [noDustjacket, setNoDustjacket] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  // Camera
  const [showCamera, setShowCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Success
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  // Conditional modal
  const [showModal, setShowModal] = useState(false);

  const inputRef = useRef(null);
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e'],
    onCodeScanned: (codes) => {
      if (scanned || codes.length === 0) return;
      const code = codes[0].value;
      if (code) {
        setScanned(true);
        setShowCamera(false);
        setIsbn(code);
        handleLookup(code);
      }
    },
  });

  const openCamera = async () => {
    if (!hasPermission) {
      const status = await Camera.requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('Camera Permission', 'Enable camera access in Settings to scan barcodes.');
        return;
      }
      setHasPermission(true);
    }
    setScanned(false);
    setShowCamera(true);
  };

  const resetForm = () => {
    setItemType('');
    setRetailPrice('');
    setGenre('');
    setIsNewOrPopular(false);
    setDvdType('');
    setBibleType('');
    setBoxedSetCredit('');
    setNoDustjacket(false);
    setIsSigned(false);
  };

  const handleLookup = async (isbnOverride) => {
    const trimmed = (isbnOverride || isbn).trim();
    if (!trimmed) return;
    setLoading(true);
    setBookInfo(null);
    setAccepted(null);
    resetForm();

    const found = await fetchBookByISBN(trimmed);
    setLoading(false);

    if (!found) { setBookInfo({ notFound: true }); return; }

    setBookInfo(found);
    const rule = checkAuthor(found.author);
    setAuthorRule(rule);

    if (!rule) setAccepted(true);
    else if (rule.status === 'reject') setAccepted(false);
    else if (rule.status === 'accept_all') setAccepted(true);
    else if (rule.status === 'conditional') { setShowModal(true); setAccepted(null); }
  };

  const handleKeep = () => { setShowModal(false); setAccepted(true); };
  const handleDontKeep = () => { setShowModal(false); setAccepted(false); };

  // Compute credit live
  const { credit, notes, managerNote } = computeCredit({
    itemType, retail: retailPrice, genre, isNewOrPopular,
    dvdType, bibleType, boxedSetCredit, noDustjacket, isSigned,
  });

  const canAdd = accepted === true && itemType && credit !== null && credit > 0 && !managerNote?.includes('Leave for Jo') && !managerNote?.includes('Set aside');

  const handleAddToSession = () => {
    if (!canAdd) return;
    Keyboard.dismiss();
    const typLabel = ITEM_TYPES.find(t => t.key === itemType)?.label || itemType;
    const newBook = {
      id: Date.now(),
      title: bookInfo?.title || 'Manual Entry',
      author: bookInfo?.author || '',
      itemType: typLabel,
      genre: genre || '',
      retail: parseFloat(retailPrice) || 0,
      credit,
      notes,
    };
    setSession(prev => [...prev, newBook]);
    setLastAdded(newBook);
    setShowSuccess(true);
    setIsbn('');
    setBookInfo(null);
    setAuthorRule(null);
    setAccepted(null);
    resetForm();
  };

  const borderColor = accepted === false ? colors.redBorder : accepted === true ? colors.greenBorder : colors.borderBrown;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Success Modal ── */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Book Added!</Text>
            {lastAdded && (
              <>
                <Text style={styles.successBookTitle}>{lastAdded.title}</Text>
                <Text style={styles.successMeta}>{lastAdded.itemType}{lastAdded.genre ? ` · ${lastAdded.genre}` : ''}</Text>
                {lastAdded.notes.length > 0 && (
                  <Text style={styles.successNotes}>{lastAdded.notes.join(' · ')}</Text>
                )}
                <View style={styles.successCreditRow}>
                  <Text style={styles.successCreditLabel}>Store Credit</Text>
                  <Text style={styles.successCreditAmount}>${lastAdded.credit.toFixed(2)}</Text>
                </View>
              </>
            )}
            <TouchableOpacity style={styles.successBtn} onPress={() => {
              setShowSuccess(false);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}>
              <Text style={styles.successBtnText}>Scan Next Book</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Conditional Author Modal ── */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={[styles.successBox, { borderColor: colors.gold }]}>
            <Text style={[styles.successTitle, { color: colors.gold, fontSize: 16 }]}>⚠ Special Rule</Text>
            <Text style={styles.successBookTitle}>{bookInfo?.title}</Text>
            <Text style={styles.successMeta}>by {bookInfo?.author}</Text>
            <View style={[styles.successCreditRow, { backgroundColor: colors.amberBg, borderColor: colors.amberBorder, borderWidth: 1, marginVertical: 14 }]}>
              <Text style={{ color: '#f0d090', fontSize: 14, fontFamily: 'Georgia', lineHeight: 20 }}>
                {authorRule?.note}
              </Text>
            </View>
            <Text style={{ color: '#a08050', fontFamily: 'Georgia', fontSize: 13, marginBottom: 16 }}>Does this book meet the criteria?</Text>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity style={[styles.successBtn, { flex: 1, backgroundColor: colors.redBg, borderWidth: 1, borderColor: colors.redBorder }]} onPress={handleDontKeep}>
                <Text style={[styles.successBtnText, { color: colors.red }]}>✗ Don't Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.successBtn, { flex: 1 }]} onPress={handleKeep}>
                <Text style={styles.successBtnText}>✓ Keep It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Camera Modal ── */}
      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {device ? (
            <>
              <Camera style={StyleSheet.absoluteFill} device={device} isActive={showCamera} codeScanner={codeScanner} />
              <View style={styles.camOverlay}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                <View style={{ flexDirection: 'row', height: 260 }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                  <View style={styles.viewfinder}>
                    {[styles.cTL, styles.cTR, styles.cBL, styles.cBR].map((s, i) => (
                      <View key={i} style={[styles.corner, s]} />
                    ))}
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
                </View>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: 24, gap: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, fontFamily: 'Georgia' }}>
                    Point at the barcode on the back of the book
                  </Text>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
                    <Text style={{ color: colors.goldLight, fontSize: 15, fontFamily: 'Georgia' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity onPress={() => setShowCamera(false)}>
                <Text style={{ color: colors.gold }}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <ScrollView style={globalStyles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* ISBN Input */}
        <View style={styles.section}>
          <Text style={globalStyles.labelText}>ISBN Barcode</Text>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
              <Text style={{ fontSize: 22 }}>📷</Text>
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={[styles.isbnInput, { flex: 1 }]}
              value={isbn}
              onChangeText={t => { setIsbn(t); setBookInfo(null); setAccepted(null); resetForm(); }}
              onSubmitEditing={() => handleLookup()}
              blurOnSubmit={false}
              placeholder="Scan or type ISBN…"
              placeholderTextColor={colors.textDim}
              keyboardType="numeric"
              returnKeyType="search"
            />
            <TouchableOpacity style={[styles.lookupBtn, loading && { opacity: 0.5 }]} onPress={() => handleLookup()} disabled={loading}>
              <Text style={styles.lookupBtnText}>{loading ? '…' : 'Go'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && (
          <View style={{ alignItems: 'center', padding: 20, gap: 8 }}>
            <ActivityIndicator color={colors.gold} />
            <Text style={{ color: colors.gold, fontFamily: 'Georgia' }}>Looking up book…</Text>
          </View>
        )}

        {bookInfo?.notFound && (
          <View style={[styles.statusBox, { borderColor: '#7a6020', backgroundColor: '#2d2010' }]}>
            <Text style={{ color: '#c09040', fontFamily: 'Georgia' }}>⚠ ISBN not found. Check the number and try again.</Text>
          </View>
        )}

        {/* Book result */}
        {bookInfo && !bookInfo.notFound && (
          <View style={[styles.bookCard, { borderColor }]}>

            {/* Book header */}
            <View style={styles.bookHeader}>
              {bookInfo.thumbnail ? <Image source={{ uri: bookInfo.thumbnail }} style={styles.cover} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle}>{bookInfo.title}</Text>
                <Text style={styles.bookAuthor}>by {bookInfo.author}</Text>
                {bookInfo.publishedDate ? <Text style={styles.bookYear}>{bookInfo.publishedDate}</Text> : null}
              </View>
            </View>

            {/* Rejected */}
            {accepted === false && (
              <View style={[styles.statusBox, { borderColor: colors.redBorder, backgroundColor: colors.redBg }]}>
                <Text style={{ color: colors.red, fontWeight: 'bold', fontFamily: 'Georgia' }}>✗ DO NOT ACCEPT</Text>
                {authorRule?.status === 'reject' && (
                  <Text style={{ color: colors.redText, fontSize: 12, marginTop: 4, fontFamily: 'Georgia' }}>{authorRule.author} is on the Do Not Take list.</Text>
                )}
              </View>
            )}

            {/* Accepted — show credit form */}
            {accepted === true && (
              <>
                <View style={[styles.statusBox, { borderColor: colors.greenBorder, backgroundColor: colors.greenBg, marginBottom: 16 }]}>
                  <Text style={{ color: colors.greenText, fontFamily: 'Georgia' }}>
                    {authorRule?.status === 'accept_all' ? `✓ Accept All — ${authorRule.author}`
                      : authorRule?.status === 'conditional' ? '✓ Accepted — meets special rule criteria'
                      : '✓ Accepted'}
                  </Text>
                </View>

                {/* Item Type */}
                <Text style={globalStyles.labelText}>Item Type</Text>
                <View style={styles.pillGrid}>
                  {ITEM_TYPES.map(t => (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.pill, itemType === t.key && styles.pillSelected]}
                      onPress={() => { setItemType(t.key); setGenre(''); setDvdType(''); setBibleType(''); }}
                    >
                      <Text style={[styles.pillText, itemType === t.key && styles.pillTextSelected]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Retail Price */}
                {itemType !== '' && needsRetailPrice(itemType) && (
                  <View style={styles.formRow}>
                    <Text style={globalStyles.labelText}>
                      {itemType === 'boxed_set' ? 'Individual Books Credit Total ($)' : 'Cover / Retail Price ($)'}
                    </Text>
                    <TextInput
                      style={styles.priceInput}
                      value={itemType === 'boxed_set' ? boxedSetCredit : retailPrice}
                      onChangeText={itemType === 'boxed_set' ? setBoxedSetCredit : setRetailPrice}
                      placeholder="0.00"
                      placeholderTextColor={colors.textDim}
                      keyboardType="decimal-pad"
                    />
                  </View>
                )}

                {/* Genre picker for hardbacks */}
                {itemType !== '' && needsGenre(itemType) && (
                  <View style={styles.formRow}>
                    <Text style={globalStyles.labelText}>Genre</Text>
                    <View style={styles.pillGrid}>
                      {(itemType === 'adult_hb_fiction' ? HB_FICTION_GENRES : HB_NONFICTION_GENRES).map(g => (
                        <TouchableOpacity
                          key={g.key}
                          style={[styles.pill, genre === g.key && styles.pillSelected]}
                          onPress={() => setGenre(g.key)}
                        >
                          <Text style={[styles.pillText, genre === g.key && styles.pillTextSelected]}>{g.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* New/Popular toggle for hardbacks */}
                {itemType !== '' && needsNewPopular(itemType) && genre !== '' && (
                  <TouchableOpacity style={[styles.toggleRow, isNewOrPopular && styles.toggleRowActive]} onPress={() => setIsNewOrPopular(p => !p)}>
                    <Text style={[styles.toggleText, isNewOrPopular && { color: colors.greenText }]}>
                      {isNewOrPopular ? '✓' : '○'} New or Popular title (+$1.00)
                    </Text>
                  </TouchableOpacity>
                )}

                {/* DVD type */}
                {itemType !== '' && needsDVDType(itemType) && (
                  <View style={styles.formRow}>
                    <Text style={globalStyles.labelText}>DVD Type</Text>
                    <View style={styles.pillGrid}>
                      {DVD_TYPES.map(d => (
                        <TouchableOpacity key={d.key} style={[styles.pill, dvdType === d.key && styles.pillSelected]} onPress={() => setDvdType(d.key)}>
                          <Text style={[styles.pillText, dvdType === d.key && styles.pillTextSelected]}>{d.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Bible type */}
                {itemType !== '' && needsBibleType(itemType) && (
                  <View style={styles.formRow}>
                    <Text style={globalStyles.labelText}>Bible Type</Text>
                    <View style={styles.pillGrid}>
                      {BIBLE_TYPES.map(b => (
                        <TouchableOpacity key={b.key} style={[styles.pill, bibleType === b.key && styles.pillSelected]} onPress={() => setBibleType(b.key)}>
                          <Text style={[styles.pillText, bibleType === b.key && styles.pillTextSelected]}>{b.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Exclusion toggles */}
                {itemType !== '' && (
                  <View style={styles.formRow}>
                    <Text style={globalStyles.labelText}>Exclusions</Text>
                    <TouchableOpacity style={[styles.toggleRow, noDustjacket && styles.toggleRowWarn]} onPress={() => setNoDustjacket(p => !p)}>
                      <Text style={[styles.toggleText, noDustjacket && { color: '#ffaa50' }]}>
                        {noDustjacket ? '✓' : '○'} No dustjacket (-$1.00)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleRow, isSigned && styles.toggleRowActive]} onPress={() => setIsSigned(p => !p)}>
                      <Text style={[styles.toggleText, isSigned && { color: colors.greenText }]}>
                        {isSigned ? '✓' : '○'} Signed copy (check Goodreads)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Manager note */}
                {managerNote && (
                  <View style={[styles.statusBox, { borderColor: colors.amberBorder, backgroundColor: colors.amberBg, marginBottom: 10 }]}>
                    <Text style={{ color: '#f0d090', fontFamily: 'Georgia', fontSize: 13, lineHeight: 20 }}>⚠ {managerNote}</Text>
                  </View>
                )}

                {/* Adjustment notes */}
                {notes.length > 0 && (
                  <View style={[styles.statusBox, { borderColor: '#4a6020', backgroundColor: '#1e2d10', marginBottom: 10 }]}>
                    {notes.map((n, i) => <Text key={i} style={{ color: '#a0c878', fontFamily: 'Georgia', fontSize: 12 }}>{n}</Text>)}
                  </View>
                )}

                {/* Credit result */}
                {credit !== null && !managerNote?.includes('Leave for Jo') && !managerNote?.includes('Set aside') && (
                  <View style={styles.creditBox}>
                    <Text style={styles.creditLabel}>Store Credit</Text>
                    <Text style={styles.creditAmount}>${credit.toFixed(2)}</Text>
                  </View>
                )}

                {/* Add button */}
                <TouchableOpacity style={[styles.addBtn, !canAdd && styles.addBtnDisabled]} onPress={handleAddToSession} disabled={!canAdd}>
                  <Text style={[styles.addBtnText, !canAdd && { color: '#5a6040' }]}>+ Add to Session Tally</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  section: { marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 8 },
  cameraBtn: { backgroundColor: '#8b5e2a', borderRadius: 8, width: 48, alignItems: 'center', justifyContent: 'center' },
  isbnInput: { backgroundColor: '#2d1f0e', borderWidth: 1, borderColor: colors.borderBrown, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 15, fontFamily: 'monospace' },
  lookupBtn: { backgroundColor: '#8b5e2a', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  lookupBtnText: { color: colors.goldLight, fontFamily: 'Georgia', fontWeight: 'bold', fontSize: 13 },
  hint: { fontSize: 11, color: colors.textDim, marginTop: 6, fontFamily: 'Georgia' },
  statusBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  bookCard: { backgroundColor: '#2d1f0e', borderWidth: 1, borderRadius: 10, padding: 16 },
  bookHeader: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  cover: { width: 55, borderRadius: 4, resizeMode: 'cover' },
  bookTitle: { fontSize: 17, fontWeight: 'bold', color: colors.goldLight, fontFamily: 'Georgia', lineHeight: 22 },
  bookAuthor: { fontSize: 13, color: colors.textMuted, marginTop: 3, fontFamily: 'Georgia' },
  bookYear: { fontSize: 12, color: colors.textDim, marginTop: 2, fontFamily: 'Georgia' },
  formRow: { marginBottom: 14 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 4 },
  pill: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#2a1e08', borderWidth: 1, borderColor: colors.borderBrown },
  pillSelected: { backgroundColor: '#4a7020', borderColor: '#6a9030' },
  pillText: { fontSize: 12, color: '#b09050', fontFamily: 'Georgia' },
  pillTextSelected: { color: '#d4f0a0' },
  priceInput: { backgroundColor: '#1a1207', borderWidth: 1, borderColor: colors.borderBrown, borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 18, fontFamily: 'Georgia', width: 120 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, backgroundColor: '#1a1207', borderWidth: 1, borderColor: colors.borderBrown, marginBottom: 6 },
  toggleRowActive: { backgroundColor: '#1a2d10', borderColor: colors.greenBorder },
  toggleRowWarn: { backgroundColor: '#2d1a00', borderColor: '#8b6020' },
  toggleText: { fontSize: 13, color: colors.textMuted, fontFamily: 'Georgia' },
  creditBox: { backgroundColor: '#1e2d10', borderWidth: 1, borderColor: '#4a7020', borderRadius: 8, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 6 },
  creditLabel: { color: '#a0c878', fontSize: 13, fontFamily: 'Georgia' },
  creditAmount: { color: colors.green, fontSize: 26, fontWeight: 'bold', fontFamily: 'Georgia' },
  addBtn: { backgroundColor: '#4a7020', borderRadius: 8, padding: 14, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#2a3010' },
  addBtnText: { color: '#d4f0a0', fontSize: 14, fontFamily: 'Georgia', fontWeight: 'bold' },

  // Success modal
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  successBox: { backgroundColor: '#1e2d10', borderWidth: 2, borderColor: '#4a8020', borderRadius: 16, padding: 28, width: '100%', alignItems: 'center' },
  successIcon: { fontSize: 44, marginBottom: 6 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: colors.green, fontFamily: 'Georgia', marginBottom: 14 },
  successBookTitle: { fontSize: 16, fontWeight: 'bold', color: colors.goldLight, fontFamily: 'Georgia', textAlign: 'center', marginBottom: 4 },
  successMeta: { fontSize: 13, color: colors.textMuted, fontFamily: 'Georgia', marginBottom: 8 },
  successNotes: { fontSize: 12, color: '#80a050', fontFamily: 'Georgia', marginBottom: 10, textAlign: 'center' },
  successCreditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', backgroundColor: '#162408', borderRadius: 8, padding: 14, marginBottom: 20 },
  successCreditLabel: { fontSize: 13, color: '#80a050', fontFamily: 'Georgia' },
  successCreditAmount: { fontSize: 26, fontWeight: 'bold', color: colors.green, fontFamily: 'Georgia' },
  successBtn: { backgroundColor: '#4a7020', borderRadius: 8, paddingVertical: 13, paddingHorizontal: 32, alignItems: 'center' },
  successBtnText: { color: '#d4f0a0', fontSize: 15, fontFamily: 'Georgia', fontWeight: 'bold' },

  // Camera
  camOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  viewfinder: { width: 260, height: 260 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: colors.gold },
  cTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  cancelBtn: { borderWidth: 1, borderColor: colors.gold, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 40 },
});
