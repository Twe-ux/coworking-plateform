"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  DownloadIcon, 
  RefreshCwIcon,
  MoreVerticalIcon,
  TrashIcon,
  UserCheckIcon,
  UserXIcon,
  ShieldIcon,
  UsersIcon
} from 'lucide-react'
import { 
  User, 
  UserFilters, 
  UserStats, 
  PaginationData,
  SortConfig 
} from '@/types/admin'
import { 
  Button, 
  Card, 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge
} from '@coworking/ui'
import { UsersTable } from '@/components/users/users-table'
import { UsersFilters } from '@/components/users/users-filters'
import { UsersStats } from '@/components/users/users-stats'
import { downloadFile } from '@/lib/utils'

const UsersPage = () => {
  const router = useRouter()
  
  // États
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filters, setFilters] = useState<UserFilters>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc'
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  // Charger les utilisateurs
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction
      })

      // Ajouter les filtres
      if (filters.search) searchParams.set('search', filters.search)
      if (filters.role) searchParams.set('role', filters.role)
      if (filters.status) searchParams.set('status', filters.status)
      if (filters.department) searchParams.set('department', filters.department)

      const response = await fetch(`/api/admin/users?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs')
      }

      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data.users)
        setStats(data.data.stats)
        setPagination(data.pagination)
      } else {
        console.error('Erreur API:', data.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, filters, sortConfig])

  // Charger les données au montage et lors des changements
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Gestionnaires d'événements
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFiltersReset = () => {
    setFilters({})
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleUserEdit = (user: User) => {
    router.push(`/users/${user._id}`)
  }

  const handleUserDelete = (userId: string) => {
    setUserToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/admin/users/${userToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchUsers()
        setDeleteDialogOpen(false)
        setUserToDelete(null)
      } else {
        console.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const handleUserToggleStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        console.error('Erreur lors de la mise à jour du statut')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return

    try {
      const response = await fetch('/api/admin/users/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      })

      if (response.ok) {
        await fetchUsers()
        setSelectedUsers([])
      } else {
        console.error('Erreur lors de l\'action en lot')
      }
    } catch (error) {
      console.error('Erreur lors de l\'action en lot:', error)
    }
  }

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const searchParams = new URLSearchParams({
        action: 'export',
        format
      })

      const response = await fetch(`/api/admin/users/bulk-actions?${searchParams}`)
      
      if (format === 'csv') {
        const csvContent = await response.text()
        downloadFile(csvContent, `users-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      } else {
        const data = await response.json()
        downloadFile(JSON.stringify(data, null, 2), `users-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    }
  }

  const handleCreateUser = () => {
    router.push('/users/new')
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez tous les utilisateurs de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchUsers()}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleCreateUser}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && <UsersStats stats={stats} loading={loading} />}

      {/* Filtres */}
      <Card className="p-6">
        <UsersFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleFiltersReset}
        />
      </Card>

      {/* Actions en lot */}
      {selectedUsers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {selectedUsers.length} utilisateur(s) sélectionné(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('activate')}
              >
                <UserCheckIcon className="h-4 w-4 mr-1" />
                Activer
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
              >
                <UserXIcon className="h-4 w-4 mr-1" />
                Désactiver
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('suspend')}
              >
                <ShieldIcon className="h-4 w-4 mr-1" />
                Suspendre
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table des utilisateurs */}
      <Card>
        <UsersTable
          users={users}
          totalCount={pagination.total}
          currentPage={pagination.page}
          pageSize={pagination.limit}
          filters={filters}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onFiltersChange={handleFiltersChange}
          onSort={handleSort}
          onUserEdit={handleUserEdit}
          onUserDelete={handleUserDelete}
          onUserToggleStatus={handleUserToggleStatus}
          loading={loading}
        />
      </Card>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UsersPage