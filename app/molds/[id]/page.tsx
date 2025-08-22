import { createSupabaseServerClient } from '@/lib/supabase-server'
import MoldPlayer from './player'

interface Props { params: { id: string } }

export default async function MoldPlayPage({ params }: Props) {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { data: mold, error } = await supabase
      .from('GameMold')
      .select(`
        *,
        scenes:Scene(
          *,
          assets:Asset(*)
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return <div className="p-10 text-center font-bold text-red-600">Mold not found.</div>
    }
    
    if (!mold) {
      return <div className="p-10 text-center font-bold text-red-600">Mold not found.</div>
    }
    
    // Sort scenes by index
    if (mold.scenes) {
      mold.scenes.sort((a: any, b: any) => (a.index || 0) - (b.index || 0))
    }
    
    return <MoldPlayer mold={mold} />
  } catch (error) {
    console.error('Error loading mold:', error)
    return <div className="p-10 text-center font-bold text-red-600">Error loading mold.</div>
  }
}
