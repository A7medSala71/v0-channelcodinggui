export interface Protocol {
  id: string
  label: string
  rate: number
  encode: (bits: number[]) => number[]
  decode: (bits: number[]) => number[]
}

export const repetitionProtocol = (rateFactor: number): Protocol => ({
  id: `rep1/${rateFactor}`,
  label: `Repetition 1/${rateFactor}`,
  rate: 1 / rateFactor,
  encode: (bits) => bits.flatMap((bit) => Array(rateFactor).fill(bit)),
  decode: (bits) => {
    const decoded: number[] = []
    for (let i = 0; i < bits.length; i += rateFactor) {
      const chunk = bits.slice(i, i + rateFactor)
      const sum = chunk.reduce((a, b) => a + b, 0)
      decoded.push(sum > rateFactor / 2 ? 1 : 0)
    }
    return decoded
  },
})

export const hamming74Protocol: Protocol = {
  id: "hamming74",
  label: "Hamming (7,4)",
  rate: 4 / 7,
  encode: (bits) => {
    const encoded: number[] = []
    for (let i = 0; i < bits.length; i += 4) {
      const b = bits.slice(i, i + 4)
      if (b.length < 4) break
      const p1 = (b[0] + b[1] + b[3]) % 2
      const p2 = (b[0] + b[2] + b[3]) % 2
      const p3 = (b[1] + b[2] + b[3]) % 2
      encoded.push(p1, p2, b[0], p3, b[1], b[2], b[3])
    }
    return encoded
  },
  decode: (bits) => {
    const decoded: number[] = []
    for (let i = 0; i < bits.length; i += 7) {
      const r = bits.slice(i, i + 7)
      if (r.length < 7) break
      decoded.push(r[2], r[4], r[5], r[6])
    }
    return decoded
  },
}

export const hamming1511Protocol: Protocol = {
  id: "hamming1511",
  label: "Hamming (15,11)",
  rate: 11 / 15,
  encode: (bits) => {
    const encoded: number[] = []
    for (let i = 0; i < bits.length; i += 11) {
      const b = bits.slice(i, i + 11)
      if (b.length < 11) break
      const p1 = (b[0] + b[1] + b[3] + b[4] + b[6] + b[8] + b[10]) % 2
      const p2 = (b[0] + b[2] + b[3] + b[5] + b[6] + b[9] + b[10]) % 2
      const p3 = (b[1] + b[2] + b[3] + b[7] + b[8] + b[9] + b[10]) % 2
      const p4 = (b[4] + b[5] + b[6] + b[7] + b[8] + b[9] + b[10]) % 2
      encoded.push(p1, p2, b[0], p3, b[1], b[2], b[3], p4, b[4], b[5], b[6], b[7], b[8], b[9], b[10])
    }
    return encoded
  },
  decode: (bits) => {
    const decoded: number[] = []
    for (let i = 0; i < bits.length; i += 15) {
      const r = bits.slice(i, i + 15)
      if (r.length < 15) break
      decoded.push(r[2], r[4], r[5], r[6], r[8], r[9], r[10], r[11], r[12], r[13], r[14])
    }
    return decoded
  },
}

export const uncodedProtocol: Protocol = {
  id: "none",
  label: "Uncoded (Raw)",
  rate: 1.0,
  encode: (bits) => bits,
  decode: (bits) => bits,
}

export const PROTOCOLS: Protocol[] = [
  uncodedProtocol,
  repetitionProtocol(3),
  repetitionProtocol(5),
  hamming74Protocol,
  hamming1511Protocol,
]
