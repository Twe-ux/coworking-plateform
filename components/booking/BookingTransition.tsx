'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BookingTransitionProps {
  currentStep: number
  totalSteps: number
  onNext?: () => void
  onPrevious?: () => void
  onCancel?: () => void
  isLoading?: boolean
  canGoNext?: boolean
  canGoPrevious?: boolean
  nextButtonText?: string
  previousButtonText?: string
  className?: string
  showStepAnimation?: boolean
}

const BookingTransition: React.FC<BookingTransitionProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onCancel,
  isLoading = false,
  canGoNext = true,
  canGoPrevious = true,
  nextButtonText = 'Suivant',
  previousButtonText = 'Précédent',
  className,
  showStepAnimation = true,
}) => {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  const getNextButtonText = () => {
    if (isLoading) return 'Chargement...'
    if (isLastStep) return 'Confirmer'
    return nextButtonText
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  }

  const slideVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Step transition animation */}
      {showStepAnimation && (
        <motion.div
          className="text-center"
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-coffee-primary/10 inline-flex items-center gap-2 rounded-full px-4 py-2"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 0.5,
              ease: 'easeInOut',
            }}
          >
            <span className="text-coffee-primary text-sm font-medium">
              Étape {currentStep} sur {totalSteps}
            </span>
          </motion.div>
        </motion.div>
      )}

      {/* Navigation buttons */}
      <motion.div
        className="flex items-center justify-between gap-4"
        variants={slideVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        {/* Previous button */}
        <AnimatePresence mode="wait">
          {!isFirstStep ? (
            <motion.div
              key="previous-button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                onClick={onPrevious}
                disabled={!canGoPrevious || isLoading}
                className="flex items-center gap-2 px-6 py-3"
              >
                <ArrowLeft className="h-4 w-4" />
                {previousButtonText}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="cancel-button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
                className="px-6 py-3 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <motion.div
          className="flex items-center gap-2"
          animate={{ scale: currentStep === totalSteps ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <motion.div
              key={step}
              className={cn(
                'h-2 w-8 rounded-full transition-all duration-300',
                {
                  'bg-coffee-primary': step <= currentStep,
                  'bg-gray-200': step > currentStep,
                }
              )}
              initial={{ scale: 0 }}
              animate={{
                scale: 1,
                backgroundColor: step <= currentStep ? '#8B4513' : '#E5E7EB',
              }}
              transition={{ delay: step * 0.1 }}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </motion.div>

        {/* Next button */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={onNext}
            disabled={!canGoNext || isLoading}
            className={cn(
              'relative flex items-center gap-2 overflow-hidden px-8 py-3',
              {
                'bg-green-600 hover:bg-green-700': isLastStep,
                'bg-coffee-primary hover:bg-coffee-primary/90': !isLastStep,
              }
            )}
          >
            {/* Loading state */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Chargement...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2"
                >
                  <span>{getNextButtonText()}</span>
                  {!isLastStep && <ArrowRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success animation for last step */}
            {isLastStep && !isLoading && (
              <motion.div
                className="absolute inset-0 bg-green-500"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 0], opacity: [0, 0.3, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            )}
          </Button>
        </motion.div>
      </motion.div>

      {/* Step-specific hints */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center"
        >
          {currentStep === 1 && (
            <p className="text-coffee-primary/60 text-sm">
              Sélectionnez l'espace qui correspond à vos besoins
            </p>
          )}
          {currentStep === 2 && (
            <p className="text-coffee-primary/60 text-sm">
              Choisissez votre créneau horaire
            </p>
          )}
          {currentStep === 3 && (
            <p className="text-coffee-primary/60 text-sm">
              Sélectionnez votre méthode de paiement préférée
            </p>
          )}
          {currentStep === 4 && (
            <p className="text-coffee-primary/60 text-sm">
              Vérifiez vos informations avant de confirmer
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default BookingTransition
