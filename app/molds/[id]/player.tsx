"use client"
import { useEffect, useState } from 'react'
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, Flame } from 'lucide-react'

interface Asset { id: string; type: string; label: string; url: string }
interface Scene { id: string; index?: number; title: string; narrative?: string | null; instructions: string; pacingCalm: boolean; pacingFast: boolean; reinforcement?: string | null; assets: Asset[] }
interface Mold { id: string; name: string; primaryObjective: string; structureType: string; allowPacing: boolean; lockStructure: boolean; scenes: Scene[] }

export default function MoldPlayer({ mold }: { mold: Mold }) {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [startedAt] = useState(Date.now())
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'calm'|'fast'|'default'>('default')
  const scene = mold.scenes[sceneIndex]

  useEffect(() => {
    if (mode === 'default') {
      if (scene?.pacingCalm) setMode('calm')
      else if (scene?.pacingFast) setMode('fast')
    }
  }, [sceneIndex])

  const next = () => setSceneIndex(i => Math.min(i + 1, mold.scenes.length - 1))
  const prev = () => setSceneIndex(i => Math.max(i - 1, 0))

  async function finish() {
    setSaving(true)
    try {
      const durationSec = Math.round((Date.now() - startedAt)/1000)
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ childId: 'demo-child', moldId: mold.id, durationSec, completionPercent: 100, mode }) })
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3"><span>{mold.name}</span>{mode!=='default' && <span className="text-xs font-bold px-2 py-1 border-2 border-black bg-chart-2 text-white rounded">{mode.toUpperCase()} MODE</span>}</h1>
        <p className="text-gray-700 text-sm">Objective: {mold.primaryObjective}</p>
      </div>

      <div className="bg-white border-4 border-black shadow-brutal-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Scene {sceneIndex+1} / {mold.scenes.length}: {scene.title}</h2>
          <div className="text-xs font-bold space-x-2 flex items-center">
            {mold.allowPacing && (
              <select value={mode} onChange={e=>setMode(e.target.value as any)} className="border-2 border-black p-1 text-xs font-bold">
                <option value="default">AUTO</option>
                <option value="calm">CALM</option>
                <option value="fast">FAST</option>
              </select>
            )}
          </div>
        </div>
        {scene.narrative && <div className="p-3 bg-secondary border-2 border-black font-bold text-sm">{scene.narrative}</div>}
        <div className="p-4 border-2 border-black bg-chart-1 text-white font-bold shadow-brutal">{scene.instructions}</div>
        {scene.assets.length>0 && (
          <div>
            <h3 className="font-bold text-sm mb-2">Assets</h3>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold">
              {scene.assets.map(a => <li key={a.id} className="border-2 border-black bg-white p-2 truncate" title={a.url}>{a.type.toUpperCase()}: {a.label}</li>)}
            </ul>
          </div>
        )}
        {scene.reinforcement && <div className="text-sm font-bold flex items-center space-x-2 text-chart-2"><Flame className="h-4 w-4"/><span>{scene.reinforcement}</span></div>}
        <div className="flex justify-between pt-4 border-t border-dashed border-black">
            <button onClick={prev} disabled={sceneIndex===0} className="px-4 py-2 border-2 border-black bg-white shadow-brutal font-bold text-sm disabled:opacity-40 flex items-center space-x-2"><ArrowLeft className="h-4 w-4"/><span>BACK</span></button>
            {sceneIndex < mold.scenes.length-1 ? (
              <button onClick={next} className="px-6 py-2 border-2 border-black bg-chart-3 text-white shadow-brutal font-bold text-sm flex items-center space-x-2"> <span>NEXT</span><ArrowRight className="h-4 w-4"/></button>
            ) : (
              <button onClick={finish} disabled={saving} className="px-6 py-2 border-2 border-black bg-chart-2 text-white shadow-brutal font-bold text-sm flex items-center space-x-2 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>}<span>FINISH</span></button>
            )}
        </div>
      </div>
    </div>
  )
}
