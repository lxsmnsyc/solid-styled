/* eslint-disable no-bitwise */
function secretSauce(r1: number): number {
  return ((1366.0 * r1 + 150889) % 714025) / 714025.0;
}

function createPseudoEncrypt(sauce = secretSauce): (value: number) => number {
  return function pseudoEncrypt(value: number): number {
    /**
     * Make sure that the value is an int number
     */
    const baseValue = value | 0;

    /**
     * split value into two parts
     */
    let l1 = (baseValue >> 0x10) & 0xFFFF;
    let r1 = baseValue & 0xFFFF;

    /**
     * Begin cycle
     */
    for (let i = 0; i < 3; i += 1) {
      const l2 = r1;
      const r2 = l1 ^ (Math.round(sauce(r1) * 32767) | 0);
      l1 = l2;
      r1 = r2;
    }

    return (r1 << 16) + l1;
  };
}

const DEFAULT_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export default class UniqueIdGenerator {
  private alphabet: string;

  private base: number;

  private encrypt: (value: number) => number;

  private index = 0;

  constructor(alphabet: string = DEFAULT_ALPHABET, sauce = secretSauce) {
    this.alphabet = alphabet;
    this.base = alphabet.length;
    this.encrypt = createPseudoEncrypt(sauce);
  }

  next(): string {
    let output = '';
    let n = Math.abs(this.encrypt(this.index)) | 0;

    while (n > 0) {
      output += this.alphabet[(n % this.base)];
      n = (n / this.base) | 0;
    }

    this.index += 1;

    return output;
  }
}
