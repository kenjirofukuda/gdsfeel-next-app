//'use client';

import type { StationProps } from '@/src/gds/container';
import { MouseEventHandler } from 'react';

type StructureItemProps =  {
  name: string;
  station: StationProps;
  onClick: MouseEventHandler<HTMLAnchorElement>;
};

const classActive = 'bg-blue-900 text-white visited:text-white';
const classInactive = 'text-gray-800 hover:bg-gray-200 hover:text-black';


export default function StructureItem ({name, station, onClick }: StructureItemProps) {
  const selected = station.structureName == name;
  const attr = selected ? classActive : classInactive;
  return (
    <a
      className={attr}
      onClick={onClick} >
      { name }
    </a>
  );
}
