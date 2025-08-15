/**
 * Endpoint de debug pour les catégories
 */

import { NextRequest } from 'next/server'

// Catégories hardcodées pour le debug
const mockCategories = [
  {
    _id: "689e3f4a0b44c16071e05f1d",
    name: "Général",
    color: "#6B7280"
  },
  {
    _id: "689e3f4b0b44c16071e05f20",
    name: "Coworking", 
    color: "#3B82F6"
  },
  {
    _id: "689e3f4b0b44c16071e05f23",
    name: "Conseils",
    color: "#10B981"
  },
  {
    _id: "689e3f4b0b44c16071e05f26",
    name: "Événements",
    color: "#F59E0B"
  },
  {
    _id: "689e3f4b0b44c16071e05f29",
    name: "Tutoriels",
    color: "#8B5CF6"
  }
]

export async function GET(request: NextRequest) {
  return Response.json({
    success: true,
    data: mockCategories,
    message: "Catégories de debug récupérées",
    timestamp: new Date().toISOString()
  })
}