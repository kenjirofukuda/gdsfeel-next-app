'use client';
import { getActiveStructure, useGdsContext } from "@/context/gds-context";

import { Structure } from '@/src/gds/container';
import { StructureView } from '@/src/gds/browser/canvas';

import $ from 'jquery';
import { useEffect } from "react";

const REDRAW_INTERVAL_MSECS = 100;
let gStructure: Structure | undefined = new Structure;
let gStructureView: StructureView | undefined = undefined;
let gQueue: NodeJS.Timeout | undefined = undefined;
let gWaitMSecs = 300;

export default function GdsCanvas() {
  const { gdsContext, setGdsContext } = useGdsContext();
  gStructure = getActiveStructure(gdsContext);
  if (gStructure) {
    console.log({rootClick: gStructure.root()});
    console.log(gStructure.dataExtent());
    gStructureView = new StructureView("canvas", gStructure);
    gStructureView.fit();
  }

  useEffect(() => {
    loadIt();
  }, []);

  return (
    <div id="canvas-wrapper" className="bg-sky-50">
      <canvas id="canvas"></canvas>
    </div>
  );
}

function loadIt(): void {
  console.log("loadIt");
  window.addEventListener("resize", function () {
    clearTimeout(gQueue);
    gQueue = setTimeout(function () {
      adjustPortSize();
      adjustRowCenter();
    }, gWaitMSecs);
  }, false);
  adjustPortSize();

  gStructureView = new StructureView("canvas", gStructure);

  gStructureView.addMouseMoveListener(function (e) {
    $("#deviceX").html(sprintf("%5d", e.offsetX));
    $("#deviceY").html(sprintf("%5d", e.offsetY));
    const worldPoint = gStructureView.port.deviceToWorld(e.offsetX, e.offsetY);
    $("#worldX").html(sprintf("%+20.4f", worldPoint.x.roundDigits(4)));
    $("#worldY").html(sprintf("%+20.4f", worldPoint.y.roundDigits(4)));
  });

  gStructureView.fit();
  setInterval(() => {
    if (gStructureView) {
      gStructureView.redraw();
    }
  }, REDRAW_INTERVAL_MSECS);
}

function adjustPortSize(): void {
  console.log("adjustPortSize");
  let w = $("#canvas-wrapper").width();
  let h = $("#canvas-wrapper").height();
  $("#canvas").attr("width", w);
  $("#canvas").attr("height", h);
  if (gStructureView) {
    gStructureView.port.setSize(w, h);
  }
  $("#canvas-wrapper").css("display", "flex");
}

function adjustRowCenter(): void {
  let container_height = $("#container").height();
  let row1_height = $("#row1").height();
  let row3_height = $("#row3").height();
//  $("#row2").height(window.innerHeight - (row1_height + row3_height));
  $("#row2").height(0);
  $("#canvas-wrapper").height(0);
}


function floatConvertSyncer(num: number, dig: number): number {
  const p = Math.pow(10, dig);
  return Math.round(num * p) / p;
}


Number.prototype.roundDigits = function (dig): number {
  return floatConvertSyncer(this, dig);
};
