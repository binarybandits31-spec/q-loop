export interface Complex { re: number; im: number }

export function c(re: number, im: number = 0): Complex { return { re, im } }
export function cAdd(a: Complex, b: Complex): Complex { return { re: a.re + b.re, im: a.im + b.im } }
export function cSub(a: Complex, b: Complex): Complex { return { re: a.re - b.re, im: a.im - b.im } }
export function cMul(a: Complex, b: Complex): Complex { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re } }
export function cScale(a: Complex, s: number): Complex { return { re: a.re * s, im: a.im * s } }
export function cConj(a: Complex): Complex { return { re: a.re, im: -a.im } }
export function cAbs(a: Complex): number { return Math.sqrt(a.re * a.re + a.im * a.im) }
export function cAbs2(a: Complex): number { return a.re * a.re + a.im * a.im }
export function cArg(a: Complex): number { return Math.atan2(a.im, a.re) }

export function cFormat(a: Complex, precision: number = 3): string {
  const re = Math.abs(a.re) < 1e-10 ? 0 : a.re
  const im = Math.abs(a.im) < 1e-10 ? 0 : a.im
  const reStr = re.toFixed(precision).replace(/\.?0+$/, '')
  const imAbs = Math.abs(im).toFixed(precision).replace(/\.?0+$/, '')
  if (im === 0) return reStr
  if (re === 0) return im > 0 ? `${imAbs}i` : `-${imAbs}i`
  return im > 0 ? `${reStr} + ${imAbs}i` : `${reStr} - ${imAbs}i`
}
