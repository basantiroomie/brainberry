import { prisma } from '@/lib/prisma'
import MoldPlayer from './player'

interface Props { params: { id: string } }

export default async function MoldPlayPage({ params }: Props) {
  const clientAny = prisma as any
  const delegate = clientAny.gameMold
  const mold = delegate ? await delegate.findUnique({
    where: { id: params.id },
    include: { scenes: { include: { assets: true }, orderBy: { index: 'asc' } } }
  }) : null
  if (!delegate) {
    return <div className="p-10 text-center font-bold text-red-600">GameMold delegate unavailable.</div>
  }
  if (!mold) {
    return <div className="p-10 text-center font-bold text-red-600">Mold not found.</div>
  }
  return <MoldPlayer mold={mold} />
}
