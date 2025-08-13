"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  Edit, 
  MoreVertical,
  Users,
  Clock,
  Calendar,
  Phone,
  Mail,
  UserPlus,
  Trash2
} from 'lucide-react';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import CreateEmployeeModal from './CreateEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import DeleteEmployeeDialog from './DeleteEmployeeDialog';

export interface EmployeeListProps {
  onEmployeeSelect?: (employee: Employee) => void;
  onEmployeeEdit?: (employee: Employee) => void;
  className?: string;
}

export default function EmployeeList({ 
  onEmployeeSelect, 
  onEmployeeEdit, 
  className 
}: EmployeeListProps) {
  const { employees, isLoading, error, createEmployee, updateEmployee, deleteEmployee, statistics } = useEmployees({ active: true })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtrage des employés
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesRole = selectedRole === 'all' || employee.role === selectedRole

    return matchesSearch && matchesRole
  })

  const handleCreateEmployee = async (newEmployee: Employee) => {
    // Le hook se charge déjà de mettre à jour la liste
    console.log('Nouvel employé créé:', newEmployee)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowEditModal(true)
  }

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    // Le hook se charge déjà de mettre à jour la liste
    console.log('Employé modifié:', updatedEmployee)
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async (employeeId: string) => {
    setIsDeleting(true)
    try {
      const result = await deleteEmployee(employeeId)
      if (result.success) {
        console.log('Employé supprimé avec succès')
      } else {
        console.error('Erreur lors de la suppression:', result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setSelectedEmployee(null)
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Erreur de chargement</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const ROLES = ['all', 'Manager', 'Reception', 'Security', 'Maintenance', 'Cleaning', 'Staff']

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête et contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestion des employés
          </h2>
          <p className="text-gray-600">
            {filteredEmployees.length} employé{filteredEmployees.length > 1 ? 's' : ''} actif{filteredEmployees.length > 1 ? 's' : ''}
          </p>
        </div>

        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-coffee-primary hover:bg-coffee-primary/90"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter un employé
        </Button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-primary focus:border-transparent"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role === 'all' ? 'Tous les rôles' : role}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-gray-300">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-coffee-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-coffee-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-coffee-primary">{statistics.active}</div>
            <div className="text-sm text-gray-600">Employés actifs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statistics.byRole.Manager || 0}</div>
            <div className="text-sm text-gray-600">Managers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statistics.byRole.Reception || 0}</div>
            <div className="text-sm text-gray-600">Réception</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{statistics.byRole.Security || 0}</div>
            <div className="text-sm text-gray-600">Sécurité</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des employés */}
      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedRole !== 'all' ? 'Aucun employé trouvé' : 'Aucun employé'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedRole !== 'all' 
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par ajouter votre premier employé.'
              }
            </p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-coffee-primary hover:bg-coffee-primary/90"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter un employé
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredEmployees.map((employee) => (
            <Card 
              key={employee.id} 
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() => onEmployeeSelect?.(employee)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={`${employee.color} text-white text-lg font-semibold`}>
                        {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {employee.fullName}
                      </h3>
                      <Badge variant="secondary" className="mt-1">
                        {employee.role}
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        variant="destructive"
                        onClick={() => handleDeleteEmployee(employee)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {employee.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                  )}
                  
                  {employee.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Depuis le {new Date(employee.startDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {viewMode === 'grid' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Statut</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-green-700 font-medium">Actif</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création d'employé */}
      <CreateEmployeeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateEmployee}
      />

      {/* Modal de modification d'employé */}
      <EditEmployeeModal
        employee={selectedEmployee}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedEmployee(null)
        }}
        onSuccess={handleUpdateEmployee}
      />

      {/* Dialog de confirmation de suppression */}
      <DeleteEmployeeDialog
        employee={selectedEmployee}
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedEmployee(null)
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}