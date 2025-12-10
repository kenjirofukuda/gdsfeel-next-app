'use client';
import { getActiveStructure, useGdsContext } from '@/context/gds-context';
import  ElementItem  from './element-item';
import { SyntheticEvent } from 'react';

export default function ElementList() {
  const { gdsContext } = useGdsContext();

  const selectElement = (e: SyntheticEvent<HTMLAnchorElement>) =>  {
    console.log({ee: e.target.id});
  };

  const struct = getActiveStructure(gdsContext);
  const contents = struct?.elements() || [];
  return (
    contents.map((each: any, index: number) => {
      const key = each.sfAttr.ELKEY || index;
      return <ElementItem key={key} element={each} onClick={selectElement} />
    })
  )
}
