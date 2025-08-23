"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface MockChild { id: string; name: string; age: number; diagnosis: string }
interface MockMold { id: string; name: string; version: number; structureType: string; primaryObjective: string; meta: { difficulty: string; ageRange: { min:number; max:number } } }
interface MockAssignment { id: string; childId: string; moldId: string; status: string; progress: number; createdAt: string }
interface MockSession { id: string; childId: string; moldId: string; assignmentId?: string; durationSec: number; completionPercent: number; mode: string; notes?: string; skillMetrics: Record<string, number>; startedAt: string; endedAt: string }
interface MockDataset {
  children: MockChild[]
  molds: MockMold[]
  assignments: MockAssignment[]
  sessions: MockSession[]
  generatedAt: number
}

interface MockContextValue {
  useMock: boolean
  setUseMock: (v: boolean) => void
  dataset: MockDataset | null
  regenerate: () => void
  addChild: (name: string, age: number, diagnosis: string) => void
  addAssignment: (childId: string, moldId: string) => void
  updateAssignmentProgress: (assignmentId: string, progress: number) => void
}

const MockDataContext = createContext<MockContextValue | null>(null)

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [useMock, setUseMock] = useState(false)
  const [dataset, setDataset] = useState<MockDataset | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bb_useMockGlobal')
      if (stored) setUseMock(stored === '1')
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('bb_useMockGlobal', useMock ? '1' : '0') } catch {}
  }, [useMock])

  function generateDataset(): MockDataset {
    const childNames = ['Aarav','Diya','Vivaan','Anaya','Ishaan','Kavya']
    const children: MockChild[] = childNames.map((n,i)=>({ id: 'mock-child-'+i, name:n, age: 7 + (i%4), diagnosis: i%2? 'ADHD':'ASD' }))
    const molds: MockMold[] = [
      { id:'mock-m1', name:'Focus Forest', version:1, structureType:'sequence', primaryObjective:'Improve sustained attention', meta:{ difficulty:'Medium', ageRange:{ min:6,max:12 } } },
      { id:'mock-m2', name:'Memory Palace', version:1, structureType:'grid', primaryObjective:'Enhance working memory', meta:{ difficulty:'Easy', ageRange:{ min:6,max:10 } } },
      { id:'mock-m3', name:'Emotion Detective', version:1, structureType:'branching', primaryObjective:'Identify and regulate emotions', meta:{ difficulty:'Medium', ageRange:{ min:7,max:14 } } },
    ]
    const assignments: MockAssignment[] = []
    const sessions: MockSession[] = []
    const skillPool = ['Working Memory','Impulse Control','Emotional Recognition','Sequencing','Attention Span','Planning','Task Switching','Visual Tracking']
    const now = Date.now()
    children.forEach((c,ci) => {
      const assignedMolds = molds.slice(0, 2 + (ci%2))
      assignedMolds.forEach((m,mi) => {
        const a: MockAssignment = { id:`mock-assign-${c.id}-${m.id}` , childId:c.id, moldId:m.id, status:'in-progress', progress: 20 + Math.floor(Math.random()*70), createdAt: new Date(now - (5+mi)*86400000).toISOString() }
        if (a.progress>=100) a.status='completed'; else if (a.progress>0) a.status='in-progress'
        assignments.push(a)
        // sessions for this assignment
        const sessionCount = 3 + Math.floor(Math.random()*4)
        for (let s=0; s<sessionCount; s++) {
          const startOffsetDays = Math.floor(Math.random()*30)
            const startedAt = new Date(now - startOffsetDays*86400000 - Math.floor(Math.random()*3600000)).toISOString()
          const durationSec = 180 + Math.floor(Math.random()*600)
          const completionPercent = Math.min(100, Math.max(10, Math.round((a.progress/sessionCount) + Math.random()*50)))
          const skillMetrics: Record<string, number> = {}
          skillPool.sort(()=>0.5-Math.random()).slice(0,5).forEach(sk => { skillMetrics[sk] = 40 + Math.floor(Math.random()*55) })
          sessions.push({ id:`sess-${c.id}-${m.id}-${s}`, childId:c.id, moldId:m.id, assignmentId:a.id, durationSec, completionPercent, mode:'assigned', notes: undefined, skillMetrics, startedAt, endedAt: new Date(new Date(startedAt).getTime()+durationSec*1000).toISOString() })
        }
      })
    })
    return { children, molds, assignments, sessions, generatedAt: Date.now() }
  }

  function ensureDataset() {
    if (useMock && !dataset) setDataset(generateDataset())
  }

  useEffect(() => { ensureDataset() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [useMock])

  function regenerate() { if (useMock) setDataset(generateDataset()) }
  function addChild(name: string, age: number, diagnosis: string) {
    setDataset(ds => {
      if (!ds) return ds
      const child: MockChild = { id:'mock-child-'+ds.children.length, name, age, diagnosis }
      return { ...ds, children: [...ds.children, child] }
    })
  }
  function addAssignment(childId: string, moldId: string) {
    setDataset(ds => {
      if (!ds) return ds
      const assignment: MockAssignment = { id:`mock-assign-${childId}-${moldId}-${Date.now()}`, childId, moldId, status:'assigned', progress:0, createdAt: new Date().toISOString() }
      return { ...ds, assignments: [...ds.assignments, assignment] }
    })
  }
  function updateAssignmentProgress(assignmentId: string, progress: number) {
    setDataset(ds => {
      if (!ds) return ds
      return { ...ds, assignments: ds.assignments.map(a => a.id===assignmentId ? { ...a, progress, status: progress>=100?'completed': (progress>0?'in-progress':'assigned') } : a) }
    })
  }

  return (
    <MockDataContext.Provider value={{ useMock, setUseMock, dataset, regenerate, addChild, addAssignment, updateAssignmentProgress }}>
      {children}
    </MockDataContext.Provider>
  )
}

export function useMockData() {
  const ctx = useContext(MockDataContext)
  if (!ctx) throw new Error('useMockData must be used within MockDataProvider')
  return ctx
}
