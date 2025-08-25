import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI && process.env.NODE_ENV !== 'development') {
  console.warn("Variable d'environnement MONGODB_URI manquante - certaines fonctionnalités seront limitées")
}
const MONGODB_DB = process.env.MONGODB_DB || 'coworking-platform'

interface MongooseConnection {
  conn: mongoose.Mongoose | null
  promise: Promise<mongoose.Mongoose> | null
}

/**
 * Cache global pour Mongoose en développement
 * Évite la reconnexion multiple avec HMR
 */
let cached: MongooseConnection = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

/**
 * Configuration Mongoose optimisée avec timeouts généreux
 */
const mongooseOptions: mongoose.ConnectOptions = {
  dbName: MONGODB_DB,
  maxPoolSize: 10, // Maintenir jusqu'à 10 connexions socket
  serverSelectionTimeoutMS: 30000, // 30 secondes pour la sélection du serveur
  socketTimeoutMS: 120000, // 120 secondes pour les sockets
  connectTimeoutMS: 30000, // 30 secondes pour la connexion initiale
  family: 4, // Utiliser IPv4
  maxIdleTimeMS: 300000, // 5 minutes d'inactivité avant fermeture
  bufferCommands: false, // Désactiver le buffer Mongoose
  retryWrites: true, // Retry automatique des écritures
  retryReads: true, // Retry automatique des lectures
}

/**
 * Connexion Mongoose avec mise en cache pour le développement
 * @returns Promise<mongoose.Mongoose>
 */
export async function connectMongoose(): Promise<mongoose.Mongoose> {
  if (!MONGODB_URI) {
    throw new Error("Variable d'environnement MONGODB_URI manquante")
  }
  
  // Si déjà connecté, retourner la connexion existante
  if (cached.conn) {
    return cached.conn
  }

  // Si pas de promise de connexion, en créer une nouvelle
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, mongooseOptions)
  }

  // Attendre la connexion et la mettre en cache
  cached.conn = await cached.promise

  // Log uniquement en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('🍃 Mongoose connecté à MongoDB')
  }

  return cached.conn
}

/**
 * Ferme proprement la connexion Mongoose
 */
export async function disconnectMongoose(): Promise<void> {
  if (cached.conn) {
    await mongoose.connection.close()
    cached.conn = null
    cached.promise = null

    if (process.env.NODE_ENV === 'development') {
      console.log('🍃 Mongoose déconnecté')
    }
  }
}

/**
 * Vérifie l'état de la connexion Mongoose
 * @returns boolean - true si connecté
 */
export function isMongooseConnected(): boolean {
  return mongoose.connection.readyState === 1
}

/**
 * Gestionnaire d'événements Mongoose
 */
mongoose.connection.on('connected', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🍃 Mongoose: Connexion établie')
  }
})

mongoose.connection.on('error', (err) => {
  console.error('🍃 Mongoose: Erreur de connexion:', err)
})

mongoose.connection.on('disconnected', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🍃 Mongoose: Connexion fermée')
  }
})

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  await disconnectMongoose()
  process.exit(0)
})

// Assurer la connexion par défaut
export default connectMongoose
