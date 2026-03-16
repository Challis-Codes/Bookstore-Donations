# 📚 Bookstore Donations

A React Native app built for receiving book donations at a used bookstore. Designed to speed up the donation process by replacing manual lookups with a fast, phone-based workflow.

## What it does

- **Scans ISBNs** using the phone camera or manual entry
- **Looks up book info** (title, author, cover, genre suggestions) via the Open Library API
- **Checks the Do Not Take list** automatically — flags rejected authors and surfaces conditional rules (e.g. "Take 2018 and newer only")
- **Calculates store credit** based on the store's credit guide, including item type, retail price, genre, and exclusions like missing dustjackets or signed copies
- **Tracks a session tally** of all accepted books and total credit earned, with the ability to edit or remove entries

## Item types supported

- Adult Paperback — Fiction & Non-Fiction
- Adult Hardback — Fiction & Non-Fiction
- Kid / Teen Books
- Comics & Graphic Novels
- Audiobooks
- Boxed Sets
- DVDs (Kids, Anime)
- Bibles

## Tech stack

- React Native
- Open Library API (ISBN lookup)
- react-native-vision-camera (barcode scanning)

## Project structure

```
src/
├── data/
│   └── authorRules.js       # Do Not Take list + credit rates
├── utils/
│   ├── creditCalc.js        # Credit calculation engine
│   ├── helpers.js           # Author matching, genre cleaning, API fetch
│   └── styles.js            # Shared colors + styles
├── components/
│   └── ConditionalModal.js  # Popup for special author rules
└── screens/
    ├── ScanScreen.js        # Main scan + accept/reject flow
    ├── SessionScreen.js     # Running session tally
    └── DNTScreen.js         # Browse DNT/conditional/accept-all lists
```

## Setup

1. Install dependencies:
```bash
npm install
cd ios && pod install && cd ..
```

2. Run on iPhone:
```bash
npx react-native run-ios --device
```

## Updating the DNT list or credit rates

- **DNT list** — edit `src/data/authorRules.js`
- **Credit rates** — edit `src/utils/creditCalc.js`
