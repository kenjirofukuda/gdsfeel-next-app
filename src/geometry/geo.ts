namespace GEO {

  type ViewportArgProc = (vp: Viewport) => void;
  type MatrixFunction = () => createjs.Matrix2D;
  type WheelDirection = 1 | -1;
  export type Matrix2D = createjs.Matrix2D;

  export const EPS = 1e-8;
  export const PI_HALF = 0.5 * Math.PI;
  export const PI_DOUBLE = 2.0 * Math.PI;

  export function sameValue(v1: number, v2: number, eps = EPS) {
    return Math.abs(v1 - v2) < eps;
  }

  export function MakeMatrix(): Matrix2D {
    return new createjs.Matrix2D();
  }

  export class Point extends createjs.Point {
    constructor(x: number, y: number) {
      super(x, y);
    }

    equals(other: Point): boolean {
      return this.x === other.x && this.y === other.y;
    }

    minus(other: Point): Point {
      return new Point(this.x - other.x, this.y - other.y);
    }
  }

  type dimensionIndex = 0 | 1 | 2; // x, y, z
  export type IndexedPoint = Array<dimensionIndex>;
  type PointLike = Point | IndexedPoint;
  export type CE = IndexedPoint;
  export type Coords = Array<CE>;


  export class Rectangle extends createjs.Rectangle {
    center(): Point {
      return new Point(
        this.x + this.width / 2.0,
        this.y + this.height / 2.0);
    };

    pointArray(): Point[] {
      const points = [];
      points.push(new Point(this.x, this.y));
      points.push(new Point(this.x, this.y + this.height));
      points.push(new Point(this.x + this.width, this.y + this.height));
      points.push(new Point(this.x + this.width, this.y));
      return points;
    };
  }


  export class Viewport {
    private width: number;
    private height: number;
    private _scale: number;
    private centerX: number;
    private centerY: number;
    private portCenterX: number;
    private portCenterY: number;
    private _transform: Matrix2D | null;
    private _invertTransform: Matrix2D | null;
    private _basicTransform: Matrix2D | null;
    private transformStack: Matrix2D[];
    public portDamageFunction: ViewportArgProc | null;
    public transformFunction: MatrixFunction | null;

    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this._scale = 1.0;
      this.centerX = 0.0;
      this.centerY = 0.0;
      this._resetPortCenter();
      this.portCenterX = width / 2.0;
      this.portCenterY = height / 2.0;
      this._transform = null;
      this._invertTransform = null;
      this._basicTransform = null;
      this.transformStack = [];
      this.portDamageFunction = null;
      this.transformFunction = null;
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
      if (this._transform === null) {
        this._transform = this._lookupTransform();
      }
      return this._transform;
    }

    invertTransform(): Matrix2D {
      if (this._invertTransform === null) {
        this._invertTransform = this.transform().clone().invert();
      }
      return this._invertTransform;
    }

    deviceToWorld(h: number, v: number): Point {
      const result = MakePoint(0, 0);
      return this.invertTransform().transformPoint(h, v , result) as Point;
    }

    worldToDevice(x: number, y: number): Point {
      const result = MakePoint(0, 0);
      return this.transform().transformPoint(x, y, result) as Point;
    }

    pushTransform(transform: Matrix2D) {
      this.transformStack.push(transform);
      this._damageTransform();
    }

    popTransform(): Matrix2D | null | any {
      if (this.transformStack.length === 0) {
        return new createjs.Matrix2D();
      }
      const result: any = this.transformStack.pop();
      this._damageTransform();
      return result;
    }

    _lookupTransform(): Matrix2D {
      const newTransform = new createjs.Matrix2D();
      newTransform.prependMatrix(this.basicTransform());
      this.transformStack.map(function (item) {
        newTransform.prependMatrix(item);
      });
      return newTransform;
    }

    basicTransform(): Matrix2D {
      if (this._basicTransform === null) {
        this._basicTransform = this._lookupBasicTransform();
      }
      return this._basicTransform;
    }

    _lookupBasicTransform(): Matrix2D {
      const tx = new createjs.Matrix2D();
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
      this._basicTransform = null;
      this._transform = null;
      this._invertTransform = null;
      if (this.portDamageFunction !== null) {
        const self = this;
        this.portDamageFunction(self);
      }
    }
  } // Viewport


  export function point_x(obj: PointLike): number {
    if ('x' in obj) {
      return obj['x'];
    }
    else {
      return obj[0];
    }
  };

  export function point_y(obj: PointLike): number {
    if ('y' in obj) {
      return obj['y'];
    }
    else {
      return obj[1];
    }
  };

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

} // namespace GEO
