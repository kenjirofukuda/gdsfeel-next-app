'use client';
import { useGdsContext } from '@/context/gds-context';
import { StationProps } from '@/src/gds/container';
import  ElementItem  from './element-item';
import React from 'react';

export default function ElementList( { station }: StationProps ) {

  const { gdsContext, setGdsContext } = useGdsContext();

  const selectStructure = (e) =>  {
    console.log({e: e.target.innerText});
    // station.structureName = e.target.innerText;
    // setStructureName(station.structureName);
  };

  let struct = undefined;
  if (gdsContext.structureName.length > 0) {
    struct = station.library._structures.find((s: object) =>
      s.sfAttr.STRNAME == gdsContext.structureName
    );
    console.log({struct: struct});
  }

  const contents = struct?._elements || [];
  return (
contents.map((each: any, index) => {
      const key = each.sfAttr.ELKEY || index;
      return <ElementItem key={key} gelement={each} station={station} onClick={selectStructure} />
    })
  )
}
