"use strict";

/* global GEO, GDS */


GDS.Element = class extends GDS.Object {
  constructor(jsonMap) {
    super();
    this.hash = jsonMap;
  }

  get x() {
    return this.vertices()[0][0];
  }

  get y() {
    return this.vertices()[0][1];
  }

  vertices() {
    if (!this._vertices) {
      this._vertices = this._lookupVertices();
    }
    return this._vertices;
  }
  
  dataExtent() {
    if (!this._dataExtent) {
      this._dataExtent = this._lookupDataExtent();
    }
    return this._dataExtent;
  }

  toString() {
    return 'Element';
  }

  _lookupDataExtent() {
    return GEO.calcExtentBounds(this.vertices());
  }

  _lookupVertices() {
    let values = this.hash.map.XY;
    let result = [];
    for (let i = 0; i < values.length / 2; i++) {
      let x = values[i * 2 + 0] * 0.001;
      let y = values[i * 2 + 1] * 0.001;
      result.push([x, y]);
    }
    return result;
  }

  get datatype () {
    return this.hash.map['DATATYPE'] || 0;
  }

  get layer () {
    return this.hash.map['LAYER'] || 0;
  }

  attrOn(stream) {
    stream['vertices'] = this.vertices();
    stream['elkey'] = this.hash.elkey;
    stream['datatype'] = this.datatype;
    stream['layer'] = this.layer;
    stream['dataExtent'] = this.dataExtent();
  }
};


GDS.Element.fromObject = function (hash) {
  if (hash.type === "point") {
    return new GDS.Point(hash);
  }
  if (hash.type === "path") {
    return new GDS.Segment(hash);
  }
  if (hash.type === "boxtext") {
    return new GDS.BoxText(hash);
  }
  if (hash.type === "boundary") {
    return new GDS.Boundary(hash);
  }
  return null;
};

GDS.Element.fromObject2 = function (hash) {
  if (hash.type === 9) { // PATH
    return new GDS.Path(hash);
  }
  if (hash.type === 12) { // TEXT
    return new GDS.Text(hash);
  }
  if (hash.type === 8) { // BOUNDARY
    return new GDS.Boundary(hash);
  }
  if (hash.type === 10) { // SREF
    return new GDS.Sref(hash);
  }
  if (hash.type === 11) { // AREF
    return new GDS.Aref(hash);
  }
  return null;
};


GDS.Sref = class extends GDS.Element {
  constructor(hash) {
    super(hash);
    this._refStructure = null;
  }

  get refName() {
    return this.hash.map['SNAME'];
  }
  
  get reflected() {
    return (this.hash.map['STRANS'] & 0x8000) != 0;
  }

  get angleAbsolute() {
    return (this.hash.map['STRANS'] & 0x8001) != 0;
  }

  get magAbsolute() {
    return (this.hash.map['STRANS'] & 0x8002) != 0;
  }

  get angleDegress() {
    return this.hash.map['ANGLE'] || 0.0;
  }
  
  get magnify() {
    return this.hash.map['MAG'] || 1.0;
  }
  
  get refStructure() {
    if (this._refStructure === null) {
      this._refStructure = this.root().structureNamed(this.refName);
    }
    return this._refStructure;
  }

  attrOn(stream) {
    super.attrOn(stream);
    stream['refName'] = this.refName;
    stream['reflected'] = this.reflected;
    stream['angleAbsolute'] = this.angleAbsolute;
    stream['magAbsolute'] = this.magAbsolute;
    stream['angleDegress'] = this.angleDegress;
    stream['magnify'] = this.magnify;
    stream['transform'] = this.transform();
  }
  
  transform() {
    if (! this._transform) {
      this._transform = this._lookupTransform2();
    }
    return this._transform;
  }

  _lookupTransform() {
    const tx = new createjs.Matrix2D();
    tx.translate(this.x, this.y);
    tx.scale(this.magnify, this.magnify);
    tx.rotate(this.angleDegress);
    if (this.reflected) {
      tx.scale(1, -1);
    }
    return tx;
  }
  
  _lookupTransform2() {
    const rtx = new createjs.Matrix2D();
    const rad = this.angleDegress * Math.PI / 180;
    const radCos = Math.cos(rad);
    const radSin = Math.sin(rad);
    rtx.a = this.magnify *  radCos; // a11
    rtx.c = this.magnify * -radSin; // a12
    rtx.tx = this.x                 // a13;
    rtx.b = this.magnify *  radSin; // a21
    rtx.d = this.magnify *  radCos; // a22
    rtx.ty = this.y                 // a23;
    if (this.reflected) {
      rtx.c = -rtx.c;               // a12;
      rtx.d = -rtx.d;               // a22;
    }
    return rtx;
  }
  
};

GDS.Aref = class extends GDS.Sref {
  constructor(hash) {
    super(hash);
    this._rowStep = null;
    this._colStep = null;
    this._repeatedTransforms = null;
  }

  attrOn(stream) {
    super.attrOn(stream);
    stream['cols'] = this.cols;
    stream['rows'] = this.rows;
    stream['colStep'] = this.colStep;
    stream['rowStep'] = this.rowStep;
    stream['repeatedTransforms'] = this.repeatedTransforms();
  }
  
  get cols() {
    return (this.hash.map['COLROW'])[0];
  }

  get rows() {
    return (this.hash.map['COLROW'])[1];
  }

  get colStep() {
    if (! this._colStep) {
      this._colStep = 0.0;
      const invertTx = this.transform().clone().invert();
      const p = this.vertices()[1]; 
      const colPoint = invertTx.transformPoint(p[0], p[1]);
      if (GEO.point_x(colPoint) < 0.0) {
        throw new Error("Error in AREF! Found a y-axis mirrored array. This is impossible so I\'m exiting.");
      }
      this._colStep = GEO.point_x(colPoint) / this.cols;
    }
    return this._colStep;
  }

  get rowStep() {
    if (! this._rowStep) {
      this._rowStep = 0.0;
      const invertTx = this.transform().clone().invert();
      const p = this.vertices()[2]; 
      const rowPoint = invertTx.transformPoint(p[0], p[1]);
      this._rowStep = GEO.point_y(rowPoint) / this.rows;
    }
    return this._rowStep;
  }

  repeatedTransforms() {
    if (! this._repeatedTransforms) {
      this._repeatedTransforms = this._lookupRepeatedTransforms();
    }
    return this._repeatedTransforms;
  }
  
  _lookupRepeatedTransforms() {
    let result = [];
    for (let ix = 0; ix < this.cols; ix++) {
      for (let iy = 0; iy < this.rows; iy++) {
        const otx = new createjs.Matrix2D();
        otx.translate(ix * this.colStep, iy * this.rowStep);
        otx.prependMatrix(this.transform());
        result.push(otx);
      }
    }
    return result;
  }
  
};


GDS.Path = class extends GDS.Element {
  constructor(jsonMap) {
    super(jsonMap);
    this._outlineCoords = null;
  }

  get pathtype() {
    return this.hash.map['PATHTYPE'];
  }

  get width() {
    return this.hash.map['WIDTH'] * 0.001;
  }

  attrOn(stream) {
    super.attrOn(stream);
    stream['pathtype'] = this.pathtype;
    stream['width'] = this.width;
    stream['outloineCoords'] = this.outlineCoords();
  }
  
  outlineCoords() {
    if (! this._outlineCoords) {
      this._outlineCoords =
        GDS.pathOutlineCoords(this.vertices(), this.pathtype, this.width);
    }
    return this._outlineCoords;
  }
  
};


GDS.Boundary = class extends GDS.Element {
};


GDS.Text = class extends GDS.Element {
  get string () {
    return this.hash.map['STRING'];
  }

  get texttype () {
    return this.hash.map['TEXTTYPE'] || 0;
  }

  get presentation () {
    return this.hash.map['PRESENTATION'] || 0;
  }

  get magnify () {
    return this.hash.map['MAG'] || 0;
  }

  attrOn(stream) {
    super.attrOn(stream);
    stream['string'] = this.string;
    stream['texttype'] = this.texttype;
    stream['presentation'] = this.presentation;
    stream['magnify'] = this.magnify;
  }
};


GDS.Point = class extends GDS.Element {

  constructor(hash) {
    super(hash);
  }

  toString () {
    return "Point(" + this.vertices()[0] + ")";
  }
  
  _lookupDataExtent() {
    return GEO.MakeRect(this.x, this.y);
  }
};


GDS.getAngle = function(x1, y1, x2, y2) {
  let angle = 0.0;

  if (x1 == x2) {
    angle = GDS.PI_HALF * ((y2 > y1) ? 1 : -1);
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


GDS.getDeltaXY = function(hw, p1, p2, p3) {
  let result = [0, 0];
  const alpha = GDS.getAngle(p1[0], p1[1], p2[0], p2[1]);
  const beta = GDS.getAngle(p2[0], p2[1], p3[0], p3[1]);
  const theta = (alpha + beta + Math.PI) / 2.0;
  if (Math.abs(Math.cos((alpha - beta) / 2.0)) < GDS.EPS) {

    throw new Error('Internal algorithm error: cos((alpha - beta)/2) = 0');
    result[0] = 0.0;
    result[1] = 0.0;
    return result;
  }
  const r = hw / Math.cos((alpha - beta) / 2.0);
  result[0] = r * Math.cos(theta);
  result[1] = r * Math.sin(theta);
  return result;
};

GDS.getEndDeltaXY = function(hw, p1, p2) {
  const result = [0, 0];
  const alpha = GDS.getAngle(p1[0], p1[1], p2[0], p2[1]);
  const theta = alpha;
  const r = hw;
  result[0] = -r * Math.sin(theta);
  result[1] = r * Math.cos(theta);
  return result;
};


GDS.pathOutlineCoords = function(coords, pathType, width) {
  const points = [];
  const hw = width / 2.0;
  const numPoints = coords.length;
  if (numPoints < 2) {
    console.log("pathOutlineCoords: don't know to handle wires < 2 pts yet");
    return null;
  }
  const numAlloc = 2 * numPoints + 1;
  for (let i = 0; i < numAlloc; i++) {
    points.push([0, 0]);
  }
  let deltaxy = GDS.getEndDeltaXY(hw, coords[0], coords[1]);
  if (pathType === GDS.BUTT_END) {
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
    deltaxy = GDS.getDeltaXY(hw, coords[i - 1], coords[i], coords[i + 1]);
    points[i][0] = coords[i][0] + deltaxy[0];
    points[i][1] = coords[i][1] + deltaxy[1];
    points[2 * numPoints - i - 1][0] = coords[i][0] - deltaxy[0];
    points[2 * numPoints - i - 1][1] = coords[i][1] - deltaxy[1];
  }

  deltaxy = GDS.getEndDeltaXY(hw, coords[numPoints - 2], coords[numPoints - 1]);
  if (pathType === GDS.BUTT_END) {
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
  return points;
};




