import AlienArcadeGUI from "@/components/alien-arcade-gui"

export const metadata = {
  title: "Signal Invader | Diagnostics Terminal",
}

export const dynamic = "force-static"

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 md:p-8">
      <AlienArcadeGUI />
    </main>
  )
}
