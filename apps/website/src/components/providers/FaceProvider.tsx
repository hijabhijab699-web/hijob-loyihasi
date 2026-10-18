'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type BodyType = 'slim' | 'medium' | 'full';

interface FaceState {
  faceUri: string | null;
  bodyType: BodyType | null;
}

interface FaceContextValue extends FaceState {
  isHydrated: boolean;
  setFace: (uri: string | null) => void;
  setBody: (b: BodyType) => void;
  clear: () => void;
  isScanned: boolean;
}

const KEY = 'hijob.face';
const FaceContext = createContext<FaceContextValue | null>(null);

export function FaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FaceState>({
    faceUri: null,
    bodyType: null,
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setState({
            faceUri: typeof parsed.faceUri === 'string' ? parsed.faceUri : null,
            bodyType:
              parsed.bodyType === 'slim' ||
              parsed.bodyType === 'medium' ||
              parsed.bodyType === 'full'
                ? parsed.bodyType
                : null,
          });
        }
      }
    } catch {
      /* ignore */
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, isHydrated]);

  const setFace = useCallback(
    (uri: string | null) => setState((s) => ({ ...s, faceUri: uri })),
    [],
  );
  const setBody = useCallback(
    (b: BodyType) => setState((s) => ({ ...s, bodyType: b })),
    [],
  );
  const clear = useCallback(
    () => setState({ faceUri: null, bodyType: null }),
    [],
  );

  const value = useMemo<FaceContextValue>(
    () => ({
      ...state,
      isHydrated,
      setFace,
      setBody,
      clear,
      isScanned: Boolean(state.faceUri && state.bodyType),
    }),
    [state, isHydrated, setFace, setBody, clear],
  );

  return <FaceContext.Provider value={value}>{children}</FaceContext.Provider>;
}

export function useFace() {
  const ctx = useContext(FaceContext);
  if (!ctx) throw new Error('useFace must be used within FaceProvider');
  return ctx;
}
