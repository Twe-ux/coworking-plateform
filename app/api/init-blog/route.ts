/**
 * Endpoint d'initialisation du blog
 * Crée des articles de test pour démonstration
 */

import Article from '@/lib/models/Article'
import Category from '@/lib/models/Category'
import dbConnect from '@/lib/mongodb'
import { NextRequest } from 'next/server'

import User from '@/lib/models/user'
import { generateSlug } from '@/lib/validation/blog'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Vérifier si des articles existent déjà
    const existingArticles = await Article.countDocuments()
    if (existingArticles > 0) {
      return Response.json(
        {
          success: false,
          error: 'Des articles existent déjà dans la base de données',
          message:
            'Utilisez DELETE pour réinitialiser avant de créer de nouveaux articles',
        },
        { status: 400 }
      )
    }

    // Récupérer les catégories existantes
    const categories = await Category.find({ isActive: true }).limit(3)
    if (categories.length === 0) {
      return Response.json(
        {
          success: false,
          error: 'Aucune catégorie trouvée',
          message: "Veuillez d'abord créer des catégories avec /api/categories",
        },
        { status: 400 }
      )
    }

    // Récupérer un utilisateur admin/manager pour être l'auteur
    const author = await User.findOne({
      $or: [{ role: 'admin' }, { role: 'manager' }],
    })
    if (!author) {
      return Response.json(
        {
          success: false,
          error: 'Aucun utilisateur admin/manager trouvé',
          message:
            "Veuillez créer un utilisateur admin pour être l'auteur des articles",
        },
        { status: 400 }
      )
    }

    // Articles de test à créer
    const testArticles = [
      {
        title: 'Bienvenue dans notre espace de coworking',
        excerpt:
          'Découvrez tous les avantages de travailler dans un environnement collaboratif et inspirant.',
        content: `# Bienvenue dans notre espace de coworking

Notre espace de coworking a été conçu pour offrir un environnement de travail optimal aux entrepreneurs, freelances et équipes de toutes tailles.

## Nos espaces

### Bureaux privés
Des bureaux fermés pour vos réunions confidentielles et votre concentration maximale.

### Espaces partagés
Des zones ouvertes favorisant la collaboration et les échanges entre coworkers.

### Salles de réunion
Équipées des dernières technologies pour vos présentations et visioconférences.

## Services inclus

- WiFi haut débit
- Café et thé à volonté
- Imprimantes et scanners
- Accès 24h/7j
- Réception de courrier
- Nettoyage quotidien

Rejoignez notre communauté dès aujourd'hui !`,
        categoryId: categories[0]._id,
        tags: ['coworking', 'bienvenue', 'services'],
        status: 'published',
        contentType: 'article',
        featured: true,
        allowComments: true,
        author: author._id,
        lastEditedBy: author._id,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 jours avant
        stats: {
          views: 156,
          comments: 8,
          likes: 23,
          shares: 5,
        },
      },
      {
        title: 'Guide des bonnes pratiques en coworking',
        excerpt:
          'Les règles essentielles pour une cohabitation harmonieuse dans un espace partagé.',
        content: `# Guide des bonnes pratiques en coworking

Le coworking repose sur le respect mutuel et la collaboration. Voici nos conseils pour une expérience optimale.

## Respect des espaces communs

### Propreté
- Nettoyez après votre passage
- Rangez vos affaires personnelles
- Respectez les zones de stockage

### Bruit
- Utilisez les espaces de silence pour les appels
- Privilégiez les salles fermées pour les réunions
- Portez un casque pour écouter de la musique

## Communication

### Networking
- Participez aux événements communautaires
- Présentez-vous aux nouveaux arrivants
- Partagez vos compétences

### Collaboration
- Proposez votre aide quand c'est possible
- Soyez ouvert aux opportunités de partenariat
- Respectez la confidentialité des projets

## Réservations

- Réservez vos espaces à l'avance
- Annulez si vous ne pouvez pas venir
- Respectez les créneaux horaires

Ensemble, créons un environnement de travail exceptionnel !`,
        categoryId: categories[1]._id,
        tags: ['guide', 'bonnes-pratiques', 'règles', 'communauté'],
        status: 'published',
        contentType: 'tutorial',
        featured: false,
        allowComments: true,
        author: author._id,
        lastEditedBy: author._id,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 jours avant
        stats: {
          views: 89,
          comments: 12,
          likes: 34,
          shares: 8,
        },
      },
      {
        title: 'Les avantages du travail flexible',
        excerpt:
          'Comment le coworking révolutionne notre façon de travailler et améliore notre productivité.',
        content: `# Les avantages du travail flexible

Le monde du travail évolue et le coworking s'impose comme une solution d'avenir.

## Flexibilité géographique

### Mobilité
- Travaillez depuis différents lieux
- Choisissez l'environnement qui vous convient
- Adaptez votre espace selon vos besoins

### Équilibre vie pro/perso
- Réduisez les temps de transport
- Optimisez votre emploi du temps
- Travaillez près de chez vous

## Avantages économiques

### Coûts réduits
- Pas d'investissement en bureaux
- Charges partagées
- Services inclus dans l'abonnement

### Évolutivité
- Ajustez votre espace selon votre croissance
- Pas d'engagement long terme
- Testez différentes configurations

## Impact sur la productivité

### Environnement stimulant
- Sortez de l'isolement du domicile
- Bénéficiez de l'énergie collective
- Accédez à des espaces spécialisés

### Networking naturel
- Rencontrez d'autres professionnels
- Créez des synergies d'affaires
- Élargissez votre réseau

Le futur du travail est flexible, collaboratif et humain !`,
        categoryId: categories[2] ? categories[2]._id : categories[0]._id,
        tags: ['flexibilité', 'productivité', 'avantages', 'futur-du-travail'],
        status: 'published',
        contentType: 'article',
        featured: false,
        allowComments: true,
        author: author._id,
        lastEditedBy: author._id,
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 jour avant
        stats: {
          views: 45,
          comments: 3,
          likes: 12,
          shares: 2,
        },
      },
    ]

    const createdArticles = []

    // Créer chaque article
    for (const articleData of testArticles) {
      // Générer le slug
      const slug = generateSlug(articleData.title)

      // Créer l'article
      const article = new Article({
        ...articleData,
        slug,
        category: articleData.categoryId,
        version: 1,
      })

      await article.save()

      // Populer pour la réponse
      await article.populate([
        { path: 'author', select: 'firstName lastName email' },
        { path: 'category', select: 'name slug color' },
      ])

      createdArticles.push(article)

      // Mettre à jour les stats de la catégorie
      await Category.findByIdAndUpdate(articleData.categoryId, {
        $inc: { 'stats.articleCount': 1 },
        $set: { 'stats.lastArticleAt': new Date() },
      })
    }

    return Response.json({
      success: true,
      data: createdArticles,
      message: `${createdArticles.length} articles de test créés avec succès`,
      meta: {
        created: createdArticles.length,
        author: `${author.firstName} ${author.lastName}`,
        categories: categories.map((cat) => cat.name),
      },
    })
  } catch (error: any) {
    console.error("Erreur lors de l'initialisation du blog:", error)
    return Response.json(
      {
        success: false,
        error: "Erreur lors de l'initialisation du blog",
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Supprimer tous les articles (pour réinitialisation)
 */
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()

    // Supprimer tous les articles
    const deletedArticles = await Article.deleteMany({})

    // Remettre à zéro les stats des catégories
    await Category.updateMany(
      {},
      {
        $set: {
          'stats.articleCount': 0,
          'stats.lastArticleAt': null,
        },
      }
    )

    return Response.json({
      success: true,
      message: `${deletedArticles.deletedCount} articles supprimés`,
      data: { deletedCount: deletedArticles.deletedCount },
    })
  } catch (error: any) {
    console.error('Erreur lors de la suppression des articles:', error)
    return Response.json(
      {
        success: false,
        error: 'Erreur lors de la suppression',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
