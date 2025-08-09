'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, CreditCard, Coffee, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface PaymentMethod {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  popular?: boolean
  available: boolean
  comingSoon?: boolean
  features?: string[]
  processingTime?: string
  fees?: string
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[]
  selectedMethod: string | null
  onMethodSelect: (methodId: string) => void
  disabled?: boolean
  className?: string
  showFeatures?: boolean
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  methods,
  selectedMethod,
  onMethodSelect,
  disabled = false,
  className,
  showFeatures = true,
}) => {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)

  const handleMethodSelect = (methodId: string) => {
    const method = methods.find((m) => m.id === methodId)
    if (method?.available && !disabled) {
      onMethodSelect(methodId)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-coffee-primary text-lg font-semibold">
          Méthode de paiement
        </h3>
        <span className="text-coffee-primary/60 text-sm">
          {methods.filter((m) => m.available).length} méthode
          {methods.filter((m) => m.available).length > 1 ? 's' : ''} disponible
          {methods.filter((m) => m.available).length > 1 ? 's' : ''}
        </span>
      </div>

      <RadioGroup
        value={selectedMethod || ''}
        onValueChange={handleMethodSelect}
        className="space-y-3"
        disabled={disabled}
        aria-label="Sélectionner une méthode de paiement"
      >
        <AnimatePresence mode="popLayout">
          {methods.map((method, index) => {
            const isSelected = selectedMethod === method.id
            const isDisabled = !method.available || disabled
            const isHovered = hoveredMethod === method.id
            const IconComponent = method.icon

            return (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.3,
                  ease: 'easeOut',
                }}
                className="relative"
                onMouseEnter={() => !isDisabled && setHoveredMethod(method.id)}
                onMouseLeave={() => setHoveredMethod(null)}
              >
                <motion.label
                  htmlFor={method.id}
                  className={cn(
                    'group relative flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all duration-300',
                    {
                      'cursor-not-allowed opacity-60': isDisabled,
                      'border-coffee-primary bg-coffee-primary/10 ring-coffee-primary/20 shadow-lg ring-2':
                        isSelected,
                      'hover:border-coffee-primary/50 hover:bg-coffee-primary/5 border-gray-200 bg-white':
                        !isSelected && !isDisabled,
                      'border-gray-200 bg-gray-50': isDisabled,
                    }
                  )}
                  whileHover={!isDisabled ? { scale: 1.01 } : {}}
                  whileTap={!isDisabled ? { scale: 0.99 } : {}}
                  role="radio"
                  aria-checked={isSelected}
                  aria-describedby={`${method.id}-description`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                      e.preventDefault()
                      handleMethodSelect(method.id)
                    }
                  }}
                >
                  {/* Radio Button */}
                  <div className="relative mt-1">
                    <RadioGroupItem
                      id={method.id}
                      value={method.id}
                      disabled={isDisabled}
                      className={cn(
                        'size-5 border-2 transition-all duration-200',
                        {
                          'border-coffee-primary bg-coffee-primary text-white':
                            isSelected,
                          'border-gray-300': !isSelected && !isDisabled,
                          'border-gray-200': isDisabled,
                        }
                      )}
                    />
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300',
                      {
                        'bg-coffee-primary text-white': isSelected,
                        'bg-coffee-primary/10 text-coffee-accent group-hover:bg-coffee-primary/20':
                          !isSelected && !isDisabled,
                        'bg-gray-100 text-gray-400': isDisabled,
                      }
                    )}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn('leading-none font-semibold', {
                          'text-coffee-primary': !isDisabled,
                          'text-gray-400': isDisabled,
                        })}
                      >
                        {method.name}
                      </span>

                      {method.popular && (
                        <Badge variant="secondary" className="text-xs">
                          Populaire
                        </Badge>
                      )}

                      {method.comingSoon && (
                        <Badge
                          variant="outline"
                          className="text-xs text-orange-600"
                        >
                          Prochainement
                        </Badge>
                      )}

                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-xs text-green-700"
                          >
                            Sélectionné
                          </Badge>
                        </motion.div>
                      )}
                    </div>

                    {/* Description */}
                    <p
                      id={`${method.id}-description`}
                      className={cn('text-sm leading-relaxed', {
                        'text-coffee-primary/70': !isDisabled,
                        'text-gray-400': isDisabled,
                      })}
                    >
                      {method.description}
                    </p>

                    {/* Features and details */}
                    <AnimatePresence>
                      {showFeatures &&
                        (isSelected || isHovered) &&
                        method.features && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-coffee-primary/20 mt-3 space-y-2 border-t pt-3">
                              {method.features.map((feature, idx) => (
                                <div
                                  key={idx}
                                  className="text-coffee-primary/60 flex items-center gap-2 text-sm"
                                >
                                  <Check className="h-3 w-3 text-green-600" />
                                  <span>{feature}</span>
                                </div>
                              ))}

                              {/* Additional info */}
                              <div className="text-coffee-primary/50 mt-2 flex flex-wrap gap-4 text-xs">
                                {method.processingTime && (
                                  <span>
                                    Traitement: {method.processingTime}
                                  </span>
                                )}
                                {method.fees && (
                                  <span>Frais: {method.fees}</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>

                  {/* Loading state */}
                  {disabled && isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
                      <Loader2 className="text-coffee-primary h-6 w-6 animate-spin" />
                    </div>
                  )}
                </motion.label>

                {/* Tooltip for disabled methods */}
                {!method.available && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute inset-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Cette méthode de paiement sera bientôt disponible</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </RadioGroup>

      {/* Help text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-coffee-primary/60 text-sm"
      >
        Toutes les transactions sont sécurisées et protégées.
      </motion.p>
    </div>
  )
}

export default PaymentMethodSelector
