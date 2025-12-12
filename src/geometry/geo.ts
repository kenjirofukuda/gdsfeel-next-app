
// can't import createjs in typescript environment
// import * as createjs from 'createjs-module';
import { Point, point_x, point_y, IndexedPoint2D } from './Point.js';
import { Rectangle } from './Rectangle.js';
import { Matrix2D }  from './Matrix2D.js';

type ViewportArgProc = (vp: Viewport) => void;
type MatrixFunction = () => Matrix2D;
type WheelDirection = 1 | -1;

export const EPS = 1e-8;
export const PI_HALF = 0.5 * Math.PI;
export const PI_DOUBLE = 2.0 * Math.PI;

export function sameValue(v1: number, v2: number, eps = EPS) {
  return Math.abs(v1 - v2) < eps;
}

export function MakeMatrix(): Matrix2D {
  return new Matrix2D();
}

export type CE = IndexedPoint2D;
export type Coords = Array<CE>;

export class Viewport {
  private width: number;
  private height: number;
  private _scale: number;
  private centerX: number;
  private centerY: number;
  private portCenterX: number;
  private portCenterY: number;
  private _transform: Matrix2D | undefined;
  private _invertTransform: Matrix2D | undefined;
  private _basicTransform: Matrix2D | undefined;
  private transformStack: Matrix2D[];
  public portDamageFunction: ViewportArgProc | undefined;
  public transformFunction: MatrixFunction | undefined;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this._scale = 1.0;
    this.centerX = 0.0;
    this.centerY = 0.0;
    this._resetPortCenter();
    this.portCenterX = width / 2.0;
    this.portCenterY = height / 2.0;
    this._transform = undefined;
    this._invertTransform = undefined;
    this._basicTransform = undefined;
    this.transformStack = [];
    this.portDamageFunction = undefined;
    this.transformFunction = undefined;
  }

  get scale(): number { return this._scale; }

  get transformDepth(): number {
    return this.transformStack.length;
  }

  wheelZoom(h: number, v: number, x: number, y: number, direction: WheelDirection): void {
    this.portCenterX = h;
    this.portCenterY = this.height - v;
    this.centerX = x;
    this.centerY = y;
    this._scale = this._scale * (1.0 + (0.125 * direction));
    this._damageTransform();
  }

  zoomDouble(): void {
    this.setScale(this.scale * 2.0);
  }

  zoomHalf(): void {
    this.setScale(this.scale * 0.5);
  }

  setScale(scale: number): void {
    this._scale = scale;
    this._damageTransform();
  }

  setCenter(x: number, y: number) {
    this.centerX = x;
    this.centerY = y;
    this._damageTransform();
  }

  moveCenter(deltaX: number, deltaY: number) {
    this.centerX += deltaX;
    this.centerY += deltaY;
    this._damageTransform();
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this._damageTransform();
  }

  reset(): void {
    this._scale = 1.0;
    this.centerX = 0;
    this.centerY = 0;
    this._damageTransform();
  }

  transform(): Matrix2D {
    if (typeof (this.transformFunction) === 'function') {
      return this.transformFunction();
    }
    if (this._transform === undefined) {
      this._transform = this._lookupTransform();
    }
    return this._transform;
  }

  invertTransform(): Matrix2D {
    if (this._invertTransform === undefined) {
      this._invertTransform = this.transform().clone().invert();
    }
    return this._invertTransform;
  }

  deviceToWorld(h: number, v: number): Point {
    const result = MakePoint(0, 0);
    return this.invertTransform().transformPoint(h, v, result) as Point;
  }

  worldToDevice(x: number, y: number): Point {
    const result = MakePoint(0, 0);
    return this.transform().transformPoint(x, y, result) as Point;
  }

  pushTransform(transform: Matrix2D) {
    this.transformStack.push(transform);
    this._damageTransform();
  }

  popTransform(): Matrix2D | undefined | any {
    if (this.transformStack.length === 0) {
      return new Matrix2D();
    }
    const result: any = this.transformStack.pop();
    this._damageTransform();
    return result;
  }

  _lookupTransform(): Matrix2D {
    const newTransform = new Matrix2D();
    newTransform.prependMatrix(this.basicTransform());
    this.transformStack.map(function (item) {
      newTransform.prependMatrix(item);
    });
    return newTransform;
  }

  basicTransform(): Matrix2D {
    if (this._basicTransform === undefined) {
      this._basicTransform = this._lookupBasicTransform();
    }
    return this._basicTransform;
  }

  _lookupBasicTransform(): Matrix2D {
    const tx = new Matrix2D();
    tx.translate(this.portCenterX, this.height - this.portCenterY);
    tx.scale(this.scale, -this.scale);
    tx.translate(-this.centerX, -this.centerY);
    return tx;
  }

  _fittingRatio(width: number, height: number): number {
    const margin = 20;
    const xRatio = (this.width - margin) / width;
    const yRatio = (this.height - margin) / height;
    return Math.min(xRatio, yRatio);
  }

  setRectangle(r: Rectangle) {
    this._resetPortCenter();
    const center = r.center();
    this.setCenter(center.x, center.y);
    this.setScale(this._fittingRatio(r.width, r.height));
  }

  _resetPortCenter(): void {
    this.portCenterX = this.width / 2.0;
    this.portCenterY = this.height / 2.0;
  }

  _damageTransform(): void {
    this._basicTransform = undefined;
    this._transform = undefined;
    this._invertTransform = undefined;
    if (this.portDamageFunction !== undefined) {
      const self = this;
      this.portDamageFunction(self);
    }
  }
} // Viewport



export function calcExtentBounds(points: any[]): Rectangle {
  let minX = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let minY = Number.MAX_VALUE;
  let maxY = Number.MIN_VALUE;

  points.forEach(function (p) {
    minX = Math.min(point_x(p), minX);
    maxX = Math.max(point_x(p), maxX);
    minY = Math.min(point_y(p), minY);
    maxY = Math.max(point_y(p), maxY);
  });
  return MakeRect(
    minX, minY, Math.abs(maxX - minX), Math.abs(maxY - minY));
};


export function MakeRect(x: number, y: number, width: number, height: number): Rectangle {
  return new Rectangle(x, y, width, height);
}


export function MakePoint(x: number, y: number): Point {
  return new Point(x, y);
}

function floatConvertSyncer(num: number, dig: number): number {
  const p = Math.pow(10, dig);
  return Math.round(num * p) / p;
}

declare global {
  interface Number {
    roundDigits(dig: number): number;
  }
}

Number.prototype.roundDigits = function (dig: number): number {
  return floatConvertSyncer(this, dig);
};


export { Point, point_x, point_y }     from './Point.js';
export { Rectangle } from './Rectangle.js';
export { Matrix2D }  from './Matrix2D.js';
