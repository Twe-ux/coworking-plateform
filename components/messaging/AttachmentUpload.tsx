'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image, FileText, AlertCircle, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface AttachmentFile {
  file: File
  id: string
  preview?: string
  uploadProgress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

interface AttachmentUploadProps {
  onFilesSelected: (files: AttachmentFile[]) => void
  onFileRemove: (fileId: string) => void
  acceptedTypes?: string[]
  maxFileSize?: number // en bytes
  maxFiles?: number
  className?: string
  disabled?: boolean
}

export function AttachmentUpload({
  onFilesSelected,
  onFileRemove,
  acceptedTypes = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx'],
  maxFileSize = 50 * 1024 * 1024, // 50MB par défaut
  maxFiles = 10,
  className,
  disabled = false
}: AttachmentUploadProps) {
  const [files, setFiles] = useState<AttachmentFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateId = () => Math.random().toString(36).substring(2, 15)

  const validateFile = (file: File): string | null => {
    // Vérifier la taille
    if (file.size > maxFileSize) {
      return `Le fichier est trop volumineux (max ${(maxFileSize / 1024 / 1024).toFixed(1)}MB)`
    }

    // Vérifier le type (basique)
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return type === fileExtension
      }
      if (type.includes('/')) {
        const [mainType] = type.split('/')
        return file.type.startsWith(mainType)
      }
      return false
    })

    if (!isAccepted) {
      return `Type de fichier non autorisé (${file.type})`
    }

    return null
  }

  const createFilePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
    }
    return undefined
  }

  const processFiles = async (fileList: FileList) => {
    if (disabled || files.length >= maxFiles) return

    const remainingSlots = maxFiles - files.length
    const filesToProcess = Array.from(fileList).slice(0, remainingSlots)

    const newFiles: AttachmentFile[] = []

    for (const file of filesToProcess) {
      const error = validateFile(file)
      const preview = await createFilePreview(file)

      const attachmentFile: AttachmentFile = {
        file,
        id: generateId(),
        preview,
        uploadProgress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined
      }

      newFiles.push(attachmentFile)
    }

    setFiles(prev => [...prev, ...newFiles])
    onFilesSelected(newFiles.filter(f => f.status !== 'error'))
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
    onFileRemove(fileId)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }, [disabled])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      processFiles(selectedFiles)
    }
    // Reset input pour permettre de sélectionner le même fichier
    e.target.value = ''
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zone de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-all',
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Upload className="h-6 w-6 text-gray-600" />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ou{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={disabled}
              >
                parcourez
              </button>{' '}
              pour sélectionner
            </p>
          </div>

          <div className="text-xs text-gray-400">
            <p>Max {maxFiles} fichiers • {(maxFileSize / 1024 / 1024).toFixed(1)}MB par fichier</p>
            <p>Formats acceptés: images, PDF, documents Office</p>
          </div>
        </div>
      </div>

      {/* Limitation atteinte */}
      {files.length >= maxFiles && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Limite de {maxFiles} fichiers atteinte. Supprimez des fichiers pour en ajouter d'autres.
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des fichiers */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  'flex items-center gap-3 p-3 border rounded-lg bg-white',
                  file.status === 'error' && 'border-red-200 bg-red-50'
                )}
              >
                {/* Aperçu ou icône */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <div className="w-10 h-10 rounded overflow-hidden">
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      {getFileIcon(file.file)}
                    </div>
                  )}
                </div>

                {/* Informations du fichier */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.file.size)}
                  </p>

                  {/* Barre de progression */}
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={file.uploadProgress} className="h-1" />
                    </div>
                  )}

                  {/* Message d'erreur */}
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>

                {/* Statut */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {file.status === 'completed' && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}