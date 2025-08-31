'use client'
import { DataTable } from '@/components/dashboard/accounting/cash-control/data-table'
import { useCashEntryData } from '@/hooks/use-cash-entry-data'
import { useChartData } from '@/hooks/use-chart-data'
import { useCallback, useEffect, useMemo, useState } from 'react'

type CashEntry = {
  _id: string
  date: string
  depenses?: { label: string; value: number }[]
  prestaB2B: { label: string; value: number }[]
  especes?: number | string
  virement?: number | string
  cbClassique?: number | string
  cbSansContact?: number | string
  [key: string]: unknown
}

type TurnoverItem = {
  date: string
  TVA?: number
  [key: string]: unknown
}

import { columns } from '@/components/dashboard/accounting/cash-control/columns'
import { Button } from '@/components/ui/button'

const monthsList = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

function formatDateYYYYMMDD(dateStr: string) {
  // Si la date est déjà au bon format YYYY/MM/DD ou YYYY-MM-DD, la convertir en YYYY/MM/DD
  if (dateStr.match(/^\d{4}[/-]\d{2}[/-]\d{2}$/)) {
    return dateStr.replace(/-/g, '/')
  }

  // Sinon, parser et formater
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

export default function CashControl() {
  const { data: turnoverData } = useChartData()
  const { dataCash, refetch: refetchCashEntries, invalidate: invalidateCashEntries } = useCashEntryData()

  const data = turnoverData || []

  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear)
  const currentMonth = new Date().getMonth()
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    currentMonth
  )

  type FormState = {
    _id: string
    date: string
    prestaB2B: { label: string; value: string }[]
    depenses: { label: string; value: string }[]
    virement: string
    especes: string
    cbClassique: string
    cbSansContact: string
  }

  const [form, setForm] = useState<FormState>({
    _id: '',
    date: '',
    prestaB2B: [{ label: '', value: '' }],
    depenses: [{ label: '', value: '' }],
    virement: '',
    especes: '',
    cbClassique: '',
    cbSansContact: '',
  })
  const [formStatus, setFormStatus] = useState<string | null>(null)
  const [editingRow, setEditingRow] = useState<CashEntryRow | null>(null)

  const years = useMemo(() => {
    if (!data) return []
    const allYears = data.map((item: TurnoverItem) =>
      new Date(item.date).getFullYear()
    )
    return Array.from(new Set(allYears)).sort((a: number, b: number) => b - a)
  }, [data])

  const filteredData = useMemo(() => {
    if (!data) return []
    return data.filter((item: TurnoverItem) => {
      const d = new Date(item.date)
      const yearMatch = selectedYear ? d.getFullYear() === selectedYear : true
      const monthMatch =
        selectedMonth !== null ? d.getMonth() === selectedMonth : true
      return yearMatch && monthMatch
    })
  }, [data, selectedYear, selectedMonth])

  const mergedData = useMemo(() => {
    if (!filteredData || !dataCash) return []
    
    // Créer un Map pour stocker toutes les dates uniques
    const allDatesMap = new Map()
    
    // Ajouter toutes les dates de turnover
    filteredData.forEach((turnoverItem: TurnoverItem) => {
      allDatesMap.set(turnoverItem.date, {
        ...turnoverItem,
        TVA: turnoverItem.TVA ?? 0,
        source: 'turnover'
      })
    })
    
    // Ajouter toutes les dates de cashEntry qui correspondent aux filtres
    dataCash.forEach((cashEntry: unknown) => {
      const entry = cashEntry as CashEntry
      const entryDate = entry.date || entry._id
      
      // Debug spécifique pour le 30-08-2025
      if (entryDate && (entryDate.includes('2025/08/30') || entryDate.includes('2025-08-30'))) {
        console.log('🔍 CashEntry 30-08-2025 trouvé:', entry)
      }
      
      // Vérifier si cette date correspond aux filtres actuels
      if (entryDate) {
        const d = new Date(entryDate.replace(/\//g, '-'))
        const yearMatch = selectedYear ? d.getFullYear() === selectedYear : true
        const monthMatch = selectedMonth !== null ? d.getMonth() === selectedMonth : true
        
        if (yearMatch && monthMatch) {
          // Si déjà présent, merger les données, sinon créer une nouvelle entrée
          const existing = allDatesMap.get(entryDate)
          if (existing) {
            allDatesMap.set(entryDate, { ...existing, ...entry })
          } else {
            allDatesMap.set(entryDate, {
              date: entryDate,
              TTC: 0,
              HT: 0,
              TVA: 0,
              ...entry,
              source: 'cashEntry'
            })
          }
          
          // Debug pour le 30-08-2025
          if (entryDate.includes('2025/08/30') || entryDate.includes('2025-08-30')) {
            console.log('✅ 30-08-2025 ajouté au allDatesMap:', allDatesMap.get(entryDate))
          }
        }
      }
    })
    
    // Convertir le Map en tableau et formater
    const result = Array.from(allDatesMap.values()).map((item: any) => ({
      ...item,
      _id: item._id || '',
      prestaB2B: item.prestaB2B || [],
      depenses: item.depenses || [],
      virement: item.virement || null,
      especes: item.especes || null,
      cbClassique: item.cbClassique || null,
      cbSansContact: item.cbSansContact || null,
    })).sort((a, b) => new Date(a.date.replace(/\//g, '-')).getTime() - new Date(b.date.replace(/\//g, '-')).getTime())
    
    // Debug pour vérifier la présence du 30-08-2025
    const august30 = result.find(item => item.date.includes('2025/08/30') || item.date.includes('2025-08-30'))
    if (august30) {
      console.log('✅ 30-08-2025 trouvé dans mergedData:', august30)
    } else {
      console.log('❌ 30-08-2025 manquant dans mergedData')
      console.log('🔍 Dates disponibles en août 2025:', result.filter(item => item.date.includes('2025/08') || item.date.includes('2025-08')).map(item => item.date))
    }
    
    return result
  }, [filteredData, dataCash, selectedYear, selectedMonth])

  type CashEntryRow = {
    _id?: string
    date?: string
    depenses?: { label: string; value: number }[]
    prestaB2B?: { label: string; value: number }[]
    virement?: number | string
    especes?: number | string
    cbClassique?: number | string
    cbSansContact?: number | string
    [key: string]: unknown
  }

  const handleDelete = useCallback(
    async (row: CashEntryRow) => {
      const id = row._id

      if (!id) {
        alert('Impossible de supprimer : identifiant manquant')
        return
      }
      try {
        console.log("Tentative de suppression de l'ID:", id)
        const encodedId = encodeURIComponent(id)
        const res = await fetch(`/api/cash-entry/${encodedId}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error('Erreur lors de la suppression')

        // Invalider le cache puis rafraîchir pour forcer la mise à jour
        invalidateCashEntries()
        await refetchCashEntries()
        setFormStatus('Suppression réussie')
      } catch {
        setFormStatus('Erreur lors de la suppression')
      }
    },
    [refetchCashEntries]
  )

  useEffect(() => {
    if (formStatus) {
      const timer = setTimeout(() => setFormStatus(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [formStatus])

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setFormStatus(null)
      let dateToSend = form.date
      if (dateToSend.includes('/')) {
        dateToSend = dateToSend.replace(/\//g, '-')
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateToSend)) {
        const d = new Date(dateToSend)
        if (!isNaN(d.getTime())) {
          dateToSend = d.toISOString().slice(0, 10)
        }
      }
      const dateKey = formatDateYYYYMMDD(dateToSend)
      type CashEntryBody = {
        date: string
        prestaB2B?: { label: string; value: number }[]
        depenses: { label: string; value: number }[]
        especes: number
        virement: number
        cbClassique: number
        cbSansContact: number
        _id?: string
        id?: string
      }

      const bodyData: CashEntryBody = {
        date: dateToSend,
        prestaB2B: form.prestaB2B
          .filter(
            (p: { label: string; value: string }) =>
              p.label && p.value !== '' && !isNaN(Number(p.value))
          )
          .map((p: { label: string; value: string }) => ({
            label: p.label,
            value: Number(p.value),
          })),
        depenses: form.depenses
          .filter(
            (d: { label: string; value: string }) =>
              d.label && d.value !== '' && !isNaN(Number(d.value))
          )
          .map((d: { label: string; value: string }) => ({
            label: d.label,
            value: Number(d.value),
          })),
        virement: form.virement !== '' ? Number(form.virement) : 0,
        especes: form.especes !== '' ? Number(form.especes) : 0,
        cbClassique: form.cbClassique !== '' ? Number(form.cbClassique) : 0,
        cbSansContact:
          form.cbSansContact !== '' ? Number(form.cbSansContact) : 0,
      }
      let url = '/api/cash-entry'
      let method: 'POST' | 'PUT' = 'POST'
      if (form._id) {
        url = '/api/cash-entry/update'
        method = 'PUT'
        bodyData.id = form._id
      } else {
        bodyData._id = dateKey
      }
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        })
        const result = await res.json()
        if (result.success) {
          setFormStatus(form._id ? 'Modification réussie !' : 'Ajout réussi !')

          // Invalider le cache puis rafraîchir pour forcer la mise à jour
          invalidateCashEntries()
          await refetchCashEntries()
          setEditingRow(null)
          window.dispatchEvent(new CustomEvent('cash-modal-close'))
          setForm({
            _id: '',
            date: '',
            prestaB2B: [{ label: '', value: '' }],
            depenses: [{ label: '', value: '' }],
            virement: '',
            especes: '',
            cbClassique: '',
            cbSansContact: '',
          })
        } else {
          setFormStatus(
            'Erreur : ' + (result.error || "Impossible d'enregistrer")
          )
        }
      } catch {
        setFormStatus('Erreur réseau')
      }
    },
    [form, refetchCashEntries]
  )

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const generatePDF = useCallback(async () => {
    if (typeof window === 'undefined') {
      setFormStatus('Génération PDF uniquement disponible côté client')
      return
    }

    if (!mergedData || mergedData.length === 0) {
      setFormStatus('Aucune donnée disponible pour générer le PDF')
      return
    }

    try {
      setIsGeneratingPDF(true)
      setFormStatus('Génération du PDF en cours...')

      console.log('Début de génération PDF avec', mergedData.length, 'entrées')
      const { generateCashControlPDF } = await import('@/lib/pdf-utils')

      await generateCashControlPDF({
        data: mergedData,
        selectedMonth,
        selectedYear,
      })

      setFormStatus('PDF généré avec succès !')
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)

      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue'
      setFormStatus(`Erreur PDF: ${errorMessage}`)

      // Afficher plus de détails dans la console pour debug
      console.error("Détails complets de l'erreur:", {
        error,
        mergedDataLength: mergedData?.length,
        selectedMonth,
        selectedYear,
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [mergedData, selectedMonth, selectedYear])

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="font-semibold">Année :</span>
          <select
            className="mr-4 rounded border px-3 py-1"
            value={selectedYear ?? ''}
            onChange={(e) =>
              setSelectedYear(e.target.value ? Number(e.target.value) : null)
            }
          >
            {years.map((year: number) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <span className="font-semibold">Mois :</span>
          <select
            className="rounded border px-3 py-1"
            value={selectedMonth ?? ''}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value !== '' ? Number(e.target.value) : null
              )
            }
          >
            {monthsList.map((month, idx) => (
              <option key={month} value={idx}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={generatePDF}
          disabled={isGeneratingPDF || mergedData.length === 0}
        >
          {isGeneratingPDF ? 'Génération en cours...' : 'Générer PDF'}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={mergedData}
        form={form}
        setForm={setForm}
        formStatus={formStatus}
        onSubmit={onSubmit}
        editingRow={editingRow}
        onDelete={handleDelete}
      />
    </div>
  )
}
