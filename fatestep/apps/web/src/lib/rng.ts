// 난수 추상화. 기본은 crypto 기반 보안 난수(Random.secure 대응).
// 테스트에서는 결정적 RNG 를 주입한다.

export interface Rng {
  /** [0, 1) 구간의 실수. */
  nextDouble(): number;
}

/** 브라우저/Node 공용 보안 난수. */
export const secureRng: Rng = {
  nextDouble(): number {
    const buf = new Uint32Array(1);
    // globalThis.crypto 는 브라우저와 Node18+ 모두에서 제공된다.
    crypto.getRandomValues(buf);
    return buf[0] / 0x1_0000_0000; // 2^32
  },
};

/** 시드 기반 결정적 RNG (mulberry32). 테스트·재현용. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    nextDouble(): number {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** Fisher–Yates 셔플. 원본 배열을 건드리지 않고 사본을 반환한다. */
export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng.nextDouble() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
