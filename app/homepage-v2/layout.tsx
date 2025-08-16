import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Homepage V2 - Cow or King Café | Espace Coworking Strasbourg',
  description: 'Version améliorée de notre homepage avec design optimisé, testimonials modernes et CTAs performants.',
}

export default function HomepageV2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="homepage-v2">
      {children}
    </div>
  )
}