'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type GdsContextType = {
  structureName: string;
  libraryObject: object;
} | null;

// Contextを作成
const GdsContext = createContext({
  structureName: "",
  libraryObject: undefined
});

// Providerコンポーネントを作成
export function GdsProvider({ children, initialData }: { children: ReactNode, initialData: GdsContextType}) {
  const [gdsContext, setGdsContext ] = useState<GdsContextType>(initialData);

  return (
    <GdsContext.Provider value={ {gdsContext, setGdsContext }}>
      {children}
    </GdsContext.Provider>
  );
}

export function useGdsContext() {
  return useContext(GdsContext);
}
