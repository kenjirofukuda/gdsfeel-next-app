
/// <reference path="../gds.ts" />
/// <reference path="../elements.ts" />
/// <reference path="../container.ts" />
/**
 * Browser only
 */
import { GEO } from '../../geometry/geo';
import { GDS as base } from '../gds';
import { GDS as elems } from '../elements';
import { GDS as container } from '../container';

namespace GDS {

  type Coords = elems.Coords;

  export interface Canvas2D extends CanvasRenderingContext2D {
    _structureView: StructureView;
  }

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


  export class Element extends elems.Element {
    drawOn(ctx: Canvas2D, port: GEO.Viewport): void {
      // subclass must be override
    }
  }

  export class Text extends elems.Text {
    drawOn(ctx: Canvas2D, port: GEO.Viewport): void {
      ctx.font = "bold 16px Arial";
      ctx.strokeStyle = "purple";
      ctx.strokeText(this.hash.map['STRING'], this.x, this.y);
    }
  }

  export class Boundary extends elems.Boundary {
    drawOn(ctx: Canvas2D, port: GEO.Viewport): void {
      strokePoints(ctx, port, this.vertices(), true);
    };
  }


  export class Path extends elems.Path {
    strokeCenterline(ctx: Canvas2D, port: GEO.Viewport): void {
      strokePoints(ctx, port, this.vertices());
    };
    strokeOutline(ctx: Canvas2D, port: GEO.Viewport): void {
      strokePoints(ctx, port, this.outlineCoords());
    };

    // @override
    drawOn(ctx: Canvas2D, port: GEO.Viewport): void {
      ctx.strokeStyle = "black";
      this.strokeCenterline(ctx, port);
      this.strokeOutline(ctx, port);
    };

  }

  export class Sref extends elems.Sref {
    drawOn(ctx: Canvas2D, port: GEO.Viewport): void {
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
  }

  export class Aref extends elems.Aref {
    drawOn(ctx: Canvas2D, port: GEO.Viewport): void {
      if (!this.refStructure) {
        return;
      }
      if (this.refName === 'PC' && this.hash.elkey === 5) {
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
    }
  }


  export class Point extends elems.Point {
    drawOn(ctx: Canvas2D, port: GEO.Viewport): void {
      strokeSlantCross(ctx, port, this.x, this.y);
    };
  }

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


  class StructureView {
    portId: string;
    _structure: container.Structure;
    ctx: Canvas2D;
    port: GEO.Viewport;
    track: Tracking;
    needsRedraw: boolean;

    constructor(portId: string, structure: container.Structure) {
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

    drawStructure(ctx: Canvas2D, port: GEO.Viewport, structure: container.Structure): void {
      this.drawElements(ctx, port, structure.elements());
    }

    drawElements(ctx: Canvas2D, port: GEO.Viewport, elements: Array<elems.Element>): void {
      elements.forEach(function (e: elems.Element) {
        (e as GDS.Element).drawOn(ctx, port);
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