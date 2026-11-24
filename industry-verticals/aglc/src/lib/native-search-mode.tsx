'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

const NativeSearchMode = createContext(false);

export function NativeSearchModeProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <NativeSearchMode.Provider value={enabled}>{children}</NativeSearchMode.Provider>;
}

export function useNativeSearchMode() {
  return useContext(NativeSearchMode);
}
