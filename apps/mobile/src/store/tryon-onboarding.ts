import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'n2431.tryonOnboarding.v2';

export type BodyType = 'slim' | 'medium' | 'full';

interface Snapshot {
  heightCm: number | null;
  bodyType: BodyType | null;
  faceUri: string | null;
  // Server-cropped, transparent-background PNG of just the face. Produced by
  // ml-face's /face-only route after the user takes their selfie, used as the
  // overlay on top of every mannequin render so there's no background rim.
  faceOverlayUrl: string | null;
  storeId: string | null;
  completed: boolean;
}

interface State extends Snapshot {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setHeight: (cm: number) => Promise<void>;
  setBodyType: (t: BodyType) => Promise<void>;
  setFace: (uri: string) => Promise<void>;
  setFaceOverlayUrl: (url: string | null) => Promise<void>;
  setStore: (id: string) => Promise<void>;
  markComplete: () => Promise<void>;
  reset: () => Promise<void>;
}

const EMPTY: Snapshot = {
  heightCm: null,
  bodyType: null,
  faceUri: null,
  faceOverlayUrl: null,
  storeId: null,
  completed: false,
};

async function persist(snap: Snapshot) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(snap));
  } catch {
    // best-effort — losing this just re-runs onboarding, not a crash
  }
}

export const useTryonOnboarding = create<State>((set, get) => ({
  ...EMPTY,
  hydrated: false,

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Snapshot>;
        set({
          heightCm: parsed.heightCm ?? null,
          bodyType: parsed.bodyType ?? null,
          faceUri: parsed.faceUri ?? null,
          faceOverlayUrl: parsed.faceOverlayUrl ?? null,
          storeId: parsed.storeId ?? null,
          completed: parsed.completed ?? false,
          hydrated: true,
        });
        return;
      }
    } catch {
      // fall through to empty
    }
    set({ ...EMPTY, hydrated: true });
  },

  async setHeight(cm) {
    const next = { ...currentSnap(get()), heightCm: cm };
    set(next);
    await persist(next);
  },

  async setBodyType(t) {
    const next = { ...currentSnap(get()), bodyType: t };
    set(next);
    await persist(next);
  },

  async setFace(uri) {
    const next = { ...currentSnap(get()), faceUri: uri };
    set(next);
    await persist(next);
  },

  async setFaceOverlayUrl(url) {
    const next = { ...currentSnap(get()), faceOverlayUrl: url };
    set(next);
    await persist(next);
  },

  async setStore(id) {
    const next = { ...currentSnap(get()), storeId: id };
    set(next);
    await persist(next);
  },

  async markComplete() {
    const next = { ...currentSnap(get()), completed: true };
    set(next);
    await persist(next);
  },

  async reset() {
    set({ ...EMPTY, hydrated: true });
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  },
}));

function currentSnap(s: State): Snapshot {
  return {
    heightCm: s.heightCm,
    bodyType: s.bodyType,
    faceUri: s.faceUri,
    faceOverlayUrl: s.faceOverlayUrl,
    storeId: s.storeId,
    completed: s.completed,
  };
}
