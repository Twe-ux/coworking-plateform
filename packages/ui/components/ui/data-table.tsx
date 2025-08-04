"use client"

import * as React from "react"
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronsLeftIcon, 
  ChevronsRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeOffIcon
} from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "./table"

export interface DataTableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string
  className?: string
  render?: (value: any, row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  totalCount?: number
  currentPage?: number
  pageSize?: number
  pageSizeOptions?: number[]
  loading?: boolean
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onRowClick?: (row: T) => void
  emptyMessage?: string
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  totalCount = data.length,
  currentPage = 1,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  loading = false,
  sortBy,
  sortDirection,
  onPageChange,
  onPageSizeChange,
  onSort,
  onRowClick,
  emptyMessage = "Aucune donnée disponible",
  className
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSort) return
    
    const columnKey = String(column.key)
    let newDirection: 'asc' | 'desc' = 'asc'
    
    if (sortBy === columnKey && sortDirection === 'asc') {
      newDirection = 'desc'
    }
    
    onSort(columnKey, newDirection)
  }

  const renderSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null
    
    const columnKey = String(column.key)
    if (sortBy !== columnKey) return null
    
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="w-4 h-4" />
    ) : (
      <ArrowDownIcon className="w-4 h-4" />
    )
  }

  const getCellValue = (row: T, column: DataTableColumn<T>) => {
    const value = row[column.key as keyof T]
    return column.render ? column.render(value, row) : value
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    column.className,
                    column.sortable && "cursor-pointer select-none hover:bg-muted/50",
                    "relative"
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {renderSortIcon(column)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <EyeOffIcon className="w-8 h-8" />
                    <p>{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={index}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className={column.className}
                      style={{ width: column.width }}
                    >
                      {getCellValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Affichage de {startIndex} à {endIndex} sur {totalCount} résultats
            </p>
          </div>
          
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Lignes par page</p>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange?.(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => onPageChange?.(1)}
                  disabled={currentPage <= 1}
                >
                  <span className="sr-only">Aller à la première page</span>
                  <ChevronsLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <span className="sr-only">Page précédente</span>
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <span className="sr-only">Page suivante</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => onPageChange?.(totalPages)}
                  disabled={currentPage >= totalPages}
                >
                  <span className="sr-only">Aller à la dernière page</span>
                  <ChevronsRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable