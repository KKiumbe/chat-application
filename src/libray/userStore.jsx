import { create } from 'zustand'
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export const useUserStore = create((set) => ({
  currentUser: null,
  loading: true,
  error: null,
  fetchUser: async () => { // No UID argument needed
    set({ loading: true, error: null });

    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log("Document data:", docSnap.data());
          set({ currentUser: docSnap.data(), loading: false });
        } else {
          console.log("No such document!");
          set({ currentUser: null, loading: false });
        }
      } else {
        console.log("No user signed in");
        set({ currentUser: null, loading: false });
      }
    });
  }
}))