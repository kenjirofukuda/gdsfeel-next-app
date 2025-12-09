//'use client';

import type { StationProps } from '@/src/gds/container';
import { MouseEventHandler } from 'react';
import { GElement } from '@/src/gds/elements';

type ElementItemProps =  {
  gelement: GElement;
  station: StationProps;
  onClick: MouseEventHandler<HTMLAnchorElement>;
};

const classActive = 'bg-blue-900 text-white visited:text-white';
const classInactive = 'text-gray-800 hover:bg-gray-200 hover:text-black';

export default function ElementItem ({gelement, station, onClick }: ElementItemProps) {
  const selected = false;
  const attr = selected ? classActive : classInactive;
  return (
    <a
      id={String(gelement.elkey)}
      className={attr}
      onClick={onClick} >
      { gelement.toString() /* 'ELEM(' + gelement.elkey + ')' */ }
    </a>
  );
}
