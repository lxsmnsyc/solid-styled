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

function prefix(x: number) {
  if (x < 0) {
    return 'n';
  }
  if (x > 0) {
    return 'p';
  }
  return 'z';
}

function findDigits(base: number): number {
  let x = 1;
  let current = base;

  while (current < 2147483647) {
    current *= base;
    x += 1;
  }
  return x;
}

export default class UniqueIdGenerator {
  private alphabet: string;

  private padding: string;

  private base: number;

  private digits: number;

  private encrypt: (value: number) => number;

  private index = 0;

  constructor(alphabet: string = DEFAULT_ALPHABET, sauce = secretSauce) {
    this.alphabet = alphabet;
    // eslint-disable-next-line prefer-destructuring
    this.padding = alphabet[0];
    this.base = alphabet.length;
    this.encrypt = createPseudoEncrypt(sauce);
    this.digits = findDigits(this.base);
  }

  next(): string {
    let output = '';
    const encrypted = this.encrypt(this.index);
    let n = Math.abs(encrypted) | 0;

    while (n > 0) {
      output = this.alphabet[(n % this.base)] + output;
      n = (n / this.base) | 0;
    }

    this.index += 1;

    return `${prefix(encrypted)}${output.padStart(this.digits, this.padding)}`;
  }
}
