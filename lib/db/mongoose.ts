import { connectMongoose } from '@/lib/mongoose'

/**
 * Alias pour la fonction de connexion Mongoose
 * Utilisé par compatibilité avec les routes existantes
 */
export const connectToDatabase = connectMongoose

/**
 * Export par défaut pour la compatibilité
 */
export default connectToDatabase