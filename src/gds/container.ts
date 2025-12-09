/// <reference path="../geometry/geo.ts" />
/// <reference path="./gds.ts" />
/// <reference path="./elements.ts" />

import * as GEO from '@/src/geometry/geo';
import { GObject } from '@/src/gds/gds';
import {
  GElement,
  Point,
  Path,
  Boundary,
  Text,
  Sref,
  Aref,
} from '@/src/gds/elements';


export class Structure extends GObject {
  _elements: Array<GElement>;
  _dataExtent?: GEO.Rectangle;
  hash: any;

  constructor() {
    super();
    this._elements = [];
    this._dataExtent = undefined;
    this.hash = {};
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
    e.parent = this as GObject;
    this._elements.push(e);
  };

  elements(): Array<GElement> {
    return this._elements;
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

};


export class Library extends GObject {
  _structures: Array<Structure>;
  _structureMap: Map<string, Structure>;
  // _units: [number, number];
  // _bgnlib: Array<number>;
  // _name: string;
  hash: any;

  constructor() {
    super();
    this._structures = [];
    this._structureMap = new Map<string, Structure>;
    // this._units = [0, 0];
    // this._bgnlib = [];
    // this._name = '';
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

  stringify(): string {
    this.forgetParent();
    const result = JSON.stringify(this);
    this.recordParent();
    return result;
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

export type StationProps = {
  library: object;
  structureName: string;
};
