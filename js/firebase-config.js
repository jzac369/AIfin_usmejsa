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
  apiKey: "VLOZ_SEM_API_KEY",
  authDomain: "VLOZ_SEM_PROJEKT.firebaseapp.com",
  projectId: "VLOZ_SEM_PROJEKT_ID",
  storageBucket: "VLOZ_SEM_PROJEKT.appspot.com",
  messagingSenderId: "VLOZ_SEM_SENDER_ID",
  appId: "VLOZ_SEM_APP_ID"
};
