/**
 * Footer du blog avec liens de navigation et informations
 */

import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export function BlogFooter() {
  const currentYear = new Date().getFullYear()
  
  const footerSections = [
    {
      title: 'Blog',
      links: [
        { label: 'Accueil', href: '/blog' },
        { label: 'À la une', href: '/blog?featured=true' },
        { label: 'Catégories', href: '/blog/categories' },
        { label: 'Archives', href: '/blog/archives' },
      ]
    },
    {
      title: 'Contenus',
      links: [
        { label: 'Articles', href: '/blog?contentType=article' },
        { label: 'Actualités', href: '/blog?contentType=news' },
        { label: 'Tutoriels', href: '/blog?contentType=tutorial' },
        { label: 'Annonces', href: '/blog?contentType=announcement' },
      ]
    },
    {
      title: 'Plateforme',
      links: [
        { label: 'Accueil', href: '/' },
        { label: 'Espaces', href: '/spaces' },
        { label: 'Réservations', href: '/reservation' },
        { label: 'Tableau de bord', href: '/dashboard' },
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Aide', href: '/help' },
        { label: 'Contact', href: '/contact' },
        { label: 'Conditions', href: '/terms' },
        { label: 'Confidentialité', href: '/privacy' },
      ]
    }
  ]

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Liens principaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-sm mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <Separator className="mb-6" />
        
        {/* Informations de copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {currentYear} CoWorking Platform. Tous droits réservés.
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <Link
              href="/blog/feed.xml"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              RSS
            </Link>
            <Link
              href="/blog/sitemap.xml"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}