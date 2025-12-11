'use client';
import { getLibrary, useGdsContext } from '@/context/gds-context';
import  StructureItem  from './structure-item';
import { SyntheticEvent } from 'react';

export default function StructureList() {
  const { gdsContext , setGdsContext }  = useGdsContext();

  const selectStructure = (e: SyntheticEvent<HTMLAnchorElement>) =>  {
    console.log({es: e.target.id});
    const newContext = { ...gdsContext }
    newContext.structureName = e.target.id;
    setGdsContext(newContext);
  };

  const library = getLibrary(gdsContext);
  const contents = library.structureNames();

  return (
    contents.map((each: string) =>
      <StructureItem
        key={each}
        name={each}
        selected={each == gdsContext.structureName}
        onClick={selectStructure} />
    )
  );
}
