/**
 * Mocks pour Next.js Router
 * Simule la navigation et les paramètres d'URL
 */

import { vi } from 'vitest'

// Mock de useRouter
export const mockPush = vi.fn()
export const mockReplace = vi.fn()
export const mockBack = vi.fn()
export const mockRefresh = vi.fn()

export const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  refresh: mockRefresh,
  pathname: '/dashboard',
  route: '/dashboard',
  query: {},
  asPath: '/dashboard',
  basePath: '',
  isLocaleDomain: true,
  isReady: true,
  isPreview: false,
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}

export const mockUseRouter = vi.fn(() => mockRouter)

// Mock de useSearchParams
export const mockSearchParams = new URLSearchParams()
export const mockUseSearchParams = vi.fn(() => mockSearchParams)

// Mock de usePathname
export const mockUsePathname = vi.fn(() => '/dashboard')

// Helpers pour tester différents chemins
export const setMockPathname = (pathname: string) => {
  mockUsePathname.mockReturnValue(pathname)
  mockRouter.pathname = pathname
  mockRouter.asPath = pathname
}

// Helper pour tester les paramètres de recherche
export const setMockSearchParams = (params: Record<string, string>) => {
  const searchParams = new URLSearchParams(params)
  mockUseSearchParams.mockReturnValue(searchParams)
}

// Mock des modules Next.js
vi.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
  useSearchParams: mockUseSearchParams,
  usePathname: mockUsePathname,
}))

vi.mock('next/router', () => ({
  useRouter: mockUseRouter,
}))
