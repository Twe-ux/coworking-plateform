/**
 * Composant pour le rendu du contenu MDX/Markdown
 * Support des composants personnalisés et de la syntaxe MDX
 */

'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { AlertTriangle, Info, CheckCircle, XCircle, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface MDXRendererProps {
  content: string
  components?: Record<string, React.ComponentType<any>>
}

// Composants personnalisés pour MDX
const customComponents = {
  // Liens
  a: ({ href, children, ...props }: any) => {
    const isExternal = href?.startsWith('http')
    
    if (isExternal) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          {...props}
        >
          {children}
        </a>
      )
    }
    
    return (
      <Link href={href} className="text-primary hover:underline" {...props}>
        {children}
      </Link>
    )
  },
  
  // Images optimisées
  img: ({ src, alt, ...props }: any) => {
    if (!src) return null
    
    // Si c'est une URL relative, la convertir en absolue
    const imageSrc = src.startsWith('/') ? src : `/${src}`
    
    return (
      <div className="my-6">
        <div className="relative rounded-lg overflow-hidden border">
          <Image
            src={imageSrc}
            alt={alt || ''}
            width={800}
            height={400}
            className="w-full h-auto object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            {...props}
          />
        </div>
        {alt && (
          <p className="text-sm text-muted-foreground text-center mt-2 italic">
            {alt}
          </p>
        )}
      </div>
    )
  },
  
  // Code blocks avec syntaxe highlighting
  pre: ({ children, ...props }: any) => {
    const child = children?.props
    const language = child?.className?.replace('language-', '') || 'text'
    const code = child?.children || ''
    
    const handleCopy = async () => {
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(code)
          // Ici vous pourriez ajouter une notification
          console.log('Code copié')
        } catch (error) {
          console.error('Erreur lors de la copie:', error)
        }
      }
    }
    
    return (
      <div className="my-6 relative group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <SyntaxHighlighter
          language={language}
          style={tomorrow}
          className="rounded-lg border"
          showLineNumbers
          wrapLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    )
  },
  
  // Code inline
  code: ({ children, ...props }: any) => (
    <code 
      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  ),
  
  // Citations
  blockquote: ({ children, ...props }: any) => (
    <blockquote 
      className="border-l-4 border-primary bg-muted/50 pl-6 py-4 my-6 italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),
  
  // Tableaux responsives
  table: ({ children, ...props }: any) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse border rounded-lg" {...props}>
        {children}
      </table>
    </div>
  ),
  
  thead: ({ children, ...props }: any) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  
  th: ({ children, ...props }: any) => (
    <th className="border p-3 text-left font-semibold" {...props}>
      {children}
    </th>
  ),
  
  td: ({ children, ...props }: any) => (
    <td className="border p-3" {...props}>
      {children}
    </td>
  ),
  
  // Séparateurs
  hr: (props: any) => <Separator className="my-8" {...props} />,
  
  // Titres avec ancres
  h1: ({ children, id, ...props }: any) => (
    <h1 id={id} className="scroll-mt-24 text-3xl font-bold mb-6 mt-8 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  
  h2: ({ children, id, ...props }: any) => (
    <h2 id={id} className="scroll-mt-24 text-2xl font-bold mb-4 mt-8 first:mt-0" {...props}>
      {children}
    </h2>
  ),
  
  h3: ({ children, id, ...props }: any) => (
    <h3 id={id} className="scroll-mt-24 text-xl font-bold mb-3 mt-6 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  
  // Listes
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside space-y-2 my-4 pl-4" {...props}>
      {children}
    </ul>
  ),
  
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside space-y-2 my-4 pl-4" {...props}>
      {children}
    </ol>
  ),
  
  li: ({ children, ...props }: any) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
}

// Composants spécialisés pour le blog
const blogComponents = {
  // Alertes
  Alert: ({ type = 'info', title, children, ...props }: any) => {
    const icons = {
      info: Info,
      warning: AlertTriangle,
      success: CheckCircle,
      error: XCircle,
    }
    
    const Icon = icons[type as keyof typeof icons] || Info
    
    return (
      <Alert className={`my-6 ${
        type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
        type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950' :
        type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
        'border-blue-500 bg-blue-50 dark:bg-blue-950'
      }`} {...props}>
        <Icon className="h-4 w-4" />
        {title && <h4 className="font-medium mb-1">{title}</h4>}
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    )
  },
  
  // Cartes
  Card: ({ title, children, ...props }: any) => (
    <Card className="my-6" {...props}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  ),
  
  // Badge
  Badge: ({ children, variant = 'default', ...props }: any) => (
    <Badge variant={variant} {...props}>
      {children}
    </Badge>
  ),
  
  // Galerie d'images
  Gallery: ({ images, ...props }: any) => {
    if (!images || !Array.isArray(images)) return null
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6" {...props}>
        {images.map((image: any, index: number) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
            <Image
              src={image.src}
              alt={image.alt || `Image ${index + 1}`}
              fill
              className="object-cover hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>
    )
  },
  
  // Table des matières
  TOC: ({ headings, ...props }: any) => {
    if (!headings || !Array.isArray(headings)) return null
    
    return (
      <Card className="my-6" {...props}>
        <CardHeader>
          <CardTitle className="text-lg">Table des matières</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="space-y-2">
            {headings.map((heading: any, index: number) => (
              <Link
                key={index}
                href={`#${heading.id}`}
                className={`block text-sm hover:text-primary transition-colors ${
                  heading.level === 2 ? 'font-medium' : 'pl-4 text-muted-foreground'
                }`}
              >
                {heading.text}
              </Link>
            ))}
          </nav>
        </CardContent>
      </Card>
    )
  },
}

// Fonction simple de parsing Markdown vers HTML
function parseMarkdown(markdown: string): string {
  // Cette fonction est très basique. En production, utilisez une vraie librairie comme marked ou remark
  let html = markdown
    // Titres
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Gras et italique
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Liens
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // Code inline
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Paragraphes
    .replace(/\n\n/g, '</p><p>')
    
  return `<p>${html}</p>`.replace('<p></p>', '')
}

export function MDXRenderer({ content, components = {} }: MDXRendererProps) {
  const allComponents = useMemo(() => ({
    ...customComponents,
    ...blogComponents,
    ...components,
  }), [components])
  
  // Pour cet exemple, on utilise un parsing simple du Markdown
  // En production, vous devriez utiliser une vraie librairie MDX comme @mdx-js/react
  const processedContent = useMemo(() => {
    // Si le contenu contient des balises JSX/MDX, on le traite différemment
    if (content.includes('<') && content.includes('>')) {
      // Contenu déjà en HTML/JSX
      return content
    }
    
    // Sinon, on le parse comme du Markdown
    return parseMarkdown(content)
  }, [content])
  
  return (
    <div 
      className="mdx-content"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}

// Style CSS pour le contenu MDX (à ajouter dans votre CSS global)
export const mdxStyles = `
.mdx-content {
  line-height: 1.7;
}

.mdx-content p {
  margin: 1rem 0;
}

.mdx-content p:first-child {
  margin-top: 0;
}

.mdx-content p:last-child {
  margin-bottom: 0;
}

.mdx-content strong {
  font-weight: 600;
}

.mdx-content em {
  font-style: italic;
}

.mdx-content a {
  color: hsl(var(--primary));
  text-decoration: underline;
  text-underline-offset: 2px;
}

.mdx-content a:hover {
  text-decoration: none;
}

.mdx-content code {
  background-color: hsl(var(--muted));
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}

.mdx-content h1,
.mdx-content h2,
.mdx-content h3,
.mdx-content h4,
.mdx-content h5,
.mdx-content h6 {
  font-weight: 700;
  line-height: 1.2;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.mdx-content h1:first-child,
.mdx-content h2:first-child,
.mdx-content h3:first-child,
.mdx-content h4:first-child,
.mdx-content h5:first-child,
.mdx-content h6:first-child {
  margin-top: 0;
}

.mdx-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1.5rem 0;
}
`