/// <reference path="../../geometry/geo.ts" />
/// <reference path="../gds.ts" />
/// <reference path="../elements.ts" />
/// <reference path="../container.ts" />
import fs from 'node:fs';

import { Library, Structure } from '../container.js';
import { GElement } from '../elements.js';

// DATA TYPE
const NO_DATA   = 0;
const BIT_ARRAY = 1;
const INT2      = 2;
const INT4      = 3;
const REAL4     = 4;
const REAL8     = 5;
const ASCII     = 6;

// RECORD TYPE
const HEADER       = 0;
const BGNLIB       = 1;
const LIBNAME      = 2;
const UNITS        = 3;
const ENDLIB       = 4;
const BGNSTR       = 5;
const STRNAME      = 6;
const ENDSTR       = 7;
const BOUNDARY     = 8;
const PATH         = 9;
const SREF         = 10;
const AREF         = 11;
const TEXT         = 12;
const LAYER        = 13;
const DATATYPE     = 14;
const WIDTH        = 15;
const XY           = 16;
const ENDEL        = 17;
const SNAME        = 18;
const COLROW       = 19;
const TEXTNODE     = 20;
const NODE         = 21;
const TEXTTYPE     = 22;
const PRESENTATION = 23;
const SPACING      = 24;
const STRING       = 25;
const STRANS       = 26;
const MAG          = 27;
const ANGLE        = 28;
const UINTEGER     = 29;
const USTRING      = 30;
const REFLIBS      = 31;
const FONTS        = 32;
const PATHTYPE     = 33;
const GENERATIONS  = 34;
const ATTRTABLE    = 35;
const STYPTABLE    = 36;
const STRTYPE      = 37;
const ELFLAGS      = 38;
const ELKEY        = 39;
const LINKTYPE     = 40;
const LINKKEYS     = 41;
const NODETYPE     = 42;
const PROPATTR     = 43;
const PROPVALUE    = 44;
const BOX          = 45;
const BOXTYPE      = 46;
const PLEX         = 47;
const BGNEXTN      = 48;
const ENDEXTN      = 49;
const TAPENUM      = 50;
const TAPECODE     = 51;
const STRCLASS     = 52;
const RESERVED     = 53;
const FORMAT       = 54;
const MASK         = 55;
const ENDMASKS     = 56;

const HEADER_MAP = new Map([
  ['HEADER', 0],
  ['BGNLIB', 1],
  ['LIBNAME', 2],
  ['UNITS', 3],
  ['ENDLIB', 4],
  ['BGNSTR', 5],
  ['STRNAME', 6],
  ['ENDSTR', 7],
  ['BOUNDARY', 8],
  ['PATH', 9],
  ['SREF', 10],
  ['AREF', 11],
  ['TEXT', 12],
  ['LAYER', 13],
  ['DATATYPE', 14],
  ['WIDTH', 15],
  ['XY', 16],
  ['ENDEL', 17],
  ['SNAME', 18],
  ['COLROW', 19],
  ['TEXTNODE', 20],
  ['NODE', 21],
  ['TEXTTYPE', 22],
  ['PRESENTATION', 23],
  ['SPACING', 24],
  ['STRING', 25],
  ['STRANS', 26],
  ['MAG', 27],
  ['ANGLE', 28],
  ['UINTEGER', 29],
  ['USTRING', 30],
  ['REFLIBS', 31],
  ['FONTS', 32],
  ['PATHTYPE', 33],
  ['GENERATIONS', 34],
  ['ATTRTABLE', 35],
  ['STYPTABLE', 36],
  ['STRTYPE', 37],
  ['ELFLAGS', 38],
  ['ELKEY', 39],
  ['LINKTYPE', 40],
  ['LINKKEYS', 41],
  ['NODETYPE', 42],
  ['PROPATTR', 43],
  ['PROPVALUE', 44],
  ['BOX', 45],
  ['BOXTYPE', 46],
  ['PLEX', 47],
  ['BGNEXTN', 48],
  ['ENDEXTN', 49],
  ['TAPENUM', 50],
  ['TAPECODE', 51],
  ['STRCLASS', 52],
  ['RESERVED', 53],
  ['FORMAT', 54],
  ['MASK', 55],
  ['ENDMASKS', 56],
]);

function reversedMap(arg: Map<string, number>): Map<number, string> {
  const result: Map<number, string> = new Map();
  for (const [key, value] of arg) {
    result[value] = key;
  };
  return result;
}

const HEADER_MAP_REVERSED = reversedMap(HEADER_MAP);

function recordSymbol(rType: number): string {
  return HEADER_MAP_REVERSED[rType];
}

const POW_2_56 = 2 ** 56;

function extractInt2Array(body: Buffer): Array<number> {
  const count = body.length / 2;
  const vals: Array<number> = [];
  for (let i = 0; i < count; i++) {
    const numBuff = body.subarray(i * 2, i * 2 + 2);
    vals.push(numBuff.readInt16BE());
  }
  return vals;
}

function extractInt4Array(body: Buffer): Array<number> {
  const count = body.length / 4;
  const vals: Array<number> = [];
  for (let i = 0; i < count; i++) {
    const numBuff = body.subarray(i * 4, i * 4 + 4);
    vals.push(numBuff.readInt32BE());
  }
  return vals;
}


function extractReal8(body: Buffer): number {
  const sign = body[0] & 0x80;
  const exponent = (body[0] & 0x7f) - 64;
  let mantissaInt = 0;
  for (let i = 1; i < 8; i++) {
    mantissaInt *= 256;
    mantissaInt += body[i];
  }
  const mantissaFloat = mantissaInt / POW_2_56;
  let result = mantissaFloat * (16 ** exponent);
  if (sign) {
    result = -result;
  }
  return result;
}

function extractReal8Array(body: Buffer): Array<number> {
  const count = body.length / 8;
  const vals: Array<number> = [];
  for (let i = 0; i < count; i++) {
    const numBuff = body.subarray(i * 8, i * 8 + 8);
    vals.push(extractReal8(numBuff));
  }
  return vals;
}

function extractAscii(body: Buffer): string {
  const zeroIndex = body.indexOf(0);
  if (zeroIndex > 0) {
    return (new TextDecoder).decode(body.subarray(0, zeroIndex));
  }
  else {
    return (new TextDecoder).decode(body);
  }
}

function asAtomic(v: any): any {
  if (Array.isArray(v) && v.length == 1) {
    return v[0];
  }
  return v;
}

export class Inform {
  /* path to gds file */
  _gdsPath: string;
  _consoleOut: boolean;
  _library: Library | undefined;
  _structure: Structure | undefined ;
  _element: GElement | undefined ;

  constructor() {
    this._gdsPath = "";
    this._consoleOut = false;
    this._library = undefined;
    this._structure = undefined;
  }

  set gdsPath(path: string) {
    this._gdsPath = path;
  }

  get gdsPath(): string {
    return this._gdsPath;
  }

  get library(): Library {
    return this._library;
  }

  async run(): Promise<void> {
    if (!fs.existsSync(this._gdsPath)) {
      console.log(`File Not found: '${this._gdsPath }'`);
      return;
    }

    let count: number = 0;
    const fd = fs.openSync(this.gdsPath, 'r');
    while (true) {
      const len_buff = Buffer.alloc(2);
      const num = fs.readSync(fd, len_buff, 0, 2, null);
      if (this._consoleOut) console.log({len_buff: len_buff});
      if (num < 2) {
        break;
      }
      const rec_len = len_buff.readUInt16BE(0);
      if (this._consoleOut) console.log({rec_len: rec_len});
      if (rec_len <= 0) {
        break;
      }
      const read_len = rec_len - 2;
      const buff = Buffer.alloc(read_len);
      const num_read = fs.readSync(fd, buff, 0, read_len, null);
      if (num_read <= 0) {
        break;
      }
      if (this._consoleOut) console.log({buff: buff});
      this._handleBuffer(buff);
      count += 1;
    }
    fs.closeSync(fd);
    if (this._consoleOut) console.log({count: count});
    console.log({library: this._library});
    console.log("Inform>>run");
  }

  _handleBuffer(buff: Buffer): void {
    const rType: number = buff[0];
    const dType: number = buff[1];
    const decoded = [];
    const body = buff.subarray(2);
    switch (dType) {
      case BIT_ARRAY:
      case INT2:
        decoded[dType] = asAtomic(extractInt2Array(body));
        break;
      case INT4:
        decoded[INT4] = asAtomic(extractInt4Array(body));
        break;
      case REAL8:
        decoded[REAL8] = asAtomic(extractReal8Array(body));
        break;
      case ASCII:
        decoded[ASCII] = extractAscii(body);
        break;
      default:
        break;
    }
    switch (rType) {
      case BGNLIB:
      case UNITS:
      case LIBNAME:
        if (rType == BGNLIB) {
          this._library = new Library();
        }
        this._library.sfAttr[recordSymbol(rType)] = decoded[dType];
        break;
      case BGNSTR:
      case STRNAME:
        if (rType == BGNSTR) {
          this._structure = new Structure();
        }
        this._structure.sfAttr[recordSymbol(rType)] = decoded[dType];
        break;
      case ENDSTR:
        if (this._structure) {
          this._library.addStructure(this._structure);
          this._structure = undefined;
        }
        break;

      case BOUNDARY:
      case PATH:
      case SREF:
      case AREF:
      case TEXT:
        this._element = GElement.fromType(rType);
        break;

      case ELKEY:
      case XY:
      case LAYER:
      case ELFLAGS:
      case PLEX:
      case DATATYPE:
      case PATHTYPE:
      case TEXTTYPE:
      case NODETYPE:
      case BOXTYPE:
      case WIDTH:
      case STRING:
      case COLROW:
      case STRANS:
      case MAG:
      case PLEX:
      case ANGLE:
      case PRESENTATION:
      case PROPATTR:
      case PROPVALUE:
      case SNAME:
        this._element.sfAttr[recordSymbol(rType)] = decoded[dType];
        break;

      case ENDEL:
        if (this._structure && this._element) {
          this._structure.addElement(this._element);
          this._element = undefined;
        }
        break;
      default:
        break;
    }
  }

  exampleList(): Array<string> {
    return fs.readdirSync('.');
  }
};
