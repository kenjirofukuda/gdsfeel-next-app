/// <reference path="../geometry/geo.ts" />
/// <reference path="./gds.ts" />
/// <reference path="./elements.ts" />

import * as GEO from '../geometry/geo';
import { GObject } from './gds';
import {
  GElement,
  Point,
  Path,
  Boundary,
  Text,
  Sref,
  Aref,
} from './elements';


export class Structure extends GObject {
  _elements: Array<GElement>;
  _dataExtent?: GEO.Rectangle;
  hash: any;

  constructor() {
    super();
    this._elements = [];
    this._dataExtent = null;
  }

  get name(): string {
    return this.hash.name;
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

  loadFromJson(jsonMap: any) {
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
  hash: any;
  constructor() {
    super();
    this._structures = [];
    this._structureMap = new Map<string, Structure>;
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

  loadFromJson(jsonMap: any): void {
    this.hash = jsonMap;
    const self = this;
    Object.keys(jsonMap.structures).forEach(function (strucName) {
      const struct = new Structure();
      struct.loadFromJson(jsonMap.structures[strucName]);
      self.addStructure(struct);
    });
  }
}


