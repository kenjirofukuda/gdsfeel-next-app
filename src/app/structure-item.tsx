import { MouseEventHandler } from 'react';

type StructureItemProps =  {
  name: string;
  selected: boolean;
  onClick: MouseEventHandler<HTMLAnchorElement>;
};

const classActive = 'bg-blue-900 text-white visited:text-white';
const classInactive = 'text-gray-800 hover:bg-gray-200 hover:text-black';

export default function StructureItem ({name, selected, onClick }: StructureItemProps) {
  const attr = selected ? classActive : classInactive;
  return (
    <a
      id={String(name)}
      className={attr}
      onClick={onClick} >
      {name}
    </a>
  );
}
