"use browser";
/// <reference path="../../geometry/geo.ts" />
/// <reference path="../gds.ts" />
/// <reference path="../elements.ts" />
/// <reference path="../container.ts" />

import * as GEO from '../../geometry/geo.js';
// import * as dom from 'dom';

import {
  GElement,
  Point,
  Path,
  Boundary,
  Text,
  Sref,
  Aref,
} from '../elements.js';

import { Structure } from '../container.js';

import $ from 'jquery';
import { sprintf } from "sprintf-js";

declare global {
  interface Window {
    structureView: StructureView;
  }
}

export interface Canvas2D extends CanvasRenderingContext2D {
  _structureView: StructureView;
}

type Viewport = GEO.Viewport;

type CustomWheelEvent = WheelEvent & {
  readonly wheelDelta?: number;
  readonly wheelDeltaY?: number;
};

function strokeSlantCrossV1(ctx: Canvas2D, port: GEO.Viewport, x: number, y: number): void {
  const unit = 3;
  const devicePoint = port.worldToDevice(x, y);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.lineWidth = 1.0;
  devicePoint.x = Math.round(devicePoint.x) /* + 0.5 */;
  devicePoint.y = Math.round(devicePoint.y) /* + 0.5 */;
  ctx.beginPath();
  ctx.moveTo(devicePoint.x - unit, devicePoint.y - unit);
  ctx.lineTo(devicePoint.x + unit, devicePoint.y + unit);
  ctx.moveTo(devicePoint.x - unit, devicePoint.y + unit);
  ctx.lineTo(devicePoint.x + unit, devicePoint.y - unit);
  ctx.stroke();
  ctx.restore();
};

function strokeSlantCrossV2(ctx: Canvas2D, port: GEO.Viewport, x: number, y: number) {
  const unit = 3 / port.scale;
  const devicePoint = GEO.MakePoint(x, y);

  ctx.beginPath();
  ctx.moveTo(devicePoint.x - unit, devicePoint.y - unit);
  ctx.lineTo(devicePoint.x + unit, devicePoint.y + unit);
  ctx.moveTo(devicePoint.x - unit, devicePoint.y + unit);
  ctx.lineTo(devicePoint.x + unit, devicePoint.y - unit);
  ctx.stroke();
};

const strokeSlantCross = strokeSlantCrossV2;

function strokePoints(ctx: Canvas2D, port: GEO.Viewport, points: GEO.Coords, closing: boolean = false) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let ce of points.slice(1)) {
    ctx.lineTo(ce[0], ce[1]);
  }
  if (closing) {
    ctx.closePath();
  }
  ctx.stroke();
}


declare module '../elements.js' {
  interface GElement {
    drawOn(ctx: Canvas2D, port: Viewport): void;
  }
}

// @virtual
GElement.prototype.drawOn = function (_ctx: Canvas2D, _port: GEO.Viewport): void {
  // subclass must be override
};

// @override
Text.prototype.drawOn = function (ctx: Canvas2D, _port: GEO.Viewport): void {
  ctx.font = "bold 16px Arial";
  ctx.strokeStyle = "purple";
  ctx.strokeText(this.string, this.x, this.y);
};

Boundary.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport): void {
  strokePoints(ctx, port, this.vertices(), true);
};

declare module '../elements.js' {
  interface Path {
    strokeCenterline(ctx: Canvas2D, port: Viewport): void;
    strokeOutline(ctx: Canvas2D, port: Viewport): void;
  }
}

Path.prototype.strokeCenterline = function (ctx: Canvas2D, port: GEO.Viewport): void {
  strokePoints(ctx, port, this.vertices());
};

Path.prototype.strokeOutline = function (ctx: Canvas2D, port: GEO.Viewport): void {
  strokePoints(ctx, port, this.outlineCoords());
};

// @override
Path.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport): void {
  ctx.strokeStyle = "black";
  this.strokeCenterline(ctx, port);
  this.strokeOutline(ctx, port);
};

// @override
Sref.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport): void {
  if (!this.refStructure) {
    return;
  }
  const mat = this.transform();
  ctx.save();
  port.pushTransform(mat);
  ctx.transform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);

  ctx.strokeStyle = "black";
  ctx._structureView.drawStructure(ctx, port, this.refStructure);

  ctx.restore();
  port.popTransform();
  ctx.strokeStyle = "blue";
  strokeSlantCross(ctx, port, this.x, this.y);
};


// @override
Aref.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport): void {
  if (!this.refStructure) {
    return;
  }
  if (this.refName === 'PC' && this.elkey === 5) {
    const debug = true;
  }
  for (let mat of this.repeatedTransforms()) {
    ctx.save();
    port.pushTransform(mat);
    ctx.transform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);

    ctx.strokeStyle = "brown";
    ctx._structureView.drawStructure(ctx, port, this.refStructure);

    port.popTransform();
    ctx.restore();
    ctx.strokeStyle = "orange";
    strokeSlantCross(ctx, port, mat.tx, mat.ty);
  }
  ctx.strokeStyle = "red";
  strokeSlantCross(ctx, port, this.x, this.y);
};

// @override
Point.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport): void {
  strokeSlantCross(ctx, port, this.x, this.y);
};

export class Tracking {
  view: StructureView;
  element: HTMLElement;
  down: boolean;
  points: Array<GEO.Point>;
  upPoint: GEO.Point;
  downPoint: GEO.Point;
  currPoint: GEO.Point;

  constructor(view: StructureView) {
    this.view = view;
    this.element = view.context().canvas;
    this.points = [];
    this.down = false;
    this.downPoint = GEO.MakePoint(0, 0);
    this.currPoint = GEO.MakePoint(0, 0);
    this.upPoint = GEO.MakePoint(0, 0);
    this.registerHandler();
    this.registerWheel();
  }

  registerWheel(): void {
    const self = this;
    const mousewheelevent = "onwheel" in document ? "wheel" : "onmousewheel" in document ? "mousewheel" : "DOMMouseScroll";
    $(this.view.portId).on(mousewheelevent, function (e: JQuery.TriggeredEvent) {
      e.preventDefault();
      if (e.originalEvent) {
        const evt = e.originalEvent as CustomWheelEvent;
        const delta = evt.deltaY ? -(evt.deltaY) : evt.wheelDelta ? evt.wheelDelta : -(evt.detail);
        // console.log(e);
        const p = GEO.MakePoint(evt.offsetX, evt.offsetY);
        const dir = delta < 0 ? -1.0 : 1.0;
        const center = self.view.port.deviceToWorld(p.x, p.y);
        self.view.port.wheelZoom(p.x, p.y, center.x, center.y, dir);
      }
    });
  }

  registerHandler(): void {
    const self = this;
    this.element.addEventListener("mousedown", function (evt) {
      self.down = true;
      self.points = [];
      self.downPoint = GEO.MakePoint(evt.offsetX, evt.offsetY);
      // console.log(["d", self.downPoint + ""]);
    });
    this.element.addEventListener("mousemove", function (evt) {
      if (!self.down) {
        return;
      }
      const p = GEO.MakePoint(evt.offsetX, evt.offsetY);
      if (self.downPoint.equals(p)) {
        return;
      }
      self.currPoint = p;
      self.points.push(p);
      // console.log(self);
      if (self.points.length === 1) {
        $(self.view.portId).css("cursor", "all-scroll");
      }
      if (self.points.length > 2) {
        const p1 = self.points[self.points.length - 2];
        const p2 = self.points[self.points.length - 1];
        const wp1 = self.view.port.deviceToWorld(p1.x, p1.y);
        const wp2 = self.view.port.deviceToWorld(p2.x, p2.y);
        const moved = wp2.minus(wp1);
        self.view.port.moveCenter(- moved.x, - moved.y);
      }
      // console.log(["m", self.currPoint + ""]);
    });
    this.element.addEventListener("mouseup", function (evt) {
      self.down = false;
      self.upPoint = GEO.MakePoint(evt.offsetX, evt.offsetY);
      $(self.view.portId).css("cursor", "default");
      // console.log(["u", self.upPoint + ""]);
    });
  }
};

type StructureViewProc = (view: StructureView) =>  void;

export class StructureView {
  portId: string;
  _structure: Structure;
  ctx: Canvas2D;
  port: GEO.Viewport;
  track: Tracking;
  needsRedraw: boolean;
  resizeFunction: StructureViewProc;

  constructor(portId: string, structure?: Structure) {
    const self = this;
    this.portId = portId;
    this._structure = structure || new Structure;
    this.ctx = this.context();
    this.port = new GEO.Viewport(this.ctx.canvas.width, this.ctx.canvas.height);
    this.track = new Tracking(self);
    this.needsRedraw = true;
    this.port.portDamageFunction = (port: GEO.Viewport) => {
      if (port.transformDepth === 0) {
        self.needsRedraw = true;
      }
    };
    this.resizeFunction = (v: StructureView) => {};
    if (false) {
      this.port.transformFunction = function () {
        const domMat = self.ctx.getTransform();
        const createjsMat = new GEO.Matrix2D();
        createjsMat.a = domMat.a;
        createjsMat.b = domMat.b;
        createjsMat.c = domMat.c;
        createjsMat.d = domMat.d;
        createjsMat.tx = domMat.e;
        createjsMat.ty = domMat.f;
        return createjsMat;
      };
    }
  }

  set structure(s: Structure) {
    this._structure = s;
    this.needsRedraw = true;
  }

  context(): Canvas2D {
    const canvas = <HTMLCanvasElement>document.getElementById(this.portId);
    const ctx = <Canvas2D>canvas.getContext("2d");
    ctx._structureView = this;
    return ctx;
  }

  addMouseMoveListener(proc: EventListenerOrEventListenerObject): void {
    this.context().canvas.addEventListener("mousemove", proc);
  }

  redraw(): void {
    if (this.needsRedraw) {
      this.fullDraw();
      this.needsRedraw = false;
    }
  }

  fullDraw(): void {
    const ctx = this.context();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "lightGray";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const mat = this.port.transform();
    if (this._structure === null) {
      return;
    }
    // this.port._basicTransform = mat;
    ctx.setTransform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);
    ctx.lineWidth = 1 / this.port.scale;
    ctx.strokeStyle = 'black';
    this.drawStructure(ctx, this.port, this._structure);
  }

  drawStructure(ctx: Canvas2D, port: GEO.Viewport, structure: Structure): void {
    this.drawElements(ctx, port, structure.elements());
  }

  drawElements(ctx: Canvas2D, port: GEO.Viewport, elements: Array<GElement>): void {
    elements.forEach(function (e: GElement) {
      e.drawOn(ctx, port);
    });
  }

  fit(): void {
    if (this._structure.elements().length === 0) {
      this.port.reset();
      return;
    }
    const ext = this._structure.dataExtent();
    if (ext.width === 0 && ext.height === 0) {
      this.port.setCenter(0, 0);
    } else {
      this.port.setRectangle(ext);
    }
  }

  zoomDouble(): void {
    this.port.zoomDouble();
  }

  zoomHalf(): void {
    this.port.zoomHalf();
  }
};


export function loadIt(structureView?: StructureView, portId?: string): void {
  const REDRAW_INTERVAL_MSECS = 100;
  portId = portId || "canvas";
  structureView = structureView ?? new StructureView(portId);
  window.structureView = structureView;
  let queue: NodeJS.Timeout | undefined = undefined;
  const waitMSecs = 300;

  // console.log({loadIt: structureView});
  window.addEventListener("resize", () => {
    clearTimeout(queue);
    queue = setTimeout(() => {
      structureView.resizeFunction(structureView);
    }, waitMSecs);
  }, false);
  structureView.resizeFunction(structureView);

  structureView.fit();
  setInterval(() => {
    if (structureView) {
      structureView.redraw();
    }
  }, REDRAW_INTERVAL_MSECS);
}

export function mouseMoveHandler(e: MouseEvent, structureView: StructureView): void {
  $("#deviceX").html(sprintf("%5d", e.offsetX));
  $("#deviceY").html(sprintf("%5d", e.offsetY));
  const worldPoint = structureView.port.deviceToWorld(e.offsetX, e.offsetY);
  $("#worldX").html(sprintf("%+20.4f", worldPoint.x.roundDigits(4)));
  $("#worldY").html(sprintf("%+20.4f", worldPoint.y.roundDigits(4)));
}

export function adjustPortSize(structureView?: StructureView): void {
  let w = $("#canvas-wrapper").width();
  let h = $("#canvas-wrapper").height();
  $("#canvas").attr("width", String(w));
  $("#canvas").attr("height", String(h));
  if (structureView) {
    structureView.port.setSize(w, h);
  }
  $("#canvas-wrapper").css("display", "flex");
}

export function adjustRowCenter(): void {
  $("#row2").height(0);
  $("#canvas-wrapper").height(0);
}
