'use client';
import { useEffect } from "react";

declare global {
  interface Window {
    structureView: StructureView;
  }
}

declare const window: Window & typeof globalThis;

import { getActiveStructure, useGdsContext } from "@/context/gds-context";
import {
  StructureView,
  loadIt,
  adjustPortSize,
  adjustRowCenter,
  mouseMoveHandler,
} from '@/gds/browser/canvas';

export default function GdsCanvas() {
  const { gdsContext, setGdsContext } = useGdsContext();
  const structure = getActiveStructure(gdsContext);
  if (structure) {
    // console.log({rootClick: structure.root()});
    // console.log(structure.dataExtent());
    if (window.structureView) {
      window.structureView.structure = structure;
      window.structureView.fit();
    }
  }

  useEffect(() => {
    const structureView = new StructureView("canvas");
    structureView.addMouseMoveListener((e: Event) => {
      mouseMoveHandler(e as MouseEvent, structureView);
    });

    structureView.resizeFunction = (structureView) => {
      adjustPortSize(structureView);
      adjustRowCenter();
    }
    loadIt(structureView);
  }, []);

  return (
    <div id="canvas-wrapper" className="bg-sky-50">
      <canvas id="canvas"></canvas>
    </div>
  );
}
