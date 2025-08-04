"use client"

import React from 'react'
import { SearchIcon, FilterIcon, XIcon } from 'lucide-react'
import { UserFilters, UserRole, UserStatus } from '@/types/admin'
import { 
  Button, 
  Input, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Badge
} from '@coworking/ui'

interface UsersFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onReset: () => void
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Personnel' },
  { value: 'client', label: 'Client' }
]

const statusOptions: { value: UserStatus; label: string }[] = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'pending', label: 'En attente' }
]

export const UsersFilters: React.FC<UsersFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset
}) => {
  const hasActiveFilters = !!(
    filters.search ||
    filters.role ||
    filters.status ||
    filters.department
  )

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined })
  }

  const handleRoleChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      role: value === 'all' ? undefined : value as UserRole 
    })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value === 'all' ? undefined : value as UserStatus 
    })
  }

  const handleDepartmentChange = (value: string) => {
    onFiltersChange({ ...filters, department: value || undefined })
  }

  const removeFilter = (filterKey: keyof UserFilters) => {
    const newFilters = { ...filters }
    delete newFilters[filterKey]
    onFiltersChange(newFilters)
  }

  return (
    <div className="space-y-4">
      {/* Ligne principale des filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          <Select value={filters.role || 'all'} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Département"
            value={filters.department || ''}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="w-[140px]"
          />

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="px-3"
            >
              <XIcon className="h-4 w-4" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtres actifs:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Recherche: "{filters.search}"
              <button
                onClick={() => removeFilter('search')}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.role && (
            <Badge variant="secondary" className="gap-1">
              Rôle: {roleOptions.find(r => r.value === filters.role)?.label}
              <button
                onClick={() => removeFilter('role')}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Statut: {statusOptions.find(s => s.value === filters.status)?.label}
              <button
                onClick={() => removeFilter('status')}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.department && (
            <Badge variant="secondary" className="gap-1">
              Département: {filters.department}
              <button
                onClick={() => removeFilter('department')}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}