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
  mouseMoveHandler
} from 'gdsfeel-js/browser';

export default function GdsCanvas() {
  const { gdsContext } = useGdsContext();
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

    structureView.resizeFunction = (structureView: StructureView) => {
      adjustPortSize(structureView);
    }
    loadIt(structureView);
  }, []);

  return (
    <div id="canvas-wrapper" className="bg-sky-50">
      <canvas id="canvas"></canvas>
    </div>
  );
}
