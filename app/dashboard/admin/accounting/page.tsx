'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AccountingPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Comptabilité</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/admin/accounting/cash-control">
          <Button 
            variant="outline" 
            className="h-32 w-full flex flex-col gap-2 hover:bg-slate-50"
          >
            <span className="text-lg font-semibold">Contrôle de Caisse</span>
            <span className="text-sm text-gray-600">Gestion des encaissements quotidiens</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
