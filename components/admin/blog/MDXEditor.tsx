'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { 
  Bold, 
  Code, 
  Eye, 
  FileText, 
  Heading, 
  Image, 
  Italic, 
  Link, 
  List, 
  ListOrdered,
  Quote,
  Strikethrough,
  Type
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface MDXEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  showToolbar?: boolean
  className?: string
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}

function ToolbarButton({ icon: Icon, label, onClick }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={label}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export function MDXEditor({
  value,
  onChange,
  placeholder = "Rédigez votre contenu en Markdown...",
  minHeight = "400px",
  showToolbar = true,
  className = "",
}: MDXEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [renderedContent, setRenderedContent] = useState('')

  const renderMDX = useCallback(async (content: string) => {
    // Enhanced markdown-to-HTML conversion for preview
    let html = content
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mb-3 mt-6">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-4 mt-8">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 mt-8">$1</h1>')
      
      // Text formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>')
      
      // Code
      .replace(/```([\\s\\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto mb-4"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm font-mono">$1</code>')
      
      // Lists
      .replace(/^\\* (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/^\\d+\\. (.+)$/gm, '<li class="ml-4">$1</li>')
      
      // Links
      .replace(/\\[([^\\]]+)\\]\\(([^\\)]+)\\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Images
      .replace(/!\\[([^\\]]*)\\]\\(([^\\)]+)\\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />')
      
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-4">$1</blockquote>')
      
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="border-t border-border my-8" />')
      
      // Line breaks and paragraphs
      .replace(/\\n\\n/g, '</p><p class="mb-4">')
      .replace(/\\n/g, '<br>')

    // Wrap in paragraphs if content exists
    if (html.trim()) {
      html = '<div class="prose prose-sm max-w-none"><p class="mb-4">' + html + '</p></div>'
    }
    
    setRenderedContent(html)
  }, [])

  useEffect(() => {
    if (isPreviewMode) {
      renderMDX(value)
    }
  }, [value, isPreviewMode, renderMDX])

  const insertText = (before: string, after: string = '', placeholder: string = 'texte') => {
    const textarea = document.querySelector('textarea[data-mdx-editor]') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const textToInsert = selectedText || placeholder
    
    const newText = 
      value.substring(0, start) + 
      before + textToInsert + after + 
      value.substring(end)
    
    onChange(newText)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + before.length + textToInsert.length + after.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const toolbarActions = [
    {
      group: 'text',
      items: [
        { icon: Bold, label: 'Gras (Ctrl+B)', onClick: () => insertText('**', '**', 'texte gras') },
        { icon: Italic, label: 'Italique (Ctrl+I)', onClick: () => insertText('*', '*', 'texte italique') },
        { icon: Strikethrough, label: 'Barré', onClick: () => insertText('~~', '~~', 'texte barré') },
        { icon: Code, label: 'Code inline', onClick: () => insertText('`', '`', 'code') },
      ]
    },
    {
      group: 'headings',
      items: [
        { icon: Heading, label: 'Titre 1', onClick: () => insertText('# ', '', 'Titre principal') },
        { icon: Type, label: 'Titre 2', onClick: () => insertText('## ', '', 'Sous-titre') },
      ]
    },
    {
      group: 'content',
      items: [
        { icon: Link, label: 'Lien', onClick: () => insertText('[', '](https://exemple.com)', 'texte du lien') },
        { icon: Image, label: 'Image', onClick: () => insertText('![', '](https://exemple.com/image.jpg)', 'texte alternatif') },
        { icon: Quote, label: 'Citation', onClick: () => insertText('> ', '', 'Citation') },
      ]
    },
    {
      group: 'lists',
      items: [
        { icon: List, label: 'Liste à puces', onClick: () => insertText('* ', '', 'Élément de liste') },
        { icon: ListOrdered, label: 'Liste numérotée', onClick: () => insertText('1. ', '', 'Premier élément') },
      ]
    },
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Contenu de l'article</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={!isPreviewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPreviewMode(false)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Éditeur
          </Button>
          <Button
            type="button"
            variant={isPreviewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPreviewMode(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Aperçu
          </Button>
        </div>
      </div>

      {isPreviewMode ? (
        <Card>
          <CardContent className="p-6">
            {renderedContent ? (
              <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
            ) : (
              <p className="text-muted-foreground italic">Aucun contenu à prévisualiser</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Toolbar */}
          {showToolbar && (
            <Card>
              <CardContent className="p-3">
                <div className="flex flex-wrap items-center gap-1">
                  {toolbarActions.map((group, groupIndex) => (
                    <div key={group.group} className="flex items-center gap-1">
                      {group.items.map((action) => (
                        <ToolbarButton
                          key={action.label}
                          icon={action.icon}
                          label={action.label}
                          onClick={action.onClick}
                        />
                      ))}
                      {groupIndex < toolbarActions.length - 1 && (
                        <Separator orientation="vertical" className="h-6 mx-2" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Editor */}
          <Textarea
            data-mdx-editor="true"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-sm resize-none"
            style={{ minHeight }}
          />
        </div>
      )}

      {/* Help text */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>Conseils d'écriture Markdown :</strong></p>
        <div className="grid gap-1 text-xs md:grid-cols-2">
          <div>
            <p>• <code># Titre</code> pour les titres principaux</p>
            <p>• <code>## Sous-titre</code> pour les sous-titres</p>
            <p>• <code>**Gras**</code> et <code>*Italique*</code></p>
            <p>• <code>`Code inline`</code> pour le code</p>
          </div>
          <div>
            <p>• <code>[Lien](url)</code> pour les liens</p>
            <p>• <code>![Alt](url)</code> pour les images</p>
            <p>• <code>* Liste</code> et <code>1. Liste numérotée</code></p>
            <p>• <code>&gt; Citation</code> pour les citations</p>
          </div>
        </div>
      </div>
    </div>
  )
}