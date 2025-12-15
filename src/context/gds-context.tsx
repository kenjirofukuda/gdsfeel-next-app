'use client';

import { createContext, useContext, useState, ReactNode, Context } from 'react';
import { Library, Structure } from 'gdsfeel-js';

interface GdsStationContext {
  structureName: string;
  libraryObject: object | undefined;
  library: Library | undefined;
};

export type GdsContextType = {
  gdsContext: GdsStationContext;
  setGdsContext: (_station: GdsStationContext) => void;
};

const GdsContext: Context<GdsContextType> = createContext<GdsContextType>({
  gdsContext: {
    structureName: "",
    libraryObject: undefined,
    library: undefined
  },
  setGdsContext: (_context: GdsStationContext) => {}
});


export function GdsProvider({ children, initialData }: { children: ReactNode, initialData: GdsStationContext}) {
  const [gdsContext, setGdsContext ] = useState<GdsStationContext>(initialData);

  return (
    <GdsContext.Provider value={ {gdsContext, setGdsContext }}>
      {children}
    </GdsContext.Provider>
  );
}

export function useGdsContext(): GdsContextType {
  return useContext<GdsContextType>(GdsContext);
}

export function getLibrary(context: GdsStationContext): Library {
  let library = context.library;
  if (! library) {
    library = Library.fromObject(context.libraryObject);
    context.library = library;
    console.log("recreate:" +  __filename);
  }
  return library;
}

export function getActiveStructure(context: GdsStationContext): Structure | undefined {
  let struct = undefined;
   if (context.structureName.length > 0) {
     struct = getLibrary(context).structureNamed(context.structureName);
   }
  return struct;
}
