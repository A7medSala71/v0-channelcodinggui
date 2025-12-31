"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Activity, Zap, Cpu, Terminal, ShieldAlert } from "lucide-react"
import {
  type Protocol,
  uncodedProtocol,
  repetitionProtocol,
  hamming74Protocol,
  hamming1511Protocol,
  createGenericProtocol,
} from "@/lib/protocols"

const simulateBer = (snrDb: number, channelType: string, protocol: Protocol) => {
  const numBits = 1000
  const rate = protocol.rate

  const txBits = Array.from({ length: numBits }, () => (Math.random() > 0.5 ? 1 : 0))

  const coded = protocol.encode(txBits)

  const snrLinear = Math.pow(10, snrDb / 10.0)
  const sigma = Math.sqrt(1 / (2 * snrLinear * rate))

  const rxBits = coded.map((bit) => {
    let x = 2 * bit - 1
    const noise = sigma * (Math.random() + Math.random() + Math.random() + Math.random() - 2)
    if (channelType === "rayleigh") {
      const h = Math.sqrt((Math.pow(Math.random(), 2) + Math.pow(Math.random(), 2)) / 2)
      x = h * x
    }
    return x + noise > 0 ? 1 : 0
  })

  const decoded = protocol.decode(rxBits)

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
  const [protocolType, setProtocolType] = useState<"repetition" | "hamming" | "none" | "generic">("hamming")
  const [protocolParam, setProtocolParam] = useState<string>("74")
  const [genericType, setGenericType] = useState<"repetition" | "hamming">("hamming")
  const [genericN, setGenericN] = useState<string>("31")
  const [genericK, setGenericK] = useState<string>("26")
  const [chartData, setChartData] = useState<any[]>([])

  const currentProtocol = useMemo(() => {
    if (protocolType === "generic") {
      const n = Number.parseInt(genericN) || 3
      const k = genericType === "hamming" ? Number.parseInt(genericK) || Math.floor(n * 0.8) : undefined
      return createGenericProtocol(genericType, n, k)
    }
    if (protocolType === "none") return uncodedProtocol
    if (protocolType === "repetition") return repetitionProtocol(Number.parseInt(protocolParam) || 3)
    return protocolParam === "1511" ? hamming1511Protocol : hamming74Protocol
  }, [protocolType, protocolParam, genericType, genericN, genericK])

  const handleUpdatePlot = () => {
    const data = []
    for (let snr = snrRange.start; snr <= snrRange.end; snr += 1) {
      const berCoded = simulateBer(snr, channelType, currentProtocol)
      const berUncoded = simulateBer(snr, channelType, uncodedProtocol)
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
              <Label className="text-lime-400 font-bold uppercase tracking-widest">Protocol Type</Label>
              <RadioGroup
                value={protocolType}
                onValueChange={(val: any) => {
                  setProtocolType(val)
                  // Reset default params when switching types
                  if (val === "repetition") setProtocolParam("3")
                  if (val === "hamming") setProtocolParam("74")
                }}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-cyan-400">
                  <RadioGroupItem value="hamming" id="type-hamming" className="border-cyan-400 text-cyan-400" />
                  <Label
                    htmlFor="type-hamming"
                    className="text-zinc-300 cursor-pointer uppercase font-bold text-[10px]"
                  >
                    Hamming
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-cyan-400">
                  <RadioGroupItem value="repetition" id="type-repetition" className="border-cyan-400 text-cyan-400" />
                  <Label
                    htmlFor="type-repetition"
                    className="text-zinc-300 cursor-pointer uppercase font-bold text-[10px]"
                  >
                    Repetition
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-cyan-400">
                  <RadioGroupItem value="none" id="type-none" className="border-cyan-400 text-cyan-400" />
                  <Label htmlFor="type-none" className="text-zinc-300 cursor-pointer uppercase font-bold text-[10px]">
                    None
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-cyan-400">
                  <RadioGroupItem value="generic" id="type-generic" className="border-cyan-400 text-cyan-400" />
                  <Label
                    htmlFor="type-generic"
                    className="text-zinc-300 cursor-pointer uppercase font-bold text-[10px]"
                  >
                    Generic
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {protocolType !== "none" && protocolType !== "generic" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-lime-400 font-bold uppercase tracking-widest">
                  {protocolType === "repetition" ? "Repetition Factor" : "Code Configuration"}
                </Label>
                <RadioGroup value={protocolParam} onValueChange={setProtocolParam} className="grid grid-cols-2 gap-2">
                  {protocolType === "repetition" ? (
                    <>
                      {[3, 5].map((val) => (
                        <div
                          key={val}
                          className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-pink-500"
                        >
                          <RadioGroupItem
                            value={val.toString()}
                            id={`rep-${val}`}
                            className="border-pink-500 text-pink-500"
                          />
                          <Label
                            htmlFor={`rep-${val}`}
                            className="text-zinc-300 cursor-pointer uppercase font-bold text-xs"
                          >
                            1/{val} Factor
                          </Label>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-pink-500">
                        <RadioGroupItem value="74" id="ham-74" className="border-pink-500 text-pink-500" />
                        <Label htmlFor="ham-74" className="text-zinc-300 cursor-pointer uppercase font-bold text-xs">
                          (7,4) Standard
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-pink-500">
                        <RadioGroupItem value="1511" id="ham-1511" className="border-pink-500 text-pink-500" />
                        <Label htmlFor="ham-1511" className="text-zinc-300 cursor-pointer uppercase font-bold text-xs">
                          (15,11) Extended
                        </Label>
                      </div>
                    </>
                  )}
                </RadioGroup>
              </div>
            )}

            {protocolType === "generic" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 border-2 border-lime-500/30 p-4 rounded bg-lime-950/20">
                <Label className="text-lime-400 font-bold uppercase tracking-widest text-xs">
                  Generic Protocol Configuration
                </Label>

                <div className="space-y-2">
                  <Label className="text-zinc-400 text-[10px] uppercase">Encoding Type</Label>
                  <RadioGroup
                    value={genericType}
                    onValueChange={(val: any) => setGenericType(val)}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-lime-500">
                      <RadioGroupItem value="hamming" id="gen-hamming" className="border-lime-500 text-lime-500" />
                      <Label htmlFor="gen-hamming" className="text-zinc-300 cursor-pointer uppercase font-bold text-xs">
                        Hamming
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-black/50 p-2 border-2 border-zinc-700 rounded cursor-pointer hover:border-lime-500">
                      <RadioGroupItem
                        value="repetition"
                        id="gen-repetition"
                        className="border-lime-500 text-lime-500"
                      />
                      <Label
                        htmlFor="gen-repetition"
                        className="text-zinc-300 cursor-pointer uppercase font-bold text-xs"
                      >
                        Repetition
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-[10px] uppercase">
                      {genericType === "hamming" ? "Block Length (n)" : "Repetition Factor (n)"}
                    </Label>
                    <Input
                      type="number"
                      value={genericN}
                      onChange={(e) => setGenericN(e.target.value)}
                      placeholder="31"
                      min="3"
                      className="bg-black border-2 border-lime-500 text-lime-400 font-mono focus:ring-lime-400 h-10"
                    />
                  </div>

                  {genericType === "hamming" && (
                    <div className="space-y-2">
                      <Label className="text-zinc-400 text-[10px] uppercase">Data Bits (k)</Label>
                      <Input
                        type="number"
                        value={genericK}
                        onChange={(e) => setGenericK(e.target.value)}
                        placeholder="26"
                        min="1"
                        className="bg-black border-2 border-lime-500 text-lime-400 font-mono focus:ring-lime-400 h-10"
                      />
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-zinc-500 font-mono leading-relaxed border-t border-zinc-800 pt-2 mt-2">
                  {genericType === "hamming"
                    ? `Hamming (${genericN},${genericK}) | Rate: ${(Number.parseInt(genericK) / Number.parseInt(genericN) || 0).toFixed(3)}`
                    : `Repetition 1/${genericN} | Rate: ${(1 / Number.parseInt(genericN) || 0).toFixed(3)}`}
                </div>
              </div>
            )}

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
                    name={`${currentProtocol.label.toUpperCase()} CODED`}
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
