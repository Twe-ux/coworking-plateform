/**
 * Utilitaires de validation et sanitisation des entrées
 * Protection contre l'injection et la validation des données
 */

import validator from 'validator'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitized?: string
}

/**
 * Valide et sanitise une adresse email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []

  if (!email || typeof email !== 'string') {
    errors.push('Email requis')
    return { isValid: false, errors }
  }

  // Sanitisation basique
  const sanitized = email.trim().toLowerCase()

  // Validation de format
  if (!validator.isEmail(sanitized)) {
    errors.push('Format email invalide')
  }

  // Vérification de longueur
  if (sanitized.length > 254) {
    errors.push('Email trop long (max 254 caractères)')
  }

  // Vérification de domaines suspects (optionnel)
  const suspiciousDomains = [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
  ]
  const domain = sanitized.split('@')[1]
  if (suspiciousDomains.includes(domain)) {
    errors.push('Domaine email temporaire non autorisé')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  }
}

/**
 * Valide les entrées de nom (prénom, nom de famille)
 */
export function validateName(
  name: string,
  fieldName: string = 'Nom'
): ValidationResult {
  const errors: string[] = []

  if (!name || typeof name !== 'string') {
    errors.push(`${fieldName} requis`)
    return { isValid: false, errors }
  }

  // Sanitisation
  const sanitized = name.trim().replace(/\s+/g, ' ')

  // Validation de longueur
  if (sanitized.length < 2) {
    errors.push(`${fieldName} doit contenir au moins 2 caractères`)
  }

  if (sanitized.length > 50) {
    errors.push(`${fieldName} ne peut dépasser 50 caractères`)
  }

  // Validation de caractères (lettres, espaces, traits d'union, apostrophes)
  if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(sanitized)) {
    errors.push(
      `${fieldName} ne peut contenir que des lettres, espaces, traits d'union et apostrophes`
    )
  }

  // Protection contre les injections
  if (/<[^>]*>/g.test(sanitized)) {
    errors.push(`${fieldName} contient des caractères non autorisés`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  }
}

/**
 * Valide et sanitise les entrées de mot de passe
 */
export function validatePasswordInput(password: string): ValidationResult {
  const errors: string[] = []

  if (!password || typeof password !== 'string') {
    errors.push('Mot de passe requis')
    return { isValid: false, errors }
  }

  // Pas de sanitisation du mot de passe - on le prend tel quel
  // Mais on vérifie la longueur max pour éviter les DoS
  if (password.length > 128) {
    errors.push('Mot de passe trop long (max 128 caractères)')
  }

  // Vérification de caractères interdits (caractères de contrôle)
  if (/[\x00-\x1F\x7F]/.test(password)) {
    errors.push('Mot de passe contient des caractères non autorisés')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? password : undefined,
  }
}

/**
 * Sanitise les entrées génériques pour éviter XSS
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return validator.escape(input.trim())
}

/**
 * Valide les paramètres de requête pour éviter l'injection
 */
export function validateQueryParams(params: Record<string, any>): {
  isValid: boolean
  errors: string[]
  sanitized: Record<string, string>
} {
  const errors: string[] = []
  const sanitized: Record<string, string> = {}

  for (const [key, value] of Object.entries(params)) {
    // Validation de la clé
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,49}$/.test(key)) {
      errors.push(`Paramètre invalide: ${key}`)
      continue
    }

    // Sanitisation de la valeur
    if (typeof value === 'string') {
      const cleanValue = sanitizeInput(value)
      if (cleanValue.length <= 1000) {
        sanitized[key] = cleanValue
      } else {
        errors.push(`Valeur trop longue pour ${key}`)
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = String(value)
    } else {
      errors.push(`Type de valeur non supporté pour ${key}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  }
}

/**
 * Valide les IDs MongoDB
 */
export function validateObjectId(id: string): ValidationResult {
  const errors: string[] = []

  if (!id || typeof id !== 'string') {
    errors.push('ID requis')
    return { isValid: false, errors }
  }

  const sanitized = id.trim()

  if (!/^[a-f\d]{24}$/i.test(sanitized)) {
    errors.push("Format d'ID invalide")
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  }
}

/**
 * Rate limiting par token bucket pour les API
 */
class TokenBucket {
  private tokens: number
  private lastRefill: number

  constructor(
    private capacity: number,
    private refillRate: number // tokens par seconde
  ) {
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  consume(): boolean {
    this.refill()

    if (this.tokens >= 1) {
      this.tokens--
      return true
    }

    return false
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    const tokensToAdd = elapsed * this.refillRate

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
}

// Cache des buckets par IP
const rateLimitBuckets = new Map<string, TokenBucket>()

/**
 * Vérifie le rate limiting pour une IP
 */
export function checkRateLimit(
  ip: string,
  capacity: number = 100,
  refillRate: number = 10
): boolean {
  if (!rateLimitBuckets.has(ip)) {
    rateLimitBuckets.set(ip, new TokenBucket(capacity, refillRate))
  }

  const bucket = rateLimitBuckets.get(ip)!
  return bucket.consume()
}

/**
 * Nettoie les anciens buckets de rate limiting
 */
export function cleanupRateLimitBuckets(): void {
  // Simple nettoyage périodique - garde seulement les 1000 plus récents
  if (rateLimitBuckets.size > 1000) {
    const entries = Array.from(rateLimitBuckets.entries())
    entries.slice(0, entries.length - 1000).forEach(([ip]) => {
      rateLimitBuckets.delete(ip)
    })
  }
}
