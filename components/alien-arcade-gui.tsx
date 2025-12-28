"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Activity, Zap, Cpu, Terminal, ShieldAlert } from "lucide-react"

// --- SIMULATION ENGINE (Ported from Python) ---

const repetitionEncode = (bits: number[], rateFactor: number) => {
  return bits.flatMap((bit) => Array(rateFactor).fill(bit))
}

const repetitionDecode = (bits: number[], rateFactor: number) => {
  const decoded: number[] = []
  for (let i = 0; i < bits.length; i += rateFactor) {
    const chunk = bits.slice(i, i + rateFactor)
    const sum = chunk.reduce((a, b) => a + b, 0)
    decoded.push(sum > rateFactor / 2 ? 1 : 0)
  }
  return decoded
}

// Simplified Hamming (7,4) logic for demo parity
const hamming74Encode = (bits: number[]) => {
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
}

const hamming74Decode = (bits: number[]) => {
  const decoded: number[] = []
  for (let i = 0; i < bits.length; i += 7) {
    const r = bits.slice(i, i + 7)
    if (r.length < 7) break
    const s1 = (r[0] + r[1] + r[2] + r[4]) % 2
    const s2 = (r[0] + r[1] + r[3] + r[5]) % 2
    const s3 = (r[0] + r[2] + r[3] + r[6]) % 2
    // Simplified correction (only extracting info bits for simulation)
    decoded.push(r[2], r[4], r[5], r[6])
  }
  return decoded
}

const hamming1511Encode = (bits: number[]) => {
  const encoded: number[] = []
  for (let i = 0; i < bits.length; i += 11) {
    const b = bits.slice(i, i + 11)
    if (b.length < 11) break
    // Standard Hamming(15,11) parity bit positions (1, 2, 4, 8)
    const p1 = (b[0] + b[1] + b[3] + b[4] + b[6] + b[8] + b[10]) % 2
    const p2 = (b[0] + b[2] + b[3] + b[5] + b[6] + b[9] + b[10]) % 2
    const p3 = (b[1] + b[2] + b[3] + b[7] + b[8] + b[9] + b[10]) % 2
    const p4 = (b[4] + b[5] + b[6] + b[7] + b[8] + b[9] + b[10]) % 2
    // Construct 15-bit codeword: P1, P2, D1, P3, D2, D3, D4, P4, D5, D6, D7, D8, D9, D10, D11
    encoded.push(p1, p2, b[0], p3, b[1], b[2], b[3], p4, b[4], b[5], b[6], b[7], b[8], b[9], b[10])
  }
  return encoded
}

const hamming1511Decode = (bits: number[]) => {
  const decoded: number[] = []
  for (let i = 0; i < bits.length; i += 15) {
    const r = bits.slice(i, i + 15)
    if (r.length < 15) break
    decoded.push(r[2], r[4], r[5], r[6], r[8], r[9], r[10], r[11], r[12], r[13], r[14])
  }
  return decoded
}

const simulateBer = (snrDb: number, channelType: string, codeType: string) => {
  const numBits = 1000
  let rate = 1.0

  if (codeType === "rep1/3") rate = 1 / 3
  else if (codeType === "rep1/5") rate = 1 / 5
  else if (codeType === "hamming74") rate = 4 / 7
  else if (codeType === "hamming1511") rate = 11 / 15
  else if (codeType === "none") rate = 1.0

  const txBits = Array.from({ length: numBits }, () => (Math.random() > 0.5 ? 1 : 0))

  let coded = txBits
  if (codeType === "rep1/3") coded = repetitionEncode(txBits, 3)
  else if (codeType === "rep1/5") coded = repetitionEncode(txBits, 5)
  else if (codeType === "hamming74") coded = hamming74Encode(txBits)
  else if (codeType === "hamming1511") coded = hamming1511Encode(txBits)

  const snrLinear = Math.pow(10, snrDb / 10.0)
  const sigma = Math.sqrt(1 / (2 * snrLinear * rate))

  const rxBits = coded.map((bit) => {
    let x = 2 * bit - 1
    const noise = sigma * (Math.random() + Math.random() + Math.random() + Math.random() - 2) // Simple Gaussian approx
    if (channelType === "rayleigh") {
      const h = Math.sqrt((Math.pow(Math.random(), 2) + Math.pow(Math.random(), 2)) / 2)
      x = h * x
    }
    return x + noise > 0 ? 1 : 0
  })

  let decoded = rxBits
  if (codeType === "rep1/3") decoded = repetitionDecode(rxBits, 3)
  else if (codeType === "rep1/5") decoded = repetitionDecode(rxBits, 5)
  else if (codeType === "hamming74") decoded = hamming74Decode(rxBits)
  else if (codeType === "hamming1511") decoded = hamming1511Decode(rxBits)

  let errors = 0
  const limit = Math.min(txBits.length, decoded.length)
  for (let i = 0; i < limit; i++) {
    if (txBits[i] !== decoded[i]) errors++
  }
  return errors / limit
}

export default function AlienArcadeGUI() {
  const [snrRange, setSnrRange] = useState({ start: 0, end: 12 })
  const [channelType, setChannelType] = useState("awgn")
  const [codeType, setCodeType] = useState("hamming74")
  const [chartData, setChartData] = useState<any[]>([])

  const handleUpdatePlot = () => {
    const data = []
    for (let snr = snrRange.start; snr <= snrRange.end; snr += 1) {
      const berCoded = simulateBer(snr, channelType, codeType)
      const berUncoded = simulateBer(snr, channelType, "none")
      data.push({
        snr,
        berCoded: berCoded || 1e-6,
        berUncoded: berUncoded || 1e-6,
      })
    }
    setChartData(data)
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b-4 border-lime-500 pb-4 mb-8">
        <h1 className="text-4xl md:text-6xl font-black text-lime-400 tracking-tighter uppercase italic flex items-center gap-4">
          <Terminal className="w-12 h-12 animate-pulse" />
          Signal Invader v2.1
        </h1>
        <div className="text-right hidden md:block">
          <p className="text-pink-500 font-mono text-xs uppercase tracking-widest">System Status: Active</p>
          <p className="text-cyan-400 font-mono text-lg font-bold uppercase tracking-tighter">Transmission Lock: ON</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <Card className="lg:col-span-4 bg-zinc-900 border-4 border-pink-600 shadow-[8px_8px_0px_0px_rgba(219,39,119,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
          <CardHeader className="border-b-4 border-pink-600 bg-pink-600/10">
            <CardTitle className="text-pink-500 flex items-center gap-2 uppercase font-black italic tracking-tight">
              <Cpu className="w-5 h-5" /> Mainframe Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="space-y-4">
              <Label className="text-lime-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" /> EB/N0 Range (dB)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  value={snrRange.start}
                  onChange={(e) => setSnrRange({ ...snrRange, start: Number.parseInt(e.target.value) || 0 })}
                  className="bg-black border-2 border-cyan-400 text-cyan-400 font-mono focus:ring-lime-400"
                />
                <Input
                  type="number"
                  value={snrRange.end}
                  onChange={(e) => setSnrRange({ ...snrRange, end: Number.parseInt(e.target.value) || 0 })}
                  className="bg-black border-2 border-cyan-400 text-cyan-400 font-mono focus:ring-lime-400"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lime-400 font-bold uppercase tracking-widest">Atmos Layer (Channel)</Label>
              <RadioGroup value={channelType} onValueChange={setChannelType} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-pink-500 transition-colors">
                  <RadioGroupItem value="awgn" id="awgn" className="border-pink-500 text-pink-500" />
                  <Label htmlFor="awgn" className="text-zinc-400 cursor-pointer uppercase font-bold text-xs">
                    AWGN (Stable)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-pink-500 transition-colors">
                  <RadioGroupItem value="rayleigh" id="rayleigh" className="border-pink-500 text-pink-500" />
                  <Label htmlFor="rayleigh" className="text-zinc-400 cursor-pointer uppercase font-bold text-xs">
                    Rayleigh (Fading)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-lime-400 font-bold uppercase tracking-widest">Protocol (Coding Scheme)</Label>
              <RadioGroup value={codeType} onValueChange={setCodeType} className="space-y-2">
                {[
                  { id: "none", label: "Uncoded (Raw)" },
                  { id: "rep1/3", label: "Repetition 1/3" },
                  { id: "rep1/5", label: "Repetition 1/5" },
                  { id: "hamming74", label: "Hamming (7,4)" },
                  { id: "hamming1511", label: "Hamming (15,11)" },
                ].map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center space-x-2 bg-black/50 p-3 border-2 border-zinc-700 rounded cursor-pointer hover:border-cyan-400 transition-colors"
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="border-cyan-400 text-cyan-400" />
                    <Label htmlFor={option.id} className="text-zinc-300 cursor-pointer uppercase font-bold text-xs">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button
              onClick={handleUpdatePlot}
              className="w-full bg-lime-500 hover:bg-lime-400 text-black font-black uppercase italic tracking-tighter h-16 text-xl shadow-[4px_4px_0px_0px_rgba(34,197,94,0.4)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              RUN DIAGNOSTICS
            </Button>
          </CardContent>
        </Card>

        {/* Display Column */}
        <Card className="lg:col-span-8 bg-zinc-950 border-4 border-cyan-500 shadow-[8px_8px_0px_0px_rgba(6,182,212,1)]">
          <CardHeader className="border-b-4 border-cyan-500 bg-cyan-500/10">
            <CardTitle className="text-cyan-400 flex items-center gap-2 uppercase font-black italic tracking-tight">
              <Activity className="w-5 h-5" /> Oscilloscope Display (BER vs SNR)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[500px] w-full bg-black border-2 border-zinc-800 p-4 rounded relative overflow-hidden group">
              {/* Scanline Effect Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-50 group-hover:opacity-100 transition-opacity" />
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="snr"
                    stroke="#a3e635"
                    fontSize={12}
                    tickFormatter={(val) => `${val}dB`}
                    label={{ value: "Eb/N0 (dB)", position: "insideBottomRight", offset: -10, fill: "#a3e635" }}
                  />
                  <YAxis
                    scale="log"
                    domain={[1e-5, 1]}
                    stroke="#a3e635"
                    fontSize={12}
                    label={{ value: "Bit Error Rate", angle: -90, position: "insideLeft", fill: "#a3e635" }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#000", border: "2px solid #06b6d4", color: "#06b6d4" }}
                    itemStyle={{ color: "#a3e635" }}
                    labelStyle={{ color: "#06b6d4", fontWeight: "bold" }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ color: "#ec4899", fontWeight: "bold" }} />
                  <Line
                    type="monotone"
                    dataKey="berUncoded"
                    name="UNCODED (RAW)"
                    stroke="#64748b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: "#64748b" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="berCoded"
                    name={`${codeType.toUpperCase()} CODED`}
                    stroke="#ec4899"
                    strokeWidth={4}
                    dot={{ r: 6, fill: "#ec4899", strokeWidth: 2, stroke: "#000" }}
                    activeDot={{ r: 8, fill: "#a3e635" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 border-2 border-zinc-800 bg-zinc-900 rounded flex items-start gap-4">
              <ShieldAlert className="w-8 h-8 text-pink-500 shrink-0" />
              <div>
                <h4 className="text-lime-400 font-bold uppercase text-sm">Operator Log</h4>
                <p className="text-zinc-400 text-xs font-mono leading-relaxed mt-1">
                  Simulation tracking active. Adjust EB/N0 parameters to visualize signal degradation through{" "}
                  {channelType.toUpperCase()} atmospheres. High interference detected in lower decibel ranges.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
