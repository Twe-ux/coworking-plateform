"use client"

import React, { useState } from 'react'
import { 
  MoreHorizontalIcon, 
  EditIcon, 
  TrashIcon, 
  UserCheckIcon,
  UserXIcon,
  ShieldIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon
} from 'lucide-react'
import { User, UserTableProps, DataTableColumn } from '@/types/admin'
import { DataTable, Badge, Button } from '@coworking/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@coworking/ui'
import { formatDate, getStatusColor, getRoleColor } from '@/lib/utils'

const UserActions: React.FC<{ 
  user: User, 
  onEdit: (user: User) => void,
  onDelete: (userId: string) => void,
  onToggleStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') => void
}> = ({ user, onEdit, onDelete, onToggleStatus }) => {
  const handleStatusToggle = () => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    onToggleStatus(user._id, newStatus)
  }

  const handleSuspend = () => {
    onToggleStatus(user._id, 'suspended')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <EditIcon className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStatusToggle}>
          {user.status === 'active' ? (
            <>
              <UserXIcon className="mr-2 h-4 w-4" />
              Désactiver
            </>
          ) : (
            <>
              <UserCheckIcon className="mr-2 h-4 w-4" />
              Activer
            </>
          )}
        </DropdownMenuItem>
        {user.status !== 'suspended' && (
          <DropdownMenuItem onClick={handleSuspend}>
            <ShieldIcon className="mr-2 h-4 w-4" />
            Suspendre
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(user._id)}
          className="text-red-600 focus:text-red-600"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const UsersTable: React.FC<UserTableProps> = ({
  users,
  totalCount,
  currentPage,
  pageSize,
  filters,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
  onSort,
  onUserEdit,
  onUserDelete,
  onUserToggleStatus,
  loading = false
}) => {
  const columns: DataTableColumn<User>[] = [
    {
      key: '_id',
      label: 'ID',
      width: '80px',
      render: (value) => (
        <span className="font-mono text-xs text-muted-foreground">
          {value.slice(-6)}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      render: (value, user) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <MailIcon className="w-3 h-3" />
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Rôle',
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className={getRoleColor(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className={getStatusColor(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'department',
      label: 'Département',
      render: (value) => value || <span className="text-muted-foreground">—</span>
    },
    {
      key: 'phone',
      label: 'Téléphone',
      render: (value) => value ? (
        <div className="flex items-center gap-1 text-sm">
          <PhoneIcon className="w-3 h-3" />
          {value}
        </div>
      ) : <span className="text-muted-foreground">—</span>
    },
    {
      key: 'lastLoginAt',
      label: 'Dernière connexion',
      sortable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-1 text-sm">
          <CalendarIcon className="w-3 h-3" />
          {formatDate(value)}
        </div>
      ) : <span className="text-muted-foreground">Jamais</span>
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      sortable: true,
      render: (value) => (
        <div className="text-sm">{formatDate(value)}</div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '60px',
      render: (_, user) => (
        <UserActions
          user={user}
          onEdit={onUserEdit}
          onDelete={onUserDelete}
          onToggleStatus={onUserToggleStatus}
        />
      )
    }
  ]

  return (
    <DataTable
      data={users}
      columns={columns}
      totalCount={totalCount}
      currentPage={currentPage}
      pageSize={pageSize}
      loading={loading}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onSort={onSort}
      emptyMessage="Aucun utilisateur trouvé"
      className="border rounded-lg"
    />
  )
}