'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Library } from '@/src/gds/container';

type GdsContextType = {
  structureName: string;
  libraryObject: object;
  library: Library | undefined;
} | null;

// Contextを作成
const GdsContext = createContext({
  structureName: "",
  libraryObject: undefined,
  library: undefined
});

// Providerコンポーネントを作成
export function GdsProvider({ children, initialData }: { children: ReactNode, initialData: GdsContextType}) {
  const [gdsContext, setGdsContext ] = useState<GdsContextType>(initialData);

  // const updateLibrary: GdsContextType = {
  //   structureName: gdsContext?.structureName,
  //   libraryObject: gdsContext?.libraryObject,
  //   library: Library.fromObject(gdsContext?.libraryObject)
  // };

  // setGdsContext(updateLibrary);

  return (
    <GdsContext.Provider value={ {gdsContext, setGdsContext }}>
      {children}
    </GdsContext.Provider>
  );
}

export function useGdsContext() {
  return useContext(GdsContext);
}
