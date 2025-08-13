'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role:
    | 'Manager'
    | 'Reception'
    | 'Security'
    | 'Maintenance'
    | 'Cleaning'
    | 'Staff'
  color: string
  startDate: string
  isActive: boolean
  fullName: string
  createdAt: string
  updatedAt: string
}

interface UseEmployeesOptions {
  role?: string
  active?: boolean
  search?: string
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Construire les paramètres de requête
      const params = new URLSearchParams()
      if (options.role) params.append('role', options.role)
      if (options.active !== undefined)
        params.append('active', String(options.active))
      if (options.search) params.append('search', options.search)

      const response = await fetch(`/api/employees?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setEmployees(result.data)
        setError(null)
      } else {
        setError(result.error || 'Erreur lors de la récupération des employés')
        setEmployees([])
      }
    } catch (err) {
      console.error('Erreur useEmployees:', err)
      setError('Erreur de connexion au serveur')
      setEmployees([])
    } finally {
      setIsLoading(false)
    }
  }, [options.role, options.active, options.search])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const createEmployee = useCallback(
    async (employeeData: {
      firstName: string
      lastName: string
      email?: string
      phone?: string
      role: string
      color?: string
      startDate?: string
    }) => {
      try {
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(employeeData),
        })

        const result = await response.json()

        if (result.success) {
          // Ajouter le nouvel employé à la liste locale
          setEmployees((prev) => [...prev, result.data])
          return { success: true, data: result.data }
        } else {
          return {
            success: false,
            error: result.error,
            details: result.details,
          }
        }
      } catch (error) {
        console.error('Erreur création employé:', error)
        return { success: false, error: 'Erreur de connexion au serveur' }
      }
    },
    []
  )

  const updateEmployee = useCallback(
    async (
      id: string,
      updateData: Partial<
        Omit<Employee, 'id' | 'fullName' | 'createdAt' | 'updatedAt'>
      >
    ) => {
      try {
        const response = await fetch(`/api/employees/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })

        const result = await response.json()

        if (result.success) {
          // Mettre à jour l'employé dans la liste locale
          setEmployees((prev) =>
            prev.map((emp) => (emp.id === id ? result.data : emp))
          )
          return { success: true, data: result.data }
        } else {
          return {
            success: false,
            error: result.error,
            details: result.details,
          }
        }
      } catch (error) {
        console.error('Erreur mise à jour employé:', error)
        return { success: false, error: 'Erreur de connexion au serveur' }
      }
    },
    []
  )

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Marquer l'employé comme inactif dans la liste locale
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === id ? { ...emp, isActive: false } : emp))
        )
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Erreur suppression employé:', error)
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }, [])

  const getEmployeeById = useCallback(
    (id: string) => {
      return employees.find((emp) => emp.id === id)
    },
    [employees]
  )

  const getEmployeesByRole = useCallback(
    (role: string) => {
      return employees.filter((emp) => emp.role === role && emp.isActive)
    },
    [employees]
  )

  const getActiveEmployees = useCallback(() => {
    return employees.filter((emp) => emp.isActive)
  }, [employees])

  // Statistiques
  const statistics = {
    total: employees.length,
    active: employees.filter((emp) => emp.isActive).length,
    inactive: employees.filter((emp) => !emp.isActive).length,
    byRole: employees.reduce(
      (acc, emp) => {
        if (emp.isActive) {
          acc[emp.role] = (acc[emp.role] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>
    ),
  }

  return {
    employees,
    isLoading,
    error,
    refreshEmployees: fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    getEmployeesByRole,
    getActiveEmployees,
    statistics,
  }
}
