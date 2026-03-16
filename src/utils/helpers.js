import { AUTHOR_RULES } from '../data/authorRules';

// ── Author Matching ───────────────────────────────────────────────────────────
export function checkAuthor(authorFromBook) {
  const norm = s => s.toLowerCase().trim();
  const bookNorm = norm(authorFromBook);

  let bookLastName, bookFirstName;
  if (bookNorm.includes(',')) {
    [bookLastName, bookFirstName = ''] = bookNorm.split(',').map(s => s.trim());
  } else {
    const parts = bookNorm.split(' ');
    bookLastName = parts[parts.length - 1];
    bookFirstName = parts.slice(0, -1).join(' ');
  }

  for (const rule of AUTHOR_RULES) {
    const [ruleLastName, ruleFirstName = ''] = norm(rule.author).split(',').map(s => s.trim());
    if (bookLastName !== ruleLastName) continue;
    if (!ruleFirstName || !bookFirstName) return rule;
    if (bookFirstName.startsWith(ruleFirstName) || ruleFirstName.startsWith(bookFirstName)) return rule;
  }
  return null;
}

// ── Genre Cleaning ────────────────────────────────────────────────────────────
export function cleanGenres(rawSubjects) {
  const blocked = [
    'nonfiction', 'accessible book', 'protected daisy', 'internet archive',
    'in library', 'overdrive', 'large type books', 'fiction in english',
  ];
  const seen = new Set();
  const result = [];

  for (const subject of rawSubjects) {
    const parts = subject.split(/[,/]+/);
    for (const part of parts) {
      const clean = part.trim().toLowerCase();
      if (!clean || clean.includes(':') || clean.includes('[') || clean.length < 3) continue;
      if (blocked.some(b => clean.includes(b))) continue;
      if (!seen.has(clean)) {
        seen.add(clean);
        result.push(clean.charAt(0).toUpperCase() + clean.slice(1));
      }
    }
  }
  return result.slice(0, 10);
}

// ── Open Library API ──────────────────────────────────────────────────────────
export async function fetchBookByISBN(isbn) {
  const clean = isbn.replace(/-/g, '').trim();
  try {
    // Primary: Books API
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`
    );
    const data = await res.json();
    const key = `ISBN:${clean}`;

    if (data[key]) {
      const book = data[key];
      const authors = (book.authors || []).map(a => a.name).join(', ');
      const subjects = cleanGenres((book.subjects || []).map(s => s.name || s));
      const thumbnail =
        book.cover?.large || book.cover?.medium || book.cover?.small || null;

      return {
        title: book.title || 'Unknown Title',
        author: authors || 'Unknown Author',
        genres: subjects,
        thumbnail,
        publishedDate: book.publish_date || '',
      };
    }

    // Fallback: Search API
    const searchRes = await fetch(
      `https://openlibrary.org/search.json?isbn=${clean}&limit=1`
    );
    const searchData = await searchRes.json();

    if (searchData.docs && searchData.docs.length > 0) {
      const doc = searchData.docs[0];
      const thumbnail = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : null;
      const subjects = cleanGenres(doc.subject || []);

      return {
        title: doc.title || 'Unknown Title',
        author: (doc.author_name || []).join(', ') || 'Unknown Author',
        genres: subjects,
        thumbnail,
        publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : '',
      };
    }

    return null;
  } catch (e) {
    return null;
  }
}
