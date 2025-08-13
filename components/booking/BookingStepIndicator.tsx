'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface BookingStep {
  id: number
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BookingStepIndicatorProps {
  steps: BookingStep[]
  currentStep: number
  completedSteps: number[]
  onStepClick?: (step: number) => void
  className?: string
  variant?: 'horizontal' | 'vertical'
  showProgress?: boolean
  allowClickNavigation?: boolean
}

const BookingStepIndicator: React.FC<BookingStepIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
  className,
  variant = 'horizontal',
  showProgress = true,
  allowClickNavigation = true,
}) => {
  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100

  const handleStepClick = (stepNumber: number) => {
    if (
      allowClickNavigation &&
      onStepClick &&
      (completedSteps.includes(stepNumber) || stepNumber <= currentStep)
    ) {
      onStepClick(stepNumber)
    }
  }

  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return 'completed'
    if (stepNumber === currentStep) return 'current'
    if (stepNumber < currentStep) return 'previous'
    return 'upcoming'
  }

  const isStepClickable = (stepNumber: number) => {
    return (
      allowClickNavigation &&
      (completedSteps.includes(stepNumber) || stepNumber <= currentStep)
    )
  }

  if (variant === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => {
          const stepNumber = step.id
          const status = getStepStatus(stepNumber)
          const isClickable = isStepClickable(stepNumber)
          const IconComponent = step.icon

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-4"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-6 h-8 w-0.5 bg-gray-200">
                  <motion.div
                    className="bg-coffee-primary h-full w-full origin-top"
                    initial={{ scaleY: 0 }}
                    animate={{
                      scaleY:
                        status === 'completed' ||
                        (status === 'current' && index < currentStep - 1)
                          ? 1
                          : 0,
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              )}

              {/* Step indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    className={cn(
                      'relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                      {
                        'border-coffee-primary bg-coffee-primary text-white shadow-lg':
                          status === 'completed',
                        'border-coffee-primary text-coffee-primary ring-coffee-primary/20 bg-white shadow-md ring-4':
                          status === 'current',
                        'border-gray-300 bg-gray-100 text-gray-400':
                          status === 'upcoming',
                        'cursor-pointer hover:scale-105': isClickable,
                        'cursor-not-allowed': !isClickable,
                      }
                    )}
                    onClick={() => handleStepClick(stepNumber)}
                    disabled={!isClickable}
                    whileHover={isClickable ? { scale: 1.05 } : {}}
                    whileTap={isClickable ? { scale: 0.95 } : {}}
                    aria-label={`Étape ${stepNumber}: ${step.title}`}
                  >
                    <AnimatePresence mode="wait">
                      {status === 'completed' ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check className="h-6 w-6" />
                        </motion.div>
                      ) : IconComponent ? (
                        <motion.div
                          key="icon"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <IconComponent className="h-6 w-6" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="number"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className="font-bold"
                        >
                          {stepNumber}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="text-center">
                    <p className="font-medium">{step.title}</p>
                    <p className="text-xs opacity-80">{step.description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Step content */}
              <div className="min-w-0 flex-1 pb-8">
                <motion.h4
                  className={cn(
                    'font-semibold transition-colors duration-300',
                    {
                      'text-coffee-primary':
                        status === 'current' || status === 'completed',
                      'text-gray-400': status === 'upcoming',
                    }
                  )}
                  animate={{
                    scale: status === 'current' ? 1.02 : 1,
                  }}
                >
                  {step.title}
                </motion.h4>
                <p
                  className={cn('mt-1 text-sm transition-colors duration-300', {
                    'text-coffee-primary/70':
                      status === 'current' || status === 'completed',
                    'text-gray-400': status === 'upcoming',
                  })}
                >
                  {step.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="text-coffee-primary/60 flex justify-between text-sm">
            <span>
              Étape {currentStep} sur {steps.length}
            </span>
            <span>{Math.round(progressValue)}% complété</span>
          </div>
          <Progress
            value={progressValue}
            className="h-2"
            aria-label={`Progression: ${Math.round(progressValue)}%`}
          />
        </div>
      )}

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = step.id
          const status = getStepStatus(stepNumber)
          const isClickable = isStepClickable(stepNumber)
          const IconComponent = step.icon

          return (
            <div key={step.id} className="flex items-center">
              {/* Step indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    className={cn(
                      'relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 sm:h-12 sm:w-12',
                      {
                        'border-coffee-primary bg-coffee-primary text-white shadow-lg':
                          status === 'completed',
                        'border-coffee-primary text-coffee-primary ring-coffee-primary/20 bg-white shadow-md ring-2':
                          status === 'current',
                        'border-gray-300 bg-gray-100 text-gray-400':
                          status === 'upcoming',
                        'cursor-pointer hover:scale-105': isClickable,
                        'cursor-not-allowed': !isClickable,
                      }
                    )}
                    onClick={() => handleStepClick(stepNumber)}
                    disabled={!isClickable}
                    whileHover={isClickable ? { scale: 1.05 } : {}}
                    whileTap={isClickable ? { scale: 0.95 } : {}}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    aria-label={`Étape ${stepNumber}: ${step.title}`}
                  >
                    <AnimatePresence mode="wait">
                      {status === 'completed' ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                        </motion.div>
                      ) : IconComponent ? (
                        <motion.div
                          key="icon"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="number"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {stepNumber}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Pulse effect for current step */}
                    {status === 'current' && (
                      <motion.div
                        className="border-coffee-primary absolute inset-0 rounded-full border-2"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 0, 0.7],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{step.title}</p>
                    <p className="text-xs opacity-80">{step.description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="relative mx-2 h-0.5 w-12 bg-gray-200 sm:mx-4 sm:w-16">
                  <motion.div
                    className="bg-coffee-primary h-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX:
                        status === 'completed' || index < currentStep - 1
                          ? 1
                          : 0,
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                  <ChevronRight className="absolute -top-2 -right-1 h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Current step info */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <h3 className="text-coffee-primary font-semibold">
          {steps.find((s) => s.id === currentStep)?.title}
        </h3>
        <p className="text-coffee-primary/70 mt-1 text-sm">
          {steps.find((s) => s.id === currentStep)?.description}
        </p>
      </motion.div>
    </div>
  )
}

export default BookingStepIndicator
