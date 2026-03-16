// ─── CREDIT CALCULATION ENGINE ───────────────────────────────────────────────
// Based on the store's official credit guide

// ── Adult Paperback Fiction ───────────────────────────────────────────────────
export function calcAdultPaperbackFiction(retail) {
  if (retail < 1.00) return 0;
  if (retail <= 4.00) return 0.25;
  if (retail <= 6.98) return 0.50;
  if (retail <= 8.99) return 0.75;
  if (retail <= 12.99) return 1.00;
  if (retail <= 14.99) return 1.50;
  if (retail <= 17.00) return 2.00;
  if (retail <= 19.99) return 2.50;
  return roundToQuarter(retail * 0.15); // 20.00+
}

// ── Adult Paperback Non-Fiction ───────────────────────────────────────────────
// Uses same tier table as fiction
export function calcAdultPaperbackNonFiction(retail) {
  return calcAdultPaperbackFiction(retail);
}

// ── Hardback Fiction ──────────────────────────────────────────────────────────
// Returns { credit, note } — some cases need manager
export function calcHardbackFiction(genre, retail, isNewOrPopular) {
  const g = genre.toLowerCase();

  if (g === 'mystery' || g === 'romance') {
    if (isNewOrPopular) return { credit: 2.00, note: null };
    return { credit: 1.00, note: null };
  }
  if (g === 'horror') {
    return { credit: 2.00, note: null };
  }
  if (g === 'classics') {
    if (retail >= 30) return { credit: null, note: 'Retail is $30+. Leave for Jo.' };
    if (retail <= 12.00) return { credit: 1.00, note: null };
    return { credit: 2.00, note: null };
  }
  // All other fiction hardback genres
  const isDollar4Author = false; // user will indicate this
  if (isNewOrPopular) return { credit: 2.00, note: null };
  return { credit: 1.00, note: 'Give $1.00 unless new/popular ($2.00). If $4.00 author, give $1.00 unless new.' };
}

// ── Hardback Non-Fiction ──────────────────────────────────────────────────────
export function calcHardbackNonFiction(genre, retail, isNewOrPopular) {
  const g = genre.toLowerCase();

  if (['history', 'science', 'mythology', 'wars'].includes(g)) {
    if (isNewOrPopular) return { credit: 2.00, note: null };
    return { credit: 1.00, note: null };
  }
  if (g === 'religion') {
    if (isNewOrPopular) return { credit: 2.00, note: null };
    return { credit: 1.00, note: null };
  }
  if (g === 'cookbooks') {
    if (retail > 30) return { credit: 2.00, note: null };
    return { credit: 1.50, note: null };
  }
  // Sports, Adventure, Survival, Art, Art History, Humor, Pets, Animals, Music, etc.
  return { credit: roundToQuarter(retail * 0.05), note: '5% of retail price' };
}

// ── Kid / Teen Books ──────────────────────────────────────────────────────────
export function calcKidTeen(retail) {
  if (retail < 2.00) return 0.10;
  if (retail <= 4.50) return 0.25;
  if (retail <= 6.99) return 0.50;
  if (retail <= 9.00) return 1.00;
  if (retail <= 11.00) return 1.50;
  if (retail <= 16.00) return 2.00;
  if (retail <= 19.99) return 2.50;
  return roundToQuarter(retail * 0.15); // 20.00+
}

// ── Comics & Graphic Novels ───────────────────────────────────────────────────
export function calcComics(isHardback, retail) {
  if (!isHardback) {
    // Paperback uses adult paperback fiction rates; loose singles = $0.25
    return calcAdultPaperbackFiction(retail);
  }
  // Hardback: ~10% of retail
  return roundToQuarter(retail * 0.10);
}

// ── Audiobooks ────────────────────────────────────────────────────────────────
export function calcAudiobook(retail) {
  // 10% of retail price, typically $2.00–$3.50
  return roundToQuarter(retail * 0.10);
}

// ── Boxed Sets ────────────────────────────────────────────────────────────────
// Credit = individual book price (user determines) + $1 for the box
export function calcBoxedSet(individualBooksCredit) {
  return individualBooksCredit + 1.00;
}

// ── DVDs ──────────────────────────────────────────────────────────────────────
export function calcDVD(type) {
  switch (type) {
    case 'disney': return 1.00;
    case 'disney_bluray': return null; // range $1.50–$2.50, user picks
    case 'other': return 0.50;
    case 'anime': return null; // 10% of lowest Amazon price
    default: return null;
  }
}

// ── Bibles ────────────────────────────────────────────────────────────────────
export function calcBible(type) {
  switch (type) {
    case 'small_5in': return 0.50;
    case 'small_6in': return 1.00;
    case 'regular_os_pb': return 1.50;
    case 'leather_small': return 1.00;
    case 'leather_os_pb': return 2.00;
    case 'hb_fiction_size': return 2.00;
    default: return null;
  }
}

// ── Exclusion Adjustments ─────────────────────────────────────────────────────
export function applyExclusions(credit, { noDustjacket = false, isSigned = false, goodreadsRatings = null }) {
  let adjusted = credit;
  let notes = [];

  if (noDustjacket) {
    adjusted = Math.max(0, adjusted - 1.00);
    notes.push('No dustjacket: -$1.00');
  }
  if (isSigned) {
    if (goodreadsRatings !== null && goodreadsRatings < 40000) {
      adjusted += 1.00;
      notes.push('Signed copy (<40k ratings): +$1.00');
    } else if (goodreadsRatings !== null && goodreadsRatings >= 40000) {
      notes.push('Signed copy (40k+ ratings): Set aside for manager/Jo');
    } else {
      notes.push('Signed copy: check Goodreads ratings');
    }
  }

  return { credit: roundToQuarter(adjusted), notes };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function roundToQuarter(amount) {
  return Math.round(amount * 4) / 4;
}

// ── Item Types (for UI picker) ────────────────────────────────────────────────
export const ITEM_TYPES = [
  { key: 'adult_pb_fiction',    label: 'Adult Paperback — Fiction' },
  { key: 'adult_pb_nonfiction', label: 'Adult Paperback — Non-Fiction' },
  { key: 'adult_hb_fiction',    label: 'Adult Hardback — Fiction' },
  { key: 'adult_hb_nonfiction', label: 'Adult Hardback — Non-Fiction' },
  { key: 'kid_teen',            label: 'Kid / Teen Book' },
  { key: 'comic_pb',            label: 'Comic / Graphic Novel — Paperback' },
  { key: 'comic_hb',            label: 'Comic / Graphic Novel — Hardback' },
  { key: 'audiobook',           label: 'Audiobook' },
  { key: 'boxed_set',           label: 'Boxed Set' },
  { key: 'dvd_kids',            label: 'DVD — Kids' },
  { key: 'dvd_anime',           label: 'DVD — Anime' },
  { key: 'bible',               label: 'Bible' },
];

// ── Hardback Fiction Genres ───────────────────────────────────────────────────
export const HB_FICTION_GENRES = [
  { key: 'mystery',  label: 'Mystery' },
  { key: 'romance',  label: 'Romance' },
  { key: 'horror',   label: 'Horror' },
  { key: 'classics', label: 'Classics' },
  { key: 'other',    label: 'Other Fiction' },
];

// ── Hardback Non-Fiction Genres ───────────────────────────────────────────────
export const HB_NONFICTION_GENRES = [
  { key: 'history',   label: 'History / Science / Mythology / Wars' },
  { key: 'religion',  label: 'Religion' },
  { key: 'cookbooks', label: 'Cookbooks' },
  { key: 'other',     label: 'Sports / Art / Humor / Pets / Music / Other' },
];

// ── DVD Subtypes ──────────────────────────────────────────────────────────────
export const DVD_TYPES = [
  { key: 'disney',       label: 'Disney — $1.00' },
  { key: 'disney_bluray',label: 'Disney Blu-ray — $1.50–$2.50' },
  { key: 'other',        label: 'All Others — $0.50' },
];

// ── Bible Subtypes ────────────────────────────────────────────────────────────
export const BIBLE_TYPES = [
  { key: 'small_5in',     label: 'Small 5" and under — $0.50' },
  { key: 'small_6in',     label: 'Small 6" — $1.00' },
  { key: 'regular_os_pb', label: 'Regular OS/PB size — $1.50' },
  { key: 'leather_small', label: 'Leather/Pleather small — $1.00' },
  { key: 'leather_os_pb', label: 'Leather/Pleather regular OS/PB — $2.00' },
  { key: 'hb_fiction_size',label: 'HB Fiction size — $2.00' },
];
