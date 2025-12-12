/// <reference path="../geometry/geo.ts" />
/// <reference path="./gds.ts" />
/// <reference path="./elements.ts" />

import * as GEO from '../geometry/geo.js';
import { GObject } from './gds.js';
import { GElement} from './elements.js';

export class Structure extends GObject {
  _elements: Array<GElement>;
  _dataExtent?: GEO.Rectangle;
  hash: any;
  _idSeed: number;

  constructor() {
    super();
    this._elements = [];
    this._dataExtent = undefined;
    this.hash = {};
    this._idSeed = 0;
  }

  forgetParent() {
    this.elements().forEach ((each) => {each.forgetParent()});
    super.forgetParent();
    this._dataExtent = undefined;
  }

  recordParent() {
    this.elements().forEach ((each) => {
      each.parent = this as GObject;
    });
  }

  get name(): string {
    return this.sfAttr['STRNAME']
  }

  addElement(e: GElement) {
    this._idSeed++;
    let elkey = this._idSeed;
    if (e.sfAttr['ELKEY']) {
      elkey = e.sfAttr['ELKEY'];
    }
    e.sfAttr['ELKEY'] = elkey;
    e.parent = this as GObject;
    this._elements.push(e);
  };

  elements(): Array<GElement> {
    return this._elements;
  }

  elementAtElkey(elkey: number) {
    return this._elements.find((e: GElement) => e.elkey == elkey);
  }

  dataExtent(): GEO.Rectangle {
    if (!this._dataExtent) {
      this._dataExtent = this._lookupDataExtent();
    }
    return this._dataExtent;
  }

  _lookupDataExtent(): GEO.Rectangle {
    if (this.elements().length === 0) {
      return GEO.MakeRect(0, 0, 0, 0);
    }
    let points: GEO.Coords = [];
    this.elements().forEach(function (e: GElement) {
      const r = e.dataExtent();
      r.pointArray().forEach(function (p: GEO.Point) {
        points.push([p.x, p.y] as GEO.CE);
      });
    });
    return GEO.calcExtentBounds(points);
  }

  // PHP serialized JSON version
  loadFromPhpJson(jsonMap: any) {
    this.hash = jsonMap;
    const self = this;
    jsonMap.elements.forEach(function (oElement: GElement) {
      const element = GElement.fromObject2(oElement);
      if (element) {
        self.addElement(element);
      }
    });
  }

  loadFromObject(o: any) {
    this.sfAttr = { ...o.sfAttr };
    o._elements.forEach((e) => {
      const elem = GElement.fromType(e.hash.type);
      elem.loadFromObject(e);
      this.addElement(elem);
    });
  }

};


export class Library extends GObject {
  _structures: Array<Structure>;
  _structureMap: Map<string, Structure>;
  hash: any;

  constructor() {
    super();
    this._structures = [];
    this._structureMap = new Map<string, Structure>;
  }

  get databaseUnit(): number {
    return this.sfAttr['UNITS'][0];
  }

  forgetParent() {
    this.structures().forEach ((each) => {each.forgetParent()});
    super.forgetParent();
    this._structureMap = new Map<string, Structure>;
  }

  recordParent() {
    this.structures().forEach ((each) => {
      each.parent = this as GObject;
      each.recordParent();
    });
  }

  addStructure(struct: Structure) {
    this._structures.push(struct);
    this._structureMap.set(struct.name, struct);
    struct.parent = this;
  }

  structureNamed(strucName: string): Structure | undefined {
    return this._structureMap.get(strucName);
  }

  structures(): Array<Structure> {
    return this._structures;
  }

  structureNames(): Array<string> {
    return this.structures().map((each) => each.name);
  }

  // PHP serialized JSON version
  loadFromPhpJson(jsonMap: any): void {
    this.hash = jsonMap;
    const self = this;
    Object.keys(jsonMap.structures).forEach(function (strucName) {
      const struct = new Structure();
      struct.loadFromPhpJson(jsonMap.structures[strucName]);
      self.addStructure(struct);
    });
  }

  loadFromObject(o: any) {
    this.sfAttr = { ...o.sfAttr };
    o._structures.forEach((s) => {
      const struct = new Structure();
      struct.loadFromObject(s);
      this.addStructure(struct);
    });
  }

  static fromObject(o: any): Library {
    const library = new Library();
    library.loadFromObject(o);
    return library;
  }

  stringify(): string {
    this.forgetParent();
    const result = JSON.stringify(this);
    this.recordParent();
    return result;
  }

  asObject(): object {
    return JSON.parse(this.stringify());
  }
}

export class Station {
  library: Library | undefined;
  structure: Structure | undefined;
  element: GElement | undefined;

  constructor() {
    this.library = undefined;
    this.structure = undefined;
    this.element = undefined;
  }
}
