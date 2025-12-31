export interface Protocol {
  id: string
  label: string
  rate: number
  encode: (bits: number[]) => number[]
  decode: (bits: number[]) => number[]
}

// Helper function to check if a number is a power of 2
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0
}

// Generic Repetition Code (matches Python implementation)
export function genericRepetitionEncode(data: number[], n: number): number[] {
  const encoded: number[] = []
  for (const bit of data) {
    for (let i = 0; i < n; i++) {
      encoded.push(bit)
    }
  }
  return encoded
}

export function genericRepetitionDecode(received: number[], n: number): number[] {
  const decoded: number[] = []
  for (let i = 0; i < received.length; i += n) {
    const block = received.slice(i, i + n)
    const sum = block.reduce((a, b) => a + b, 0)
    // Majority voting
    decoded.push(sum > n / 2 ? 1 : 0)
  }
  return decoded
}

// Generic Hamming Code (matches Python implementation)
export function genericHammingEncode(data: number[], n: number, k: number): number[] {
  // Calculate number of parity bits
  const m = Math.ceil(Math.log2(n + 1))
  
  // Validate that n = 2^m - 1
  if (n !== Math.pow(2, m) - 1) {
    console.error(`Invalid Hamming parameters: n=${n} must equal 2^m - 1 for some m`)
    return data // Return unencoded if invalid
  }

  const encoded: number[] = []
  
  // Process data in blocks of k bits
  for (let blockStart = 0; blockStart < data.length; blockStart += k) {
    const dataBlock = data.slice(blockStart, blockStart + k)
    
    // Pad with zeros if incomplete block
    while (dataBlock.length < k) {
      dataBlock.push(0)
    }

    // Initialize codeword array
    const codeword = new Array(n).fill(0)
    let dataIdx = 0

    // Place data bits in non-power-of-2 positions (systematic encoding)
    for (let pos = 1; pos <= n; pos++) {
      if (!isPowerOfTwo(pos)) {
        codeword[pos - 1] = dataBlock[dataIdx]
        dataIdx++
      }
    }

    // Calculate parity bits
    for (let parityIdx = 0; parityIdx < m; parityIdx++) {
      const parityPos = Math.pow(2, parityIdx)
      let parity = 0
      
      // Check all positions where this parity bit applies
      for (let pos = 1; pos <= n; pos++) {
        if ((pos & parityPos) !== 0) {
          parity ^= codeword[pos - 1]
        }
      }
      
      codeword[parityPos - 1] = parity
    }

    encoded.push(...codeword)
  }

  return encoded
}

export function genericHammingDecode(received: number[], n: number, k: number): number[] {
  const m = Math.ceil(Math.log2(n + 1))
  const decoded: number[] = []

  // Process received data in blocks of n bits
  for (let blockStart = 0; blockStart < received.length; blockStart += n) {
    const block = received.slice(blockStart, blockStart + n)
    
    // Skip incomplete blocks
    if (block.length < n) break

    // Calculate syndrome for error detection
    let syndrome = 0
    for (let parityIdx = 0; parityIdx < m; parityIdx++) {
      const parityPos = Math.pow(2, parityIdx)
      let parity = 0
      
      for (let pos = 1; pos <= n; pos++) {
        if ((pos & parityPos) !== 0) {
          parity ^= block[pos - 1]
        }
      }
      
      if (parity !== 0) {
        syndrome |= parityPos
      }
    }

    // Correct single-bit error if detected
    if (syndrome !== 0 && syndrome <= n) {
      block[syndrome - 1] ^= 1
    }

    // Extract data bits from non-power-of-2 positions
    for (let pos = 1; pos <= n; pos++) {
      if (!isPowerOfTwo(pos)) {
        decoded.push(block[pos - 1])
      }
    }
  }

  return decoded
}

// Factory function to create generic protocols dynamically
export function createGenericProtocol(
  type: "repetition" | "hamming",
  n: number,
  k?: number
): Protocol {
  if (type === "repetition") {
    return {
      id: `generic-rep-${n}`,
      label: `Generic Rep (1/${n})`,
      rate: 1 / n,
      encode: (bits) => genericRepetitionEncode(bits, n),
      decode: (bits) => genericRepetitionDecode(bits, n),
    }
  } else {
    // Hamming code
    const kVal = k || n - Math.ceil(Math.log2(n + 1))
    return {
      id: `generic-ham-${n}-${kVal}`,
      label: `Generic Ham (${n},${kVal})`,
      rate: kVal / n,
      encode: (bits) => genericHammingEncode(bits, n, kVal),
      decode: (bits) => genericHammingDecode(bits, n, kVal),
    }
  }
}

export const genericHammingProtocol = (n: number, k: number): Protocol => {
  const m = Math.ceil(Math.log2(n + 1))

  return {
    id: `hamming-${n}-${k}`,
    label: `Hamming (${n},${k})`,
    rate: k / n,
    encode: (bits) => genericHammingEncode(bits, n, k),
    decode: (bits) => genericHammingDecode(bits, n, k),
  }
}

export const repetitionProtocol = (n: number): Protocol => ({
  id: `rep-1/${n}`,
  label: `Repetition 1/${n}`,
  rate: 1 / n,
  encode: (bits) => genericRepetitionEncode(bits, n),
  decode: (bits) => genericRepetitionDecode(bits, n),
})

export const hamming74Protocol = genericHammingProtocol(7, 4)
export const hamming1511Protocol = genericHammingProtocol(15, 11)

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
