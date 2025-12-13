export {};

/**
 * Number Extender
 */
declare global {
  interface Number {
    roundDigits(dig: number): number;
  }
}

function floatConvertSyncer(num: number, dig: number): number {
  const p = Math.pow(10, dig);
  return Math.round(num * p) / p;
}

(Number as any).prototype.roundDigits = function (dig: number): number {
  return floatConvertSyncer(this as number, dig);
};
