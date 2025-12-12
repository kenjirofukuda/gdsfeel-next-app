'use client';
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { useGdsContext } from '@/context/gds-context';

export default function ViewCommands () {
  const { gdsContext, setGdsContext } = useGdsContext();
  const attr = 'bg-gray-100 hover:bg-gray-200 text-black font-bold py-0 px-1 border';

  const zoomDoubleHandler = (e) => {
    if (window.structureView) {
      window.structureView.zoomDouble();
    }
  };

  const zoomHalfHandler = (e) => {
    if (window.structureView) {
      window.structureView.zoomHalf();
    }
  };

  const zoomFit = (e) => {
    if (window.structureView) {
      window.structureView.fit();
    }
  };

  return (
    <div className="flex: 0 1 auto; width: 100%">
      zoom :
      <input
        type="button"
        className={attr}
        value="0.5"
        onClick={zoomHalfHandler} />

      <input
        type="button"
        className={attr}
        value="2.0"
        onClick={zoomDoubleHandler} />

      <input
        type="button"
        className={attr}
        value="Fit"
        onClick={zoomFit} />
    </div>
  );
}
