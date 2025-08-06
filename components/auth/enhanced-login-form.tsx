'use client'

import {
  Button,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/components/ui'
import { useToast } from '@/components/ui/toast'
import { getRedirectPath } from '@/lib/auth-utils-client'
import { UserRole } from '@/types/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { getSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Enhanced validation schema with more detailed messages
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email('Veuillez entrer une adresse email valide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface FormFieldState {
  isFocused: boolean
  hasValue: boolean
  isValid: boolean
}

export default function EnhancedLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [fieldStates, setFieldStates] = useState<
    Record<string, FormFieldState>
  >({
    email: { isFocused: false, hasValue: false, isValid: false },
    password: { isFocused: false, hasValue: false, isValid: false },
  })

  const callbackUrl = searchParams?.get('callbackUrl') || '/'
  const errorParam = searchParams?.get('error')

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange', // Enable real-time validation
  })

  // Handle URL error parameters with toast notifications
  useEffect(() => {
    if (errorParam) {
      let errorMessage = ''
      switch (errorParam) {
        case 'SessionExpired':
          errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.'
          break
        case 'AccessDenied':
          errorMessage = 'Accès refusé. Vérifiez vos permissions.'
          break
        default:
          errorMessage = 'Une erreur est survenue lors de la connexion.'
      }

      toast({
        variant: 'destructive',
        title: "Erreur d'authentification",
        description: errorMessage,
        duration: 6000,
      })
    }
  }, [errorParam, toast])

  // Update field states for enhanced UX (optimized with useCallback)
  const updateFieldState = useCallback(
    (fieldName: string, updates: Partial<FormFieldState>) => {
      setFieldStates((prev) => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], ...updates },
      }))
    },
    []
  )

  // Watch form values to update field states
  const emailValue = form.watch('email')
  const passwordValue = form.watch('password')

  useEffect(() => {
    const emailValid = z.string().email().safeParse(emailValue).success
    updateFieldState('email', {
      hasValue: !!emailValue,
      isValid: emailValid,
    })
  }, [emailValue, updateFieldState])

  useEffect(() => {
    const passwordValid = passwordValue && passwordValue.length >= 6
    updateFieldState('password', {
      hasValue: !!passwordValue,
      isValid: !!passwordValid,
    })
  }, [passwordValue, updateFieldState])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      console.log('Tentative de connexion avec:', data.email)
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      console.log('Résultat de signIn:', result)

      if (result?.error) {
        let errorTitle = 'Erreur de connexion'
        let errorMessage = ''

        switch (result.error) {
          case 'CredentialsSignin':
            errorMessage =
              'Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.'
            break
          case 'AccessDenied':
            errorMessage =
              "Votre compte est suspendu ou désactivé. Contactez l'administrateur."
            break
          case 'SessionRequired':
            errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.'
            break
          default:
            errorMessage =
              "Une erreur inattendue s'est produite. Veuillez réessayer."
        }

        toast({
          variant: 'destructive',
          title: errorTitle,
          description: errorMessage,
          duration: 6000,
        })
      } else if (result?.ok) {
        // Success state with animation
        setIsSuccess(true)

        toast({
          variant: 'success',
          title: 'Connexion réussie !',
          description: 'Redirection en cours...',
          duration: 3000,
        })

        // Redirection vers callbackUrl ou dashboard par défaut
        console.log(
          'Connexion réussie, redirection vers:',
          callbackUrl && callbackUrl !== '/' && !callbackUrl.includes('http')
            ? callbackUrl
            : '/dashboard'
        )
        setTimeout(() => {
          const redirectTo =
            callbackUrl && callbackUrl !== '/' && !callbackUrl.includes('http')
              ? callbackUrl
              : '/dashboard'
          console.log('Exécution de la redirection vers:', redirectTo)
          window.location.href = redirectTo
        }, 1500)
      }
    } catch (err) {
      console.error('Login error:', err)
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description:
          "Une erreur inattendue s'est produite. Veuillez réessayer.",
        duration: 6000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Memoize animation variants for performance
  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          staggerChildren: 0.1,
        },
      },
    }),
    []
  )

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }),
    []
  )

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="main"
      aria-labelledby="login-title"
    >
      <CardHeader className="space-y-1 pb-4 text-center">
        <motion.div variants={itemVariants}>
          <CardTitle id="login-title" className="text-2xl font-bold">
            {isSuccess ? 'Connexion réussie !' : 'Connexion'}
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? 'Redirection vers votre espace personnel...'
              : 'Connectez-vous à votre compte pour accéder à votre espace'}
          </CardDescription>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360, 360],
                }}
                transition={{
                  duration: 1.5,
                  times: [0, 0.5, 1],
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <CheckCircle className="h-16 w-16 text-green-500" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-center text-sm text-gray-600"
              >
                Vous allez être redirigé dans un instant...
              </motion.p>
            </motion.div>
          ) : (
            <motion.div key="form" variants={itemVariants}>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                  aria-label="Formulaire de connexion"
                  noValidate
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Email
                          {fieldStates.email.isValid && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </motion.div>
                          )}
                        </FormLabel>
                        <FormControl>
                          <motion.div
                            animate={{
                              scale: fieldStates.email.isFocused ? 1.02 : 1,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <Input
                              {...field}
                              type="email"
                              placeholder="votre@email.com"
                              className={`h-11 transition-all duration-200 ${
                                fieldStates.email.isFocused
                                  ? 'ring-coffee-primary/20 ring-2'
                                  : ''
                              }`}
                              disabled={isLoading}
                              autoComplete="email"
                              aria-describedby={
                                fieldState.error ? 'email-error' : undefined
                              }
                              aria-invalid={fieldState.error ? 'true' : 'false'}
                              onFocus={() =>
                                updateFieldState('email', { isFocused: true })
                              }
                              onBlur={() =>
                                updateFieldState('email', { isFocused: false })
                              }
                            />
                          </motion.div>
                        </FormControl>
                        <AnimatePresence>
                          {fieldState.error && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              <FormMessage id="email-error" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Mot de passe
                          {fieldStates.password.isValid && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </motion.div>
                          )}
                        </FormLabel>
                        <FormControl>
                          <motion.div
                            animate={{
                              scale: fieldStates.password.isFocused ? 1.02 : 1,
                            }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                          >
                            <Input
                              {...field}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Votre mot de passe"
                              className={`h-11 pr-10 transition-all duration-200 ${
                                fieldStates.password.isFocused
                                  ? 'ring-coffee-primary/20 ring-2'
                                  : ''
                              }`}
                              disabled={isLoading}
                              autoComplete="current-password"
                              aria-describedby={
                                fieldState.error ? 'password-error' : undefined
                              }
                              aria-invalid={fieldState.error ? 'true' : 'false'}
                              onFocus={() =>
                                updateFieldState('password', {
                                  isFocused: true,
                                })
                              }
                              onBlur={() =>
                                updateFieldState('password', {
                                  isFocused: false,
                                })
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                              aria-label={
                                showPassword
                                  ? 'Masquer le mot de passe'
                                  : 'Afficher le mot de passe'
                              }
                            >
                              <motion.div
                                animate={{ rotate: showPassword ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </motion.div>
                            </Button>
                          </motion.div>
                        </FormControl>
                        <AnimatePresence>
                          {fieldState.error && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              <FormMessage id="password-error" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between text-sm">
                    <Link
                      href="/forgot-password"
                      className="text-coffee-primary hover:text-coffee-accent transition-colors hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="from-coffee-primary to-coffee-accent h-11 w-full bg-gradient-to-r"
                      disabled={isLoading}
                      aria-describedby="submit-button-description"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connexion en cours...
                        </>
                      ) : (
                        'Se connecter'
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background text-muted-foreground px-2">
                    Ou
                  </span>
                </div>
              </div>

              <div className="text-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Pas encore de compte ?{' '}
                </span>
                <Link
                  href="/register"
                  className="text-coffee-primary hover:text-coffee-accent font-medium transition-colors hover:underline"
                >
                  Créer un compte
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {/* Screen reader descriptions */}
      <div className="sr-only">
        <div id="submit-button-description">
          Soumettre le formulaire de connexion avec vos identifiants
        </div>
      </div>
    </motion.div>
  )
}
