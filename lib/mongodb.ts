import { MongoClient, Db, MongoClientOptions } from 'mongodb'
import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error("Variable d'environnement MONGODB_URI manquante")
}

const uri = process.env.MONGODB_URI
const databaseName = process.env.MONGODB_DB || 'coworking-platform'

// Configuration optimisée pour la production avec timeouts plus généreux
const options: MongoClientOptions = {
  maxPoolSize: 10, // Maintenir jusqu'à 10 connexions socket
  serverSelectionTimeoutMS: 30000, // 30 secondes pour la sélection du serveur
  socketTimeoutMS: 120000, // 120 secondes pour les sockets
  connectTimeoutMS: 30000, // 30 secondes pour la connexion initiale
  family: 4, // Utiliser IPv4, ignorer IPv6
  maxIdleTimeMS: 300000, // 5 minutes d'inactivité avant fermeture
  compressors: ['zlib'], // Compression pour réduire la bande passante
  retryWrites: true, // Retry automatique des écritures
  retryReads: true, // Retry automatique des lectures
  maxConnecting: 2, // Maximum 2 connexions simultanées en cours d'établissement
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Cache pour les connexions par base de données
const dbCache = new Map<string, Db>()

if (process.env.NODE_ENV === 'development') {
  // En développement, utiliser une variable globale pour conserver la valeur
  // à travers les rechargements de module causés par HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
    _mongoDbCache?: Map<string, Db>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  if (!globalWithMongo._mongoDbCache) {
    globalWithMongo._mongoDbCache = new Map<string, Db>()
  }

  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // En production, il est préférable de ne pas utiliser de variable globale.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

/**
 * Connexion optimisée à MongoDB avec mise en cache des connexions DB
 * @param dbName - Nom de la base de données (optionnel, utilise MONGODB_DB par défaut)
 * @returns Promise contenant le client et la base de données
 */
export async function connectToDatabase(
  dbName?: string
): Promise<{ client: MongoClient; db: Db }> {
  let retryCount = 0
  const maxRetries = 3

  while (retryCount < maxRetries) {
    try {
      const connectedClient = await clientPromise

      // Test la connexion avec un ping
      await connectedClient.db().admin().ping()

      const targetDbName = dbName || databaseName

      // Utiliser le cache pour éviter les reconnexions inutiles
      let db: Db
      if (process.env.NODE_ENV === 'development') {
        const globalWithMongo = global as typeof globalThis & {
          _mongoDbCache?: Map<string, Db>
        }
        if (!globalWithMongo._mongoDbCache?.has(targetDbName)) {
          db = connectedClient.db(targetDbName)
          globalWithMongo._mongoDbCache?.set(targetDbName, db)
        } else {
          db = globalWithMongo._mongoDbCache.get(targetDbName)!
        }
      } else {
        if (!dbCache.has(targetDbName)) {
          db = connectedClient.db(targetDbName)
          dbCache.set(targetDbName, db)
        } else {
          db = dbCache.get(targetDbName)!
        }
      }

      return { client: connectedClient, db }
    } catch (error) {
      retryCount++
      console.error(
        `Tentative de connexion MongoDB ${retryCount}/${maxRetries} échouée:`,
        error
      )

      if (retryCount >= maxRetries) {
        throw new Error(
          `Impossible de se connecter à MongoDB après ${maxRetries} tentatives: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Attendre avant la prochaine tentative (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      )
    }
  }

  // Cette ligne ne devrait jamais être atteinte, mais TypeScript l'exige
  throw new Error('Erreur inattendue lors de la connexion MongoDB')
}

/**
 * Ferme proprement la connexion MongoDB
 * À utiliser lors de l'arrêt de l'application
 */
export async function closeConnection(): Promise<void> {
  try {
    const connectedClient = await clientPromise
    await connectedClient.close()
    dbCache.clear()
    // Log réduit pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.log('MongoDB: Connexion fermée')
    }
  } catch (error) {
    console.error('Erreur MongoDB:', error)
  }
}

/**
 * Vérifie la santé de la connexion MongoDB
 * @returns Promise<boolean> - true si la connexion est active
 */
export async function checkMongoHealth(): Promise<boolean> {
  try {
    const { db } = await connectToDatabase()
    // Ping simple pour vérifier la connexion
    await db.admin().ping()
    return true
  } catch (error) {
    console.error('Échec du test de santé MongoDB:', error)
    return false
  }
}

/**
 * Crée les index nécessaires pour optimiser les performances
 * @param db - Instance de la base de données
 */
export async function createIndexes(db: Db): Promise<void> {
  try {
    // Index pour la collection users avec optimisations de sécurité
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { role: 1, isActive: 1 }, name: 'role_active_compound' },
      { key: { isActive: 1, lastLoginAt: -1 }, name: 'active_login_compound' },
      { key: { createdAt: -1 }, name: 'created_desc' },
      // Index partiel pour les utilisateurs actifs uniquement (meilleure performance)
      {
        key: { email: 1, role: 1 },
        partialFilterExpression: { isActive: true },
        name: 'active_users_compound',
      },
      // Index sparse pour éviter d'indexer les valeurs nulles
      { key: { lastLoginAt: -1 }, sparse: true, name: 'last_login_sparse' },
    ])

    // Index pour la collection security_logs (si utilisée)
    await db.collection('security_logs').createIndexes([
      { key: { userId: 1, timestamp: -1 }, name: 'user_timestamp' },
      { key: { action: 1, timestamp: -1 }, name: 'action_timestamp' },
      { key: { ip: 1, timestamp: -1 }, name: 'ip_timestamp' },
      { key: { timestamp: -1 }, name: 'timestamp_desc' },
      // TTL index pour auto-suppression après 90 jours
      {
        key: { timestamp: 1 },
        expireAfterSeconds: 90 * 24 * 60 * 60,
        name: 'ttl_90days',
      },
    ])

    // Index pour la collection sessions (si utilisée)
    await db.collection('sessions').createIndexes([
      { key: { userId: 1 }, name: 'user_sessions' },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: 'session_ttl' },
    ])

    console.log('Index MongoDB créés avec succès')
  } catch (error) {
    console.error('Erreur lors de la création des index MongoDB:', error)
    // Ne pas faire échouer l'application si les index ne peuvent pas être créés
    // Les performances seront simplement moins optimales
  }
}

// Gestion propre de l'arrêt de l'application
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Flag pour éviter les logs multiples
  let shutdownInitiated = false

  const gracefulShutdown = async (signal: string) => {
    if (shutdownInitiated) return
    shutdownInitiated = true

    console.log(`MongoDB: Connexion fermée (${signal})`)
    await closeConnection()
    process.exit(0)
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
}

/**
 * Fonction de connexion Mongoose pour compatibilité avec les modèles Space et Booking
 */
interface CachedConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

let cached: CachedConnection = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

export default async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri)
      .then((mongoose) => {
        console.log('✅ MongoDB connecté via Mongoose')
        return mongoose
      })
      .catch((reason) => {
        console.error('❌ Échec connexion MongoDB Mongoose:', reason)
        throw reason
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

// Les autres fonctions sont déjà exportées individuellement
