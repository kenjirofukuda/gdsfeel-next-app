'use client';

import { useState } from 'react';


import { Library, StationProps } from '@/src/gds/container';
import  StructureItem  from './structure-item';


export default function ExampleList( { station }: StationProps ) {
  console.log({a: station});
  const [ structureName, setStructureName ] = useState("");

  const selectStructure = (e) =>  {
    console.log({e: e.target.innerText});
    station.structureName = e.target.innerText;
    setStructureName(station.structureName);
  };

  //  const contents = station?.library?.structureNames() || [];
  const contents = station.library._structures.map((s: object) => s.sfAttr.STRNAME);
  return (
    contents.map((each: string) =>
      <StructureItem name={each} station={ station } onClick={selectStructure} />
    )
  );
}
