<<<<<<< HEAD
# Bookstore Donations App

A React Native app for receiving book donations at a bookstore.

## Features
- ISBN lookup via Open Library API
- Author Do Not Take list with conditional rules
- Genre suggestions from Open Library
- Session tally with store credit calculation

## Project Structure
```
BookstoreDonations/
├── App.js                          # Root component + navigation
├── src/
│   ├── data/
│   │   └── authorRules.js          # DNT list + credit rates
│   ├── utils/
│   │   ├── helpers.js              # Author matching, genre cleaning, API fetch
│   │   └── styles.js               # Shared colors + styles
│   ├── components/
│   │   └── ConditionalModal.js     # Popup for special author rules
│   └── screens/
│       ├── ScanScreen.js           # Main ISBN scan + accept/reject flow
│       ├── SessionScreen.js        # Running session tally
│       └── DNTScreen.js            # Browse DNT/conditional/accept-all lists
```

## Setup (once Xcode is installed)

1. Install React Native CLI:
```bash
npm install -g react-native-cli
```

2. Create a new React Native project:
```bash
npx react-native@latest init BookstoreDonations
cd BookstoreDonations
```

3. Replace the generated files with the files from this folder:
   - Replace `App.js` with this project's `App.js`
   - Copy the entire `src/` folder into the project

4. Run on iPhone:
```bash
npx react-native run-ios
```

## Next Step: ISBN Camera Scanner
Install the vision camera library:
```bash
npm install react-native-vision-camera
cd ios && pod install
```
This replaces the text input with a live camera barcode scanner.

## Updating Credit Rates
Edit `src/data/authorRules.js` and update the `CREDIT_RATES` object:
```js
export const CREDIT_RATES = {
  oversized:  { base: 4.00, label: 'Oversized' },
  hardback:   { base: 2.50, label: 'Hardback' },
  mmpb:       { base: 1.00, label: 'Mass Market Paperback' },
  mmpb_long:  { base: 1.25, label: 'Mass Market PB (Long)' },
};
```
=======
# Bookstore-Donations
>>>>>>> f34b9ca81770588a59165e49b24af5c43bdcbff5
