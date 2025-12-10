import { MouseEventHandler } from 'react';
import { GElement } from '@/src/gds/elements';

interface ElementItemProps {
  element: GElement;
  onClick: MouseEventHandler<HTMLAnchorElement>;
};

const classActive = 'bg-blue-900 text-white visited:text-white';
const classInactive = 'text-gray-800 hover:bg-gray-200 hover:text-black';

export default function ElementItem ({element, onClick }: ElementItemProps) {
  const selected = false;
  const attr = selected ? classActive : classInactive;
  return (
    <a
      id={String(element.elkey)}
      className={attr}
      onClick={onClick} >
      { element.toString() }
    </a>
  );
}
