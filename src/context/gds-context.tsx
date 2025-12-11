'use client';

import { createContext, useContext, useState, ReactNode, Context } from 'react';
import { Library, Structure } from '@/gds/container';

interface GdsContextType {
  structureName: string;
  libraryObject: object | undefined;
  library: Library | undefined;
};

const GdsContext: Context<GdsContextType> = createContext<GdsContextType>({
  gdsContext: {
    structureName: "",
    libraryObject: undefined,
    library: undefined
  },
  setGdsContext: (context: GdsContextType) => {}
});


export function GdsProvider({ children, initialData }: { children: ReactNode, initialData: GdsContextType}) {
  const [gdsContext, setGdsContext ] = useState<GdsContextType>(initialData);

  return (
    <GdsContext.Provider value={ {gdsContext, setGdsContext }}>
      {children}
    </GdsContext.Provider>
  );
}

export function useGdsContext() {
  return useContext<GdsContextType>(GdsContext);
}

export function getLibrary(context: GdsContextType): Library {
  let library = context.library;
  if (! library) {
    library = Library.fromObject(context.libraryObject);
    context.library = library;
    console.log("recreate:" +  __filename);
  }
  return library;
}

export function getActiveStructure(context: GdsContextType): Structure | undefined {
  let struct = undefined;
   if (context.structureName.length > 0) {
     struct = getLibrary(context).structureNamed(context.structureName);
     console.log({struct: struct});
   }
  return struct;
}
