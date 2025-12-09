'use client';
import { useGdsContext } from '@/context/gds-context';
import { StationProps } from '@/src/gds/container';
import  StructureItem  from './structure-item';
import React from 'react';

export default function StructureList( { station }: StationProps ) {
  const { gdsContext, setGdsContext } = useGdsContext();
  console.log({gdsContext: gdsContext});
  const selectStructure = (e) =>  {
    console.log({e: e.target.innerText});
    station.structureName = e.target.innerText;
    const obj = {
      structureName: station.structureName,
      libraryObject: gdsContext.libraryObject
    };
    setGdsContext(obj);
  };

  const contents = station.library._structures.map((s: object) => s.sfAttr.STRNAME);
  return (
    contents.map((each: string) =>
      <StructureItem key={each} name={each} station={station} onClick={selectStructure} />
    )
  );
}
