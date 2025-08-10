'use client'

import { Badge } from '@/components/dashboard/admin/advanced/ui/badge'
import { Button } from '@/components/dashboard/admin/advanced/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/dashboard/admin/advanced/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dashboard/admin/advanced/ui/dropdown-menu'
import { Input } from '@/components/dashboard/admin/advanced/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/admin/advanced/ui/table'
import { cn } from '@/lib/utils'
import {
  ArrowUpDown,
  Calendar,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'

interface BookingData {
  id: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  spaceName: string
  spaceLocation: string
  date: string
  startTime: string
  endTime: string
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
}

interface DataTableProps {
  data: BookingData[]
  columns?: any[]
}

type SortField = 'date' | 'user' | 'space' | 'price' | 'status' | 'created'
type SortDirection = 'asc' | 'desc'

export function DataTable({ data }: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('created')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((booking) => {
      const matchesSearch =
        searchQuery === '' ||
        booking.user.firstName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        booking.user.lastName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        booking.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.spaceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.spaceLocation.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || booking.status === statusFilter

      return matchesSearch && matchesStatus
    })

    // Sort data
    filtered.sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortField) {
        case 'date':
          aVal = new Date(`${a.date}T${a.startTime}`)
          bVal = new Date(`${b.date}T${b.startTime}`)
          break
        case 'user':
          aVal = `${a.user.firstName} ${a.user.lastName}`
          bVal = `${b.user.firstName} ${b.user.lastName}`
          break
        case 'space':
          aVal = a.spaceName
          bVal = b.spaceName
          break
        case 'price':
          aVal = a.totalPrice
          bVal = b.totalPrice
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'created':
          aVal = new Date(a.createdAt)
          bVal = new Date(b.createdAt)
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [data, searchQuery, sortField, sortDirection, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmée</Badge>
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
        )
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Annulée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string, timeString: string) => {
    const date = new Date(dateString)
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
    return `${formattedDate} ${timeString}`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="text-muted-foreground h-5 w-5" />
              <div>
                <CardTitle>Réservations Récentes</CardTitle>
                <CardDescription>
                  Gestion et suivi des dernières réservations
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Rechercher..."
                  className="w-64 pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Statut
                    {statusFilter !== 'all' && (
                      <Badge className="ml-2" variant="secondary">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    Tous les statuts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setStatusFilter('confirmed')}
                  >
                    Confirmées
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                    En attente
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter('cancelled')}
                  >
                    Annulées
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('user')}
                      className="h-auto p-0 hover:bg-transparent"
                    >
                      Client
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('space')}
                      className="h-auto p-0 hover:bg-transparent"
                    >
                      Espace
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('date')}
                      className="h-auto p-0 hover:bg-transparent"
                    >
                      Date & Heure
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('price')}
                      className="h-auto p-0 hover:bg-transparent"
                    >
                      Prix
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 hover:bg-transparent"
                    >
                      Statut
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Calendar className="text-muted-foreground h-8 w-8" />
                        <p className="text-muted-foreground">
                          {searchQuery || statusFilter !== 'all'
                            ? 'Aucune réservation trouvée avec ces critères'
                            : 'Aucune réservation récente'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedData.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {booking.user.firstName} {booking.user.lastName}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {booking.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">{booking.spaceName}</div>
                          <div className="text-muted-foreground text-sm">
                            {booking.spaceLocation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {formatDate(booking.date, booking.startTime)}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            jusqu&apos;à {booking.endTime}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatPrice(booking.totalPrice)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Ouvrir le menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                            {booking.status === 'pending' && (
                              <>
                                <DropdownMenuItem>Confirmer</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Annuler
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredAndSortedData.length > 0 && (
            <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
              <div>
                {filteredAndSortedData.length} réservation
                {filteredAndSortedData.length > 1 ? 's' : ''} affichée
                {filteredAndSortedData.length > 1 ? 's' : ''}
                {statusFilter !== 'all' && ` (filtrées par statut)`}
                {searchQuery && ` (recherche: "${searchQuery}")`}
              </div>
              <div className="flex items-center space-x-2">
                <span>
                  Triées par{' '}
                  {
                    {
                      date: 'Date',
                      user: 'Client',
                      space: 'Espace',
                      price: 'Prix',
                      status: 'Statut',
                      created: 'Création',
                    }[sortField]
                  }{' '}
                  ({sortDirection === 'asc' ? 'croissant' : 'décroissant'})
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
