'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Coffee,
  ShoppingBag,
  Plus,
  Minus,
  ShoppingCart,
  Search,
  Filter,
  Star,
  Clock,
  Euro,
  Heart,
  ChefHat,
  Utensils,
  Cookie,
  Zap,
  CheckCircle,
  Loader2,
  X,
} from 'lucide-react'
import { ClientLayout } from '@/components/dashboard/client/client-layout'
import {
  ClientCard,
  StatsCard,
} from '@/components/dashboard/client/client-cards'
import { containerVariants, listItemVariants } from '@/lib/animations'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: 'coffee' | 'tea' | 'food' | 'pastries' | 'beverages'
  image?: string
  popular?: boolean
  available: boolean
  preparationTime: number
  allergens?: string[]
  rating?: number
}

interface CartItem extends MenuItem {
  quantity: number
  customizations?: string[]
}

interface Order {
  id: string
  items: CartItem[]
  total: number
  status: 'preparing' | 'ready' | 'delivered' | 'cancelled'
  orderTime: string
  estimatedReady?: string
  notes?: string
}

export default function ClientCommandesPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'orders'>('menu')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  // Menu items avec données mockées réalistes pour "Cow or King Café"
  const menuItems: MenuItem[] = [
    // Cafés
    {
      id: '1',
      name: 'Espresso Royal',
      description: 'Notre signature espresso avec grains arabica premium',
      price: 2.5,
      category: 'coffee',
      popular: true,
      available: true,
      preparationTime: 2,
      rating: 4.8,
    },
    {
      id: '2',
      name: 'Cappuccino King',
      description: 'Cappuccino crémeux avec lait entier bio et art latte',
      price: 4.2,
      category: 'coffee',
      popular: true,
      available: true,
      preparationTime: 4,
      rating: 4.9,
    },
    {
      id: '3',
      name: 'Latte Caramel Cow',
      description: 'Latte onctueux au caramel de Normandie',
      price: 4.8,
      category: 'coffee',
      available: true,
      preparationTime: 5,
      rating: 4.7,
    },
    {
      id: '4',
      name: 'Cold Brew Royal',
      description: 'Café froid infusé 12h, servi sur glace',
      price: 4.5,
      category: 'coffee',
      available: true,
      preparationTime: 2,
      rating: 4.6,
    },
    // Thés
    {
      id: '5',
      name: 'Earl Grey Premium',
      description: 'Thé noir bergamote avec pétales de bleuet',
      price: 3.2,
      category: 'tea',
      available: true,
      preparationTime: 4,
      rating: 4.5,
    },
    {
      id: '6',
      name: 'Thé Chai Épicé',
      description: 'Mélange traditionnel aux épices indiennes',
      price: 3.8,
      category: 'tea',
      available: true,
      preparationTime: 5,
      rating: 4.7,
    },
    // Pâtisseries
    {
      id: '7',
      name: 'Croissant au Beurre',
      description: 'Croissant artisanal au beurre de Normandie',
      price: 2.2,
      category: 'pastries',
      popular: true,
      available: true,
      preparationTime: 1,
      rating: 4.8,
    },
    {
      id: '8',
      name: 'Pain au Chocolat',
      description: 'Viennoiserie aux pépites de chocolat noir 70%',
      price: 2.5,
      category: 'pastries',
      available: true,
      preparationTime: 1,
      rating: 4.6,
    },
    {
      id: '9',
      name: 'Muffin Myrtilles',
      description: 'Muffin moelleux aux myrtilles fraîches',
      price: 3.5,
      category: 'pastries',
      available: true,
      preparationTime: 2,
      rating: 4.4,
    },
    // Nourriture
    {
      id: '10',
      name: 'Croque Monsieur',
      description: 'Jambon, fromage gruyère, béchamel maison',
      price: 7.5,
      category: 'food',
      popular: true,
      available: true,
      preparationTime: 8,
      allergens: ['gluten', 'lait'],
      rating: 4.7,
    },
    {
      id: '11',
      name: 'Salade Caesar',
      description: 'Salade romaine, parmesan, croûtons, sauce caesar',
      price: 9.2,
      category: 'food',
      available: true,
      preparationTime: 5,
      allergens: ['gluten', 'oeuf'],
      rating: 4.5,
    },
    // Boissons
    {
      id: '12',
      name: "Jus d'Orange Frais",
      description: 'Oranges pressées du jour',
      price: 4.0,
      category: 'beverages',
      available: true,
      preparationTime: 2,
      rating: 4.3,
    },
  ]

  // Commandes mockées
  const mockOrders: Order[] = [
    {
      id: 'ORD001',
      items: [
        { ...menuItems[0], quantity: 1 },
        { ...menuItems[6], quantity: 1 },
      ],
      total: 4.7,
      status: 'ready',
      orderTime: '2024-01-08T10:15:00Z',
      estimatedReady: '2024-01-08T10:20:00Z',
    },
    {
      id: 'ORD002',
      items: [
        { ...menuItems[1], quantity: 2 },
        { ...menuItems[9], quantity: 1 },
      ],
      total: 12.9,
      status: 'preparing',
      orderTime: '2024-01-08T09:30:00Z',
      estimatedReady: '2024-01-08T09:45:00Z',
    },
  ]

  useEffect(() => {
    setOrders(mockOrders)
  }, [mockOrders])

  // Filtrer les items du menu
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && item.available
  })

  // Fonctions de gestion du panier
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id)
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        )
      }
      return prev.filter((item) => item.id !== itemId)
    })
  }

  const clearCart = () => {
    setCart([])
  }

  // Calculer le total du panier
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0)

  // Passer une commande
  const placeOrder = async () => {
    if (cart.length === 0) return

    setLoading(true)
    try {
      // Simuler l'API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newOrder: Order = {
        id: `ORD${String(orders.length + 1).padStart(3, '0')}`,
        items: [...cart],
        total: cartTotal,
        status: 'preparing',
        orderTime: new Date().toISOString(),
        estimatedReady: new Date(Date.now() + 15 * 60000).toISOString(), // +15 minutes
      }

      setOrders((prev) => [newOrder, ...prev])
      clearCart()
      setActiveTab('orders')
    } catch (error) {
      console.error('Erreur lors de la commande:', error)
    } finally {
      setLoading(false)
    }
  }

  // Obtenir l'icône de catégorie
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coffee':
        return Coffee
      case 'tea':
        return Coffee
      case 'food':
        return Utensils
      case 'pastries':
        return Cookie
      case 'beverages':
        return Zap
      default:
        return Coffee
    }
  }

  // Obtenir le statut de commande
  const getOrderStatus = (status: string) => {
    switch (status) {
      case 'preparing':
        return {
          label: 'En préparation',
          color: 'bg-orange-100 text-orange-800',
          icon: Clock,
        }
      case 'ready':
        return {
          label: 'Prête',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
        }
      case 'delivered':
        return {
          label: 'Livrée',
          color: 'bg-blue-100 text-blue-800',
          icon: CheckCircle,
        }
      case 'cancelled':
        return { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: X }
      default:
        return {
          label: 'Inconnue',
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
        }
    }
  }

  const categories = [
    { id: 'all', label: 'Tout', icon: Coffee },
    { id: 'coffee', label: 'Cafés', icon: Coffee },
    { id: 'tea', label: 'Thés', icon: Coffee },
    { id: 'food', label: 'Repas', icon: Utensils },
    { id: 'pastries', label: 'Pâtisseries', icon: Cookie },
    { id: 'beverages', label: 'Boissons', icon: Zap },
  ]

  return (
    <ClientLayout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header avec navigation */}
        <div>
          <h1
            className="mb-2 text-2xl font-bold md:text-3xl"
            style={{ color: 'var(--color-coffee-primary)' }}
          >
            Commandes & Menu
          </h1>
          <p style={{ color: 'var(--color-client-muted)' }}>
            Découvrez notre menu et passez vos commandes
          </p>

          {/* Navigation des onglets */}
          <div className="mt-4 flex gap-2">
            <Button
              variant={activeTab === 'menu' ? 'default' : 'outline'}
              onClick={() => setActiveTab('menu')}
              style={
                activeTab === 'menu'
                  ? {
                      backgroundColor: 'var(--color-coffee-primary)',
                      borderColor: 'var(--color-coffee-primary)',
                    }
                  : {}
              }
            >
              <ChefHat className="mr-2 h-4 w-4" />
              Menu
            </Button>
            <Button
              variant={activeTab === 'cart' ? 'default' : 'outline'}
              onClick={() => setActiveTab('cart')}
              className="relative"
              style={
                activeTab === 'cart'
                  ? {
                      backgroundColor: 'var(--color-coffee-primary)',
                      borderColor: 'var(--color-coffee-primary)',
                    }
                  : {}
              }
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Panier
              {cartItemCount > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center p-0 text-xs"
                  style={{ backgroundColor: 'var(--color-coffee-accent)' }}
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'outline'}
              onClick={() => setActiveTab('orders')}
              style={
                activeTab === 'orders'
                  ? {
                      backgroundColor: 'var(--color-coffee-primary)',
                      borderColor: 'var(--color-coffee-primary)',
                    }
                  : {}
              }
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Mes commandes
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatsCard
            title="Commandes aujourd'hui"
            value="3"
            change="Total du jour"
            icon={ShoppingBag}
          />

          <StatsCard
            title="Montant dépensé"
            value="47.50€"
            change="Ce mois"
            icon={Euro}
          />

          <StatsCard
            title="Temps moyen"
            value="8 min"
            change="Préparation"
            icon={Clock}
          />

          <StatsCard
            title="Items favoris"
            value="5"
            change="Dans vos favoris"
            icon={Heart}
          />
        </div>

        {/* Contenu principal */}
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Recherche et filtres */}
              <ClientCard title="Recherche et filtres" icon={Filter}>
                <div className="space-y-4">
                  <div className="relative">
                    <Search
                      className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                      style={{ color: 'var(--color-client-muted)' }}
                    />
                    <Input
                      placeholder="Rechercher dans le menu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      style={{ backgroundColor: 'var(--color-client-bg)' }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const Icon = category.icon
                      return (
                        <Button
                          key={category.id}
                          variant={
                            selectedCategory === category.id
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                          style={
                            selectedCategory === category.id
                              ? {
                                  backgroundColor:
                                    'var(--color-coffee-primary)',
                                  borderColor: 'var(--color-coffee-primary)',
                                }
                              : {}
                          }
                        >
                          <Icon className="mr-1 h-4 w-4" />
                          {category.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </ClientCard>

              {/* Menu items */}
              <ClientCard
                title="Notre menu"
                description={`${filteredItems.length} article${filteredItems.length > 1 ? 's' : ''} disponible${filteredItems.length > 1 ? 's' : ''}`}
                icon={ChefHat}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredItems.map((item, index) => {
                    const Icon = getCategoryIcon(item.category)
                    const cartItem = cart.find(
                      (cartItem) => cartItem.id === item.id
                    )

                    return (
                      <motion.div
                        key={item.id}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.1 }}
                        className="space-y-3 rounded-lg border p-4"
                        style={{
                          borderColor: 'var(--color-client-border)',
                          backgroundColor: 'var(--color-client-bg)',
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Icon
                                className="h-4 w-4"
                                style={{ color: 'var(--color-coffee-primary)' }}
                              />
                              <h3
                                className="font-semibold"
                                style={{ color: 'var(--color-client-text)' }}
                              >
                                {item.name}
                              </h3>
                              {item.popular && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                  style={{
                                    backgroundColor:
                                      'var(--color-coffee-accent)',
                                    color: 'white',
                                  }}
                                >
                                  <Star className="mr-1 h-3 w-3" />
                                  Populaire
                                </Badge>
                              )}
                            </div>
                            <p
                              className="mb-2 text-sm"
                              style={{ color: 'var(--color-client-muted)' }}
                            >
                              {item.description}
                            </p>
                            <div
                              className="flex items-center gap-4 text-xs"
                              style={{ color: 'var(--color-client-muted)' }}
                            >
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.preparationTime} min
                              </span>
                              {item.rating && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                                  {item.rating}
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className="text-lg font-bold"
                            style={{ color: 'var(--color-coffee-primary)' }}
                          >
                            {item.price.toFixed(2)}€
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            {item.allergens && item.allergens.length > 0 && (
                              <p
                                className="text-xs"
                                style={{ color: 'var(--color-client-muted)' }}
                              >
                                Allergènes: {item.allergens.join(', ')}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {cartItem ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span
                                  className="min-w-[20px] text-center font-semibold"
                                  style={{ color: 'var(--color-client-text)' }}
                                >
                                  {cartItem.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addToCart(item)}
                                style={{
                                  borderColor: 'var(--color-coffee-primary)',
                                  color: 'var(--color-coffee-primary)',
                                }}
                              >
                                <Plus className="mr-1 h-4 w-4" />
                                Ajouter
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </ClientCard>
            </motion.div>
          )}

          {activeTab === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ClientCard
                title="Votre panier"
                description={`${cartItemCount} article${cartItemCount > 1 ? 's' : ''} • Total: ${cartTotal.toFixed(2)}€`}
                icon={ShoppingCart}
              >
                {cart.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingCart
                      className="mx-auto mb-4 h-16 w-16"
                      style={{ color: 'var(--color-coffee-muted)' }}
                    />
                    <h3
                      className="mb-2 text-lg font-medium"
                      style={{ color: 'var(--color-client-text)' }}
                    >
                      Votre panier est vide
                    </h3>
                    <p style={{ color: 'var(--color-client-muted)' }}>
                      Ajoutez des articles depuis le menu
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setActiveTab('menu')}
                      style={{
                        backgroundColor: 'var(--color-coffee-primary)',
                        borderColor: 'var(--color-coffee-primary)',
                      }}
                    >
                      Voir le menu
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                          style={{
                            borderColor: 'var(--color-client-border)',
                            backgroundColor: 'var(--color-client-bg)',
                          }}
                        >
                          <div className="flex-1">
                            <h3
                              className="font-semibold"
                              style={{ color: 'var(--color-client-text)' }}
                            >
                              {item.name}
                            </h3>
                            <p
                              className="text-sm"
                              style={{ color: 'var(--color-client-muted)' }}
                            >
                              {item.price.toFixed(2)}€ × {item.quantity}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div
                              className="font-semibold"
                              style={{ color: 'var(--color-coffee-primary)' }}
                            >
                              {(item.price * item.quantity).toFixed(2)}€
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span
                                className="min-w-[20px] text-center font-semibold"
                                style={{ color: 'var(--color-client-text)' }}
                              >
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addToCart(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      className="border-t pt-4"
                      style={{ borderColor: 'var(--color-client-border)' }}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <span
                          className="text-lg font-semibold"
                          style={{ color: 'var(--color-client-text)' }}
                        >
                          Total:
                        </span>
                        <span
                          className="text-xl font-bold"
                          style={{ color: 'var(--color-coffee-primary)' }}
                        >
                          {cartTotal.toFixed(2)}€
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={clearCart}
                          className="flex-1"
                        >
                          Vider le panier
                        </Button>
                        <Button
                          onClick={placeOrder}
                          disabled={loading}
                          className="flex-1"
                          style={{
                            backgroundColor: 'var(--color-coffee-primary)',
                            borderColor: 'var(--color-coffee-primary)',
                          }}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Commande...
                            </>
                          ) : (
                            'Commander'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </ClientCard>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ClientCard
                title="Mes commandes"
                description={`${orders.length} commande${orders.length > 1 ? 's' : ''} au total`}
                icon={ShoppingBag}
              >
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingBag
                      className="mx-auto mb-4 h-16 w-16"
                      style={{ color: 'var(--color-coffee-muted)' }}
                    />
                    <h3
                      className="mb-2 text-lg font-medium"
                      style={{ color: 'var(--color-client-text)' }}
                    >
                      Aucune commande
                    </h3>
                    <p style={{ color: 'var(--color-client-muted)' }}>
                      Vous n&apos;avez pas encore passé de commande
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const statusInfo = getOrderStatus(order.status)
                      const StatusIcon = statusInfo.icon

                      return (
                        <div
                          key={order.id}
                          className="rounded-lg border p-4"
                          style={{
                            borderColor: 'var(--color-client-border)',
                            backgroundColor: 'var(--color-client-bg)',
                          }}
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <div className="mb-1 flex items-center gap-2">
                                <h3
                                  className="font-semibold"
                                  style={{ color: 'var(--color-client-text)' }}
                                >
                                  Commande #{order.id}
                                </h3>
                                <Badge
                                  className={`text-xs ${statusInfo.color}`}
                                >
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <p
                                className="text-sm"
                                style={{ color: 'var(--color-client-muted)' }}
                              >
                                {new Date(order.orderTime).toLocaleString(
                                  'fr-FR'
                                )}
                              </p>
                              {order.estimatedReady &&
                                order.status === 'preparing' && (
                                  <p
                                    className="text-sm"
                                    style={{
                                      color: 'var(--color-coffee-accent)',
                                    }}
                                  >
                                    Prête vers{' '}
                                    {new Date(
                                      order.estimatedReady
                                    ).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                )}
                            </div>
                            <div
                              className="text-lg font-bold"
                              style={{ color: 'var(--color-coffee-primary)' }}
                            >
                              {order.total.toFixed(2)}€
                            </div>
                          </div>

                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div
                                key={`${order.id}-${item.id}`}
                                className="flex items-center justify-between text-sm"
                              >
                                <span
                                  style={{ color: 'var(--color-client-text)' }}
                                >
                                  {item.name} × {item.quantity}
                                </span>
                                <span
                                  style={{ color: 'var(--color-client-muted)' }}
                                >
                                  {(item.price * item.quantity).toFixed(2)}€
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ClientCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </ClientLayout>
  )
}
