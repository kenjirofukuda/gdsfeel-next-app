/// <reference path="../geometry/geo.ts" />
/// <reference path="gds.ts" />
/// <reference path="container.ts" />
import * as GEO from '../geometry/geo.js';
import { GObject, BUTT_END } from './gds.js';
import { Structure, Library } from './container.js';

export type CE = GEO.CE;
export type Coords = GEO.Coords;

export class GElement extends GObject {
  hash: any;
  _vertices: Coords | undefined;
  _dataExtent: GEO.Rectangle | undefined;

  constructor(jsonMap: object) {
    super();
    this._vertices = undefined;
    this._dataExtent = undefined;
    this.hash = jsonMap;
  }

  forgetParent() {
    super.forgetParent();
    this._vertices = undefined;
    this._dataExtent = undefined;
  }

  get elkey(): number {
    return this.sfAttr['ELKEY'] || -1;
  }

  get x(): number {
    return this.vertices()[0][0];
  }

  get y(): number {
    return this.vertices()[0][1];
  }

  vertices(): Coords {
    if (!this._vertices) {
      this._vertices = this._lookupVertices();
    }
    return this._vertices;
  }

  dataExtent(): GEO.Rectangle {
    if (!this._dataExtent) {
      this._dataExtent = this._lookupDataExtent();
    }
    return this._dataExtent;
  }

  typeString(): string {
    return 'Element';
  }

  toString(): string {
    return `${this.typeString()}(${this.elkey})`;
  }

  _lookupDataExtent(): GEO.Rectangle {
    return GEO.calcExtentBounds(this.vertices());
  }

  _lookupVertices(): Coords {
    const values = this.sfAttr['XY'];
    const result: Coords = [];
    const library = this.root() as Library;
    const dbu = library.databaseUnit;
    for (let i = 0; i < values.length / 2; i++) {
      let x = values[i * 2 + 0] * dbu;
      let y = values[i * 2 + 1] * dbu;
      result.push([x, y] as CE);
    }
    return result as Coords;
  }

  get datatype(): number {
    return this.sfAttr['DATATYPE'] || 0;
  }

  get layer(): number {
    return this.sfAttr['LAYER'] || 0;
  }

  attrOn(stream: any): void {
    stream['vertices'] = this.vertices();
    stream['elkey'] = this.elkey;
    stream['datatype'] = this.datatype;
    stream['layer'] = this.layer;
    stream['dataExtent'] = this.dataExtent();
  }

  static fromObject2(hash: any) {
    return this.fromType(hash.type);
  }

  static fromType(type: number) {
    const hash = {type: type};
    if (type === 9) { // PATH
      return new Path(hash);
    }
    if (type === 12) { // TEXT
      return new Text(hash);
    }
    if (type === 8) { // BOUNDARY
      return new Boundary(hash);
    }
    if (type === 10) { // SREF
      return new Sref(hash);
    }
    if (type === 11) { // AREF
      return new Aref(hash);
    }
    return undefined;
  }

  loadFromObject(o: any) {
    this.sfAttr = { ...o.sfAttr };
  }
}

export class Sref extends GElement {
  _transform: GEO.Matrix2D | undefined;
  _refStructure: Structure | undefined;
  constructor(hash: any) {
    super(hash);
    this._refStructure = undefined;
    this._transform = undefined;
  }

  forgetParent() {
    super.forgetParent();
    this._refStructure = undefined;
    this._transform = undefined;
  }

  get refName(): string {
    return this.sfAttr['SNAME'];
  }

  get reflected(): boolean {
    return (this.sfAttr['STRANS'] & 0x8000) != 0;
  }

  get angleAbsolute(): boolean {
    return (this.sfAttr['STRANS'] & 0x8001) != 0;
  }

  get magAbsolute(): boolean {
    return (this.sfAttr['STRANS'] & 0x8002) != 0;
  }

  get angleDegress(): number {
    return this.sfAttr['ANGLE'] || 0.0;
  }

  get magnify(): number {
    return this.sfAttr['MAG'] || 1.0;
  }

  get refStructure(): Structure | undefined {
    if (this._refStructure === undefined) {
      this._refStructure = (this.root() as Library).structureNamed(this.refName);
    }
    return this._refStructure;
  }

  attrOn(stream: any): void {
    super.attrOn(stream);
    stream['refName'] = this.refName;
    stream['reflected'] = this.reflected;
    stream['angleAbsolute'] = this.angleAbsolute;
    stream['magAbsolute'] = this.magAbsolute;
    stream['angleDegress'] = this.angleDegress;
    stream['magnify'] = this.magnify;
    stream['transform'] = this.transform();
  }

  transform(): GEO.Matrix2D {
    if (!this._transform) {
      this._transform = this._lookupTransform2();
    }
    return this._transform;
  }

  _lookupTransform(): GEO.Matrix2D {
    const tx = GEO.MakeMatrix();
    tx.translate(this.x, this.y);
    tx.scale(this.magnify, this.magnify);
    tx.rotate(this.angleDegress);
    if (this.reflected) {
      tx.scale(1, -1);
    }
    return tx;
  }

  _lookupTransform2(): GEO.Matrix2D {
    const rtx = new GEO.Matrix2D();
    const rad = this.angleDegress * Math.PI / 180;
    const radCos = Math.cos(rad);
    const radSin = Math.sin(rad);
    rtx.a = this.magnify * radCos; // a11
    rtx.c = this.magnify * -radSin; // a12
    rtx.tx = this.x                 // a13;
    rtx.b = this.magnify * radSin; // a21
    rtx.d = this.magnify * radCos; // a22
    rtx.ty = this.y                 // a23;
    if (this.reflected) {
      rtx.c = -rtx.c;               // a12;
      rtx.d = -rtx.d;               // a22;
    }
    return rtx;
  }

  _basicOutlinePoints(): Array<GEO.PointLike> {
    const structureExtent: GEO.Rectangle = this.refStructure.dataExtent();
    const points = structureExtent.pointArray().map((p: GEO.Point) => {
      return this.transform().transformPoint(p.x, p.y);
    });
    return points;
  }

  _lookupDataExtent(): GEO.Rectangle {
    return GEO.calcExtentBounds(this._basicOutlinePoints());
  }

  toString(): string {
    return `${this.typeString()}(${this.elkey},'${this.refName}')`;
  }

  typeString(): string {
    return 'SREF'
  }

}

export class Aref extends Sref {
  _rowStep: number | undefined;
  _colStep: number | undefined;
  _repeatedTransforms: GEO.Matrix2D[] | undefined;

  constructor(hash: any) {
    super(hash);
    this._rowStep = undefined;
    this._colStep = undefined;
    this._repeatedTransforms = undefined;
  }

  forgetParent() {
    super.forgetParent();
    this._rowStep = undefined;
    this._colStep = undefined;
    this._repeatedTransforms = undefined;
  }

  attrOn(stream: any): void {
    super.attrOn(stream);
    stream['cols'] = this.cols;
    stream['rows'] = this.rows;
    stream['colStep'] = this.colStep;
    stream['rowStep'] = this.rowStep;
    stream['repeatedTransforms'] = this.repeatedTransforms();
  }

  get cols(): number {
    return (this.sfAttr['COLROW'])[0];
  }

  get rows(): number {
    return (this.sfAttr['COLROW'])[1];
  }

  get colStep(): number {
    if (!this._colStep) {
      this._colStep = 0.0;
      const invertTx = this.transform().clone().invert();
      const p = this.vertices()[1];
      const colPoint = invertTx.transformPoint(p[0], p[1]) as GEO.Point;
      if (GEO.point_x(colPoint) < 0.0) {
        throw new Error("Error in AREF! Found a y-axis mirrored array. This is impossible so I\'m exiting.");
      }
      this._colStep = GEO.point_x(colPoint) / this.cols;
    }
    return this._colStep;
  }

  get rowStep(): number {
    if (!this._rowStep) {
      this._rowStep = 0.0;
      const invertTx = this.transform().clone().invert();
      const p = this.vertices()[2];
      const rowPoint = invertTx.transformPoint(p[0], p[1]) as GEO.Point;
      this._rowStep = GEO.point_y(rowPoint) / this.rows;
    }
    return this._rowStep;
  }

  repeatedTransforms(): Array<GEO.Matrix2D> {
    if (!this._repeatedTransforms) {
      this._repeatedTransforms = this._lookupRepeatedTransforms();
    }
    return this._repeatedTransforms;
  }

  _lookupRepeatedTransforms(): Array<GEO.Matrix2D> {
    let result = [];
    for (let ix = 0; ix < this.cols; ix++) {
      for (let iy = 0; iy < this.rows; iy++) {
        const otx = new GEO.Matrix2D();
        otx.translate(ix * this.colStep, iy * this.rowStep);
        otx.prependMatrix(this.transform());
        result.push(otx);
      }
    }
    return result;
  }

  typeString(): string {
    return 'AREF';
  }

}

export class Path extends GElement {
  _outlineCoords: Coords | undefined;

  constructor(jsonMap: any) {
    super(jsonMap);
    this._outlineCoords = undefined;
  }

  forgetParent() {
    super.forgetParent();
    this._outlineCoords = undefined;
  }

  get pathtype(): number {
    return this.sfAttr['PATHTYPE'];
  }

  get width(): number {
    return this.sfAttr['WIDTH'] * 0.001;
  }

  attrOn(stream: any): void {
    super.attrOn(stream);
    stream['pathtype'] = this.pathtype;
    stream['width'] = this.width;
    stream['outloineCoords'] = this.outlineCoords();
  }

  outlineCoords(): Coords {
    if (!this._outlineCoords) {
      this._outlineCoords =
        pathOutlineCoords(this.vertices(), this.pathtype, this.width);
    }
    return this._outlineCoords;
  }

  typeString(): string {
    return 'PATH';
  }

};


export class Boundary extends GElement {
  typeString(): string {
    return 'BOUNDARY';
  }
}


export class Text extends GElement {
  get string(): string {
    return this.sfAttr['STRING'];
  }

  get texttype(): number {
    return this.sfAttr['TEXTTYPE'] || 0;
  }

  get presentation() {
    return this.sfAttr['PRESENTATION'] || 0;
  }

  get magnify() {
    return this.sfAttr['MAG'] || 0;
  }

  attrOn(stream: any) {
    super.attrOn(stream);
    stream['string'] = this.string;
    stream['texttype'] = this.texttype;
    stream['presentation'] = this.presentation;
    stream['magnify'] = this.magnify;
  }

  toString(): string {
    return `${this.typeString()}(${this.elkey},'${this.string}')`;
  }

  typeString() {
    return 'TEXT';
  }

}


export class Point extends GElement {

  constructor(hash: any) {
    super(hash);
  }

  toString(): string {
    return "Point(" + this.vertices()[0] + ")";
  }

  _lookupDataExtent() {
    return GEO.MakeRect(this.x, this.y, 0, 0);
  }

  typeString(): string {
    return 'POINT';
  }
};


function getAngle(x1: number, y1: number, x2: number, y2: number) {
  let angle = 0.0;

  if (x1 == x2) {
    angle = GEO.PI_HALF * ((y2 > y1) ? 1 : -1);
  }
  else {
    angle = Math.atan(Math.abs(y2 - y1) / Math.abs(x2 - x1));
    if (y2 >= y1) {
      if (x2 >= x1) {
        angle += 0;
      }
      else {
        angle = Math.PI - angle;
      }
    }
    else {
      if (x2 >= x1) {
        angle = 2 * Math.PI - angle;
      }
      else {
        angle += Math.PI;
      }
    }
  }
  return angle;
};


function getDeltaXY(hw: number, p1: CE, p2: CE, p3: CE) {
  let result = [0, 0];
  const alpha = getAngle(p1[0], p1[1], p2[0], p2[1]);
  const beta = getAngle(p2[0], p2[1], p3[0], p3[1]);
  const theta = (alpha + beta + Math.PI) / 2.0;
  if (Math.abs(Math.cos((alpha - beta) / 2.0)) < GEO.EPS) {

    throw new Error('Internal algorithm error: cos((alpha - beta)/2) = 0');
  }
  const r = hw / Math.cos((alpha - beta) / 2.0);
  result[0] = r * Math.cos(theta);
  result[1] = r * Math.sin(theta);
  return result;
};

function getEndDeltaXY(hw: number, p1: CE, p2: CE) {
  const result = [0, 0];
  const alpha = getAngle(p1[0], p1[1], p2[0], p2[1]);
  const theta = alpha;
  const r = hw;
  result[0] = -r * Math.sin(theta);
  result[1] = r * Math.cos(theta);
  return result;
};

function pathOutlineCoords(coords: Coords, pathType: number, width: number): Coords {
  const points = [];
  const hw = width / 2.0;
  const numPoints = coords.length;
  if (numPoints < 2) {
    console.log("pathOutlineCoords: don't know to handle wires < 2 pts yet");
    return [];
  }
  const numAlloc = 2 * numPoints + 1;
  for (let i = 0; i < numAlloc; i++) {
    points.push([0, 0]);
  }
  let deltaxy = getEndDeltaXY(hw, coords[0], coords[1]);
  if (pathType === BUTT_END) {
    points[0][0] = coords[0][0] + deltaxy[0];
    points[0][1] = coords[0][1] + deltaxy[1];
    points[2 * numPoints][0] = coords[0][0] + deltaxy[0];
    points[2 * numPoints][1] = coords[0][1] + deltaxy[1];
    points[2 * numPoints - 1][0] = coords[0][0] - deltaxy[0];
    points[2 * numPoints - 1][1] = coords[0][1] - deltaxy[1];
  }
  else {
    points[0][0] = coords[0][0] + deltaxy[0] - deltaxy[1];
    points[0][1] = coords[0][1] + deltaxy[1] - deltaxy[0];
    points[2 * numPoints][0] = coords[0][0] + deltaxy[0] - deltaxy[1];
    points[2 * numPoints][1] = coords[0][1] + deltaxy[1] - deltaxy[0];
    points[2 * numPoints - 1][0] = coords[0][0] - deltaxy[0] - deltaxy[1];
    points[2 * numPoints - 1][1] = coords[0][1] - deltaxy[1] - deltaxy[0];
  }

  for (let i = 1; i < numPoints - 1; i++) {
    deltaxy = getDeltaXY(hw, coords[i - 1], coords[i], coords[i + 1]);
    points[i][0] = coords[i][0] + deltaxy[0];
    points[i][1] = coords[i][1] + deltaxy[1];
    points[2 * numPoints - i - 1][0] = coords[i][0] - deltaxy[0];
    points[2 * numPoints - i - 1][1] = coords[i][1] - deltaxy[1];
  }

  deltaxy = getEndDeltaXY(hw, coords[numPoints - 2], coords[numPoints - 1]);
  if (pathType === BUTT_END) {
    points[numPoints - 1][0] = coords[numPoints - 1][0] + deltaxy[0];
    points[numPoints - 1][1] = coords[numPoints - 1][1] + deltaxy[1];
    points[numPoints][0] = coords[numPoints - 1][0] - deltaxy[0];
    points[numPoints][1] = coords[numPoints - 1][1] - deltaxy[1];
  }
  else {
    points[numPoints - 1][0] = coords[numPoints - 1][0] + deltaxy[0] + deltaxy[1];
    points[numPoints - 1][1] = coords[numPoints - 1][1] + deltaxy[1] + deltaxy[0];
    points[numPoints][0] = coords[numPoints - 1][0] - deltaxy[0] + deltaxy[1];
    points[numPoints][1] = coords[numPoints - 1][1] - deltaxy[1] + deltaxy[0];
  }
  return points as Coords;
};
