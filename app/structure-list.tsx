'use client';
import { useGdsContext } from '@/context/gds-context';
import { StationProps } from '@/src/gds/container';
import  StructureItem  from './structure-item';
import { Library } from '@/src/gds/container';
import React from 'react';

export default function StructureList( { station }: StationProps ) {
  const { gdsContext, setGdsContext } = useGdsContext();
  console.log({gdsContext: gdsContext});
  const selectStructure = (e) =>  {
    console.log({e: e.target.innerText});
    station.structureName = e.target.innerText;
    const obj = {
      structureName: station.structureName,
      libraryObject: gdsContext.libraryObject,
      library: (! gdsContext.library) && Library.fromObject(gdsContext.libraryObject)
    };
    setGdsContext(obj);
  };

  let library = gdsContext.library;
  if (! library) {
    library = Library.fromObject(gdsContext.libraryObject);
  }

  const contents = library.structureNames();

  return (
    contents.map((each: string) =>
      <StructureItem key={each} name={each} station={station} onClick={selectStructure} />
    )
  );
}
