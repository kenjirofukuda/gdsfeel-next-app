"use server";
/// <reference path="../../geometry/geo.ts" />
/// <reference path="../gds.ts" />
/// <reference path="../elements.ts" />
/// <reference path="../container.ts" />
import fs from 'node:fs';

//namespace GDS {
  export class Inform {
    /* path to gds file */
    _gdsPath: string;

    constructor() {
      this._gdsPath = "";
    }

    set gdsPath(path: string) {
      this._gdsPath = path;
    }

    get gdsPath(): string {
      return this._gdsPath;
    }

    run(): void {
      if (! fs.existsSync(this._gdsPath)) {
        console.log(`File Not found: '{this._gdsPath}'`);
        return;
      }
      console.log("run");
    }
  };
// } // GDS

//export { GDS };
