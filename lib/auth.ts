import jwt from 'jsonwebtoken'

export interface UserPayload {
  userId: string
  email: string
  role: string
}

export interface ChildPayload {
  childId: string
  userId: string
  type: 'child'
}

export function verifyToken(token: string): UserPayload | ChildPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as UserPayload | ChildPayload
  } catch {
    return null
  }
}

export function isChildPayload(payload: UserPayload | ChildPayload): payload is ChildPayload {
  return 'type' in payload && payload.type === 'child'
}

export function generateChildCode(): string {
  // Generate a 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function ensureUniqueCode(generateCodeFn: () => string, checkExists: (code: string) => Promise<boolean>): Promise<string> {
  let code = generateCodeFn()
  let attempts = 0
  while (await checkExists(code) && attempts < 10) {
    code = generateCodeFn()
    attempts++
  }
  if (attempts >= 10) {
    throw new Error('Unable to generate unique code')
  }
  return code
}

export function getAuthHeader(req: Request): string | null {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}
