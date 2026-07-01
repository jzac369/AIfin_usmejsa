// ============================================================
// FIREBASE KONFIGURÁCIA
// ------------------------------------------------------------
// Toto je ZÁSTUPNÝ (placeholder) config. Postup nastavenia
// nájdeš v README.md v sekcii "Nastavenie Firebase".
//
// 1. Choď na https://console.firebase.google.com
// 2. Vytvor nový projekt (napr. "aifin-usmejsa")
// 3. Pridaj web aplikáciu ("</> Web") -> skopíruj firebaseConfig
// 4. Vlož hodnoty nižšie
// 5. V konzole zapni: Build -> Firestore Database (vytvoriť databázu)
// 6. V konzole zapni: Build -> Authentication -> Sign-in method -> Email/Password
// 7. V Authentication -> Users -> "Add user" vytvor admin účet
//    (email + heslo, ktorým sa budeš prihlasovať do admin zóny)
// 8. Vlož obsah firestore.rules do Firestore -> Rules a publikuj
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyAwmXjLB079vLxnn3L7DcXcq5vOLKDvC9M",
  authDomain: "aifin-usmejsa-61c81.firebaseapp.com",
  projectId: "aifin-usmejsa-61c81",
  storageBucket: "aifin-usmejsa-61c81.firebasestorage.app",
  messagingSenderId: "530051162073",
  appId: "1:530051162073:web:12dff0fb171c6e17f383c8"
};
