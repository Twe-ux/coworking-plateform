import { NextRequest } from 'next/server'
import { csrfTokenHandler } from '@/lib/csrf-middleware'

export async function GET(request: NextRequest) {
  return csrfTokenHandler(request)
}
