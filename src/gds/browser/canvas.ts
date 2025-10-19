
/**
 * Browser only
 */
import { GEO } from '../../geometry/geo';
/// <reference path="../gds.ts" />
/// <reference path="../elements.ts" />

namespace GDS {

  export interface Canvas2D extends CanvasRenderingContext2D {
    _structureView: StructureView;
  }

  export interface Element {
    drawOn(ctx: Canvas2D, port: GEO.Viewport): void
  }

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

  function strokePoints(ctx: Canvas2D, port: GEO.Viewport, points: Coords, closing: boolean = false) {
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


  Element.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport) {
    // subclass must be override
  };

  Text.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport) {
    ctx.font = "bold 16px Arial";
    ctx.strokeStyle = "purple";
    ctx.strokeText(this.hash.map['STRING'], this.x, this.y);
  };

  Boundary.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport) {
    strokePoints(ctx, port, this.vertices(), true);
  };

  Path.prototype.strokeCenterline = function (ctx: Canvas2D, port: GEO.Viewport) {
    strokePoints(ctx, port, this.vertices());
  };

  Path.prototype.strokeOutline = function (ctx: Canvas2D, port: GEO.Viewport) {
    strokePoints(ctx, port, this.outlineCoords());
  };

  Path.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport) {
    ctx.strokeStyle = "black";
    this.strokeCenterline(ctx, port);
    this.strokeOutline(ctx, port);
  };

  Sref.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport) {
    const mat = this.transform();
    ctx.save();
    port.pushTransform(mat);
    ctx.transform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);

    ctx.strokeStyle = "black";
    ctx._structureView.drawStructure(ctx: Canvas2D, port: GEO.Viewport, this.refStructure);

    ctx.restore();
    port.popTransform();
    ctx.strokeStyle = "blue";
    strokeSlantCross(ctx: Canvas2D, port: GEO.Viewport, this.x, this.y);
  };

  Aref.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport) {
    if (this.refName === 'PC' && this.hash.elkey === 5) {
      const debug = true;
    }
    for (let mat of this.repeatedTransforms()) {
      ctx.save();
      port.pushTransform(mat);
      ctx.transform(mat.a, mat.b, mat.c, mat.d, mat.tx, mat.ty);

      ctx.strokeStyle = "brown";
      ctx._structureView.drawStructure(ctx: Canvas2D, port: GEO.Viewport, this.refStructure);

      port.popTransform();
      ctx.restore();
      ctx.strokeStyle = "orange";
      strokeSlantCross(ctx: Canvas2D, port: GEO.Viewport, mat.tx, mat.ty);
    }
    ctx.strokeStyle = "red";
    strokeSlantCross(ctx: Canvas2D, port: GEO.Viewport, this.x, this.y);
  };

  Point.prototype.drawOn = function (ctx: Canvas2D, port: GEO.Viewport) {
    strokePoints(ctx: Canvas2D, port: GEO.Viewport, this.x, this.y);
  };


  class Tracking {
    view: StructureView;
    element: HTMLElement;
    down: boolean;
    points: Coods;
    upPoint: GEO.Point;
    downPoint: GEO.Point;
    currPoint: GEO.Point;

    constructor(view: StructureView) {
      this.view = view;
      this.element = view.context().canvas;
      this.down = false;
      this.downPoint = GEO.MakePoint(0, 0);
      this.currPoint = GEO.MakePoint(0, 0);
      this.upPoint = GEO.MakePoint(0, 0);
      this.registerHandler();
      this.registerWheel();
    }

    registerWheel() {
      const self = this;
      const mousewheelevent = "onwheel" in document ? "wheel" : "onmousewheel" in document ? "mousewheel" : "DOMMouseScroll";
      $(this.view.portId).on(mousewheelevent, function (e) {
        e.preventDefault();
        const delta = e.originalEvent.deltaY ? -(e.originalEvent.deltaY) : e.originalEvent.wheelDelta ? e.originalEvent.wheelDelta : -(e.originalEvent.detail);
        // console.log(e);
        const p = GEO.MakePoint(e.originalEvent.offsetX, e.originalEvent.offsetY);
        const dir = delta < 0 ? -1.0 : 1.0;
        const center = self.view.port.deviceToWorld(p.x, p.y);
        self.view.port.wheelZoom(p.x, p.y, center.x, center.y, dir);
      });
    }

    registerHandler() {
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


  class StructureView {
    portId: string;
    _structure: Structure;
    ctx: Canvas2D;
    port: GEO.Viewport;
    track: Tracking;
    needsRedraw: boolean;

    constructor(portId: string, structure: Structure) {
      const self = this;
      this.portId = portId;
      this._structure = structure;
      this.ctx = this.context();
      this.port = new GEO.Viewport(this.ctx.canvas.width, this.ctx.canvas.height);
      this.track = new Tracking(self);
      this.needsRedraw = true;
      this.port.portDamageFunction = function (port) {
        if (port.transformDepth === 0) {
          self.needsRedraw = true;
        }
      };
      if (false) {
        this.port.transformFunction = function () {
          const domMat = self.ctx.getTransform();
          const createjsMat = new createjs.Matrix2D();
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

    context(): Canvas2D {
      const canvas = document.getElementById(this.portId);
      const ctx = canvas.getContext("2d") as Canvas2D;
      ctx._structureView = this;
      return ctx;
    }

    addMouseMoveListener(proc): void {
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

    drawElements(ctx: Canvas2D, port: GEO.Viewport, elements: Array<Element>): void {
      elements.forEach(function (e: Element) {
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

}