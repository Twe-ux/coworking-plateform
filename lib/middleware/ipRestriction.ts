import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db/mongoose'
import { Channel } from '@/lib/models/channel'

interface IPRestrictionConfig {
  allowedIPs: string[]
  isEnabled: boolean
  whitelist?: string[] // IPs toujours autorisées (admin, etc.)
  blacklist?: string[] // IPs bannies
}

export class IPRestrictionMiddleware {
  private static config: IPRestrictionConfig = {
    allowedIPs: [],
    isEnabled: false,
    whitelist: ['127.0.0.1', '::1'], // localhost par défaut
    blacklist: []
  }

  public static setConfig(config: Partial<IPRestrictionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  public static getConfig(): IPRestrictionConfig {
    return { ...this.config }
  }

  public static getClientIP(request: NextRequest): string {
    // Essayer différentes sources d'IP
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare
    const xVercelForwardedFor = request.headers.get('x-vercel-forwarded-for') // Vercel

    let clientIP = '127.0.0.1'

    if (cfConnectingIP) {
      clientIP = cfConnectingIP
    } else if (xVercelForwardedFor) {
      clientIP = xVercelForwardedFor.split(',')[0].trim()
    } else if (realIP) {
      clientIP = realIP
    } else if (forwardedFor) {
      clientIP = forwardedFor.split(',')[0].trim()
    } else {
      // Fallback vers l'IP de connexion
      const url = new URL(request.url)
      const host = request.headers.get('host') || url.hostname
      
      // En développement, garder localhost
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        clientIP = '127.0.0.1'
      }
    }

    return this.normalizeIP(clientIP)
  }

  public static normalizeIP(ip: string): string {
    // Nettoyer l'IP
    ip = ip.trim()
    
    // Gérer les IPv6 mappées sur IPv4
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7)
    }
    
    // Normaliser localhost
    if (ip === '::1') {
      ip = '127.0.0.1'
    }
    
    return ip
  }

  public static isIPAllowed(ip: string): boolean {
    const normalizedIP = this.normalizeIP(ip)

    // Vérifier la blacklist en premier
    if (this.config.blacklist && this.config.blacklist.includes(normalizedIP)) {
      return false
    }

    // Vérifier la whitelist
    if (this.config.whitelist && this.config.whitelist.includes(normalizedIP)) {
      return true
    }

    // Si la restriction IP n'est pas activée, autoriser
    if (!this.config.isEnabled) {
      return true
    }

    // Vérifier si l'IP est dans la liste autorisée
    return this.config.allowedIPs.includes(normalizedIP)
  }

  public static isIPInRange(ip: string, range: string): boolean {
    try {
      // Support pour les ranges CIDR basiques
      if (range.includes('/')) {
        const [rangeIP, prefixLength] = range.split('/')
        const prefix = parseInt(prefixLength, 10)
        
        // Conversion simplifiée pour IPv4
        if (this.isIPv4(ip) && this.isIPv4(rangeIP)) {
          const ipNum = this.ipToNumber(ip)
          const rangeNum = this.ipToNumber(rangeIP)
          const mask = (0xffffffff << (32 - prefix)) >>> 0
          
          return (ipNum & mask) === (rangeNum & mask)
        }
      } else {
        // Comparaison exacte
        return this.normalizeIP(ip) === this.normalizeIP(range)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du range IP:', error)
    }
    
    return false
  }

  public static isIPv4(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    return ipv4Regex.test(ip)
  }

  public static isIPv6(ip: string): boolean {
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv6Regex.test(ip)
  }

  private static ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  }

  public static async checkChannelIPRestriction(
    channelId: string,
    clientIP: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      await connectToDatabase()
      
      const channel = await Channel.findById(channelId)
      if (!channel) {
        return { allowed: false, reason: 'Channel introuvable' }
      }

      // Si pas de restriction IP spécifique au channel
      if (!channel.metadata?.ipRestriction?.isEnabled) {
        return { allowed: true }
      }

      const allowedIPs = channel.metadata.ipRestriction.allowedIPs || []
      const normalizedClientIP = this.normalizeIP(clientIP)

      // Vérifier si l'IP est autorisée pour ce channel
      const isIPAllowed = allowedIPs.some((allowedIP: any) => 
        this.isIPInRange(normalizedClientIP, allowedIP)
      )

      if (!isIPAllowed) {
        return { 
          allowed: false, 
          reason: `Accès refusé depuis l'IP ${normalizedClientIP}. Ce channel est restreint à certaines adresses IP.`
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Erreur lors de la vérification IP du channel:', error)
      return { allowed: false, reason: 'Erreur de vérification IP' }
    }
  }

  public static async middleware(request: NextRequest): Promise<NextResponse | null> {
    // Vérifier si la route nécessite une restriction IP
    const pathname = request.nextUrl.pathname
    
    // Routes de messagerie qui nécessitent une vérification IP
    const messagingRoutes = [
      '/api/messaging',
      '/api/channels',
      '/api/socket',
      '/messaging'
    ]

    const needsIPCheck = messagingRoutes.some(route => pathname.startsWith(route))
    if (!needsIPCheck) {
      return null // Pas de restriction nécessaire
    }

    const clientIP = this.getClientIP(request)
    
    // Vérification IP globale
    if (!this.isIPAllowed(clientIP)) {
      console.log(`Accès refusé pour IP: ${clientIP}`)
      
      return NextResponse.json(
        { 
          error: 'Accès refusé',
          message: `Votre adresse IP (${clientIP}) n'est pas autorisée à accéder au système de messagerie.`,
          code: 'IP_RESTRICTED'
        },
        { status: 403 }
      )
    }

    // Ajouter l'IP aux headers pour les handlers suivants
    const response = NextResponse.next()
    response.headers.set('x-client-ip', clientIP)
    
    return response
  }

  public static async checkUserIPAccess(request: NextRequest): Promise<{
    allowed: boolean
    clientIP: string
    reason?: string
  }> {
    const clientIP = this.getClientIP(request)
    
    try {
      // Vérifier la session utilisateur
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return {
          allowed: false,
          clientIP,
          reason: 'Non authentifié'
        }
      }

      // Vérification IP globale
      if (!this.isIPAllowed(clientIP)) {
        return {
          allowed: false,
          clientIP,
          reason: `IP ${clientIP} non autorisée`
        }
      }

      return {
        allowed: true,
        clientIP
      }
    } catch (error) {
      console.error('Erreur lors de la vérification d\'accès IP:', error)
      return {
        allowed: false,
        clientIP,
        reason: 'Erreur de vérification'
      }
    }
  }

  // Méthodes d'administration
  public static addAllowedIP(ip: string): void {
    const normalizedIP = this.normalizeIP(ip)
    if (!this.config.allowedIPs.includes(normalizedIP)) {
      this.config.allowedIPs.push(normalizedIP)
    }
  }

  public static removeAllowedIP(ip: string): void {
    const normalizedIP = this.normalizeIP(ip)
    const index = this.config.allowedIPs.indexOf(normalizedIP)
    if (index > -1) {
      this.config.allowedIPs.splice(index, 1)
    }
  }

  public static addToBlacklist(ip: string): void {
    const normalizedIP = this.normalizeIP(ip)
    if (!this.config.blacklist) {
      this.config.blacklist = []
    }
    if (!this.config.blacklist.includes(normalizedIP)) {
      this.config.blacklist.push(normalizedIP)
    }
  }

  public static removeFromBlacklist(ip: string): void {
    const normalizedIP = this.normalizeIP(ip)
    if (this.config.blacklist) {
      const index = this.config.blacklist.indexOf(normalizedIP)
      if (index > -1) {
        this.config.blacklist.splice(index, 1)
      }
    }
  }

  public static enableIPRestriction(): void {
    this.config.isEnabled = true
  }

  public static disableIPRestriction(): void {
    this.config.isEnabled = false
  }

  public static getIPInfo(ip: string): {
    normalized: string
    isIPv4: boolean
    isIPv6: boolean
    isLocalhost: boolean
    isPrivate: boolean
  } {
    const normalized = this.normalizeIP(ip)
    
    return {
      normalized,
      isIPv4: this.isIPv4(normalized),
      isIPv6: this.isIPv6(normalized),
      isLocalhost: ['127.0.0.1', 'localhost', '::1'].includes(normalized),
      isPrivate: this.isPrivateIP(normalized)
    }
  }

  private static isPrivateIP(ip: string): boolean {
    if (!this.isIPv4(ip)) return false
    
    const parts = ip.split('.').map(Number)
    
    // Plages IP privées
    return (
      (parts[0] === 10) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    )
  }

  public static logIPAccess(ip: string, allowed: boolean, reason?: string): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      ip: this.normalizeIP(ip),
      allowed,
      reason: reason || (allowed ? 'IP autorisée' : 'IP refusée')
    }
    
    // TODO: Persister les logs dans une base de données ou fichier
    console.log('IP Access Log:', logEntry)
  }
}

// Configuration par défaut pour le développement
if (process.env.NODE_ENV === 'development') {
  IPRestrictionMiddleware.setConfig({
    isEnabled: false, // Désactivé en développement
    allowedIPs: ['127.0.0.1', 'localhost'],
    whitelist: ['127.0.0.1', '::1', 'localhost']
  })
}

// Configuration pour la production
if (process.env.NODE_ENV === 'production') {
  // Charger la configuration depuis les variables d'environnement
  const allowedIPs = process.env.MESSAGING_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || []
  const isEnabled = process.env.MESSAGING_IP_RESTRICTION_ENABLED === 'true'
  
  IPRestrictionMiddleware.setConfig({
    isEnabled,
    allowedIPs,
    whitelist: ['127.0.0.1', '::1', ...allowedIPs]
  })
}

export default IPRestrictionMiddleware