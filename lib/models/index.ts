// Export des modèles MongoDB pour la plateforme de coworking

// Modèles principaux
export { User, type IUser } from './user'
export { Booking, type IBooking } from './booking'
export { Space, type ISpace, defaultSpaces, insertDefaultSpaces } from './space'
export { default as Employee, type IEmployee } from './employee'
export { default as TimeEntry, type ITimeEntry } from './timeEntry'

// Modèles Blog & CMS
export { Article, type IArticle, type ISEOMetadata, type IArticleStats } from './Article'
export { Category, type ICategory, defaultCategories, insertDefaultCategories } from './Category'
export { Comment, type IComment } from './Comment'

// Modèles Produits & Commandes
export { Product, type IProduct, type ProductCategory, type ProductStatus } from './product'
export { ProductCategory as ProductCategoryModel, type IProductCategory } from './productCategory'

// Réexport des utilitaires MongoDB
export {
  checkBookingConflicts,
  getAvailableTimeSlots,
  getOccupancyStats,
  findConsecutiveFreeSlots,
  validateBookingData,
  calculateBookingPrice,
  generateOccupancyReport,
  type TimeSlot,
  type BookingConflict,
  type OccupancyStats,
} from '../mongodb-utils'

// Types utiles pour les API
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type DurationType = 'hour' | 'day' | 'week' | 'month'
export type SpaceSpecialty =
  | 'Café coworking'
  | 'Salle privée'
  | 'Zone silencieuse'

// Types Blog & CMS
export type ArticleStatus = 'draft' | 'published' | 'archived'
export type ContentType = 'article' | 'news' | 'tutorial' | 'announcement'
export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam'
export type CommentType = 'comment' | 'reply'

// Types Produits
export type ProductCategory = 'coffee' | 'tea' | 'pastry' | 'sandwich' | 'snack' | 'beverage' | 'healthy' | 'breakfast'
export type ProductStatus = 'available' | 'unavailable' | 'coming_soon'

// Interface pour les données de création de réservation
export interface CreateBookingData {
  userId: string
  spaceId: string
  date: Date
  startTime: string
  endTime: string
  duration: number
  durationType: DurationType
  guests: number
  totalPrice: number
  paymentMethod: 'onsite' | 'card' | 'paypal'
  notes?: string
}

// Interface pour les données de création d'espace
export interface CreateSpaceData {
  id: string
  name: string
  location: string
  capacity: number
  pricePerHour: number
  pricePerDay: number
  pricePerWeek: number
  pricePerMonth: number
  features: string[]
  image: string
  specialty: SpaceSpecialty
  description?: string
  amenities?: string[]
  isPopular?: boolean
}

// Interface pour les données de création d'article
export interface CreateArticleData {
  title: string
  slug?: string
  excerpt: string
  content: string
  coverImage?: string
  status?: ArticleStatus
  contentType?: ContentType
  authorId: string
  categoryId: string
  tags?: string[]
  featured?: boolean
  allowComments?: boolean
  scheduledPublishAt?: Date
  seoMetadata?: Partial<ISEOMetadata>
}

// Interface pour les données de création de catégorie
export interface CreateCategoryData {
  name: string
  slug?: string
  description?: string
  color?: string
  icon?: string
  parentCategoryId?: string
  createdBy: string
}

// Interface pour les données de création de commentaire
export interface CreateCommentData {
  content: string
  authorId: string
  authorName: string
  authorEmail: string
  authorWebsite?: string
  articleId: string
  parentCommentId?: string
  ipAddress: string
  userAgent: string
}
