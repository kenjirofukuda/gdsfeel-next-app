'use client';
import { useGdsContext } from '@/context/gds-context';
import { StationProps } from '@/src/gds/container';
import  ElementItem  from './element-item';
import { Library } from '@/src/gds/container';
import React from 'react';

export default function ElementList( { station }: StationProps ) {

  const { gdsContext, setGdsContext } = useGdsContext();

  const selectElement = (e) =>  {
    console.log({e: e});
    // station.structureName = e.target.innerText;
    // setStructureName(station.structureName);
  };

  let library = gdsContext.library;
  if (! library) {
    library = Library.fromObject(gdsContext.libraryObject);
  }

  let struct = undefined;
   if (gdsContext.structureName.length > 0) {
     struct = library.structureNamed(gdsContext.structureName);
  //   struct = station.library._structures.find((s: object) =>
  //     s.sfAttr.STRNAME == gdsContext.structureName
  //   );
     console.log({struct: struct});
   }

  // const contents = struct?._elements || [];
  const contents = struct?.elements() || [];
  return (
contents.map((each: any, index) => {
      const key = each.sfAttr.ELKEY || index;
      return <ElementItem key={key} gelement={each} station={station} onClick={selectElement} />
    })
  )
}
