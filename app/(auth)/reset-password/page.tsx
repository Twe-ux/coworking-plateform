'use client'

import {
  Alert,
  AlertDescription,
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
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Check, Eye, EyeOff, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Schéma de validation Zod
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const password = form.watch('password')

  // Validation de mot de passe en temps réel
  const passwordValidation = {
    length: password?.length >= 8,
    uppercase: /[A-Z]/.test(password || ''),
    lowercase: /[a-z]/.test(password || ''),
    number: /[0-9]/.test(password || ''),
  }

  // Vérifier la validité du token au chargement de la page
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValidToken(false)
        setError('Token de réinitialisation manquant.')
        return
      }

      try {
        const response = await fetch(`/api/verify-reset-token?token=${token}`)

        if (response.ok) {
          setIsValidToken(true)
        } else {
          setIsValidToken(false)
          const errorData = await response.json()
          setError(
            errorData.message || 'Token de réinitialisation invalide ou expiré.'
          )
        }
      } catch (err) {
        setIsValidToken(false)
        setError('Erreur lors de la vérification du token.')
      }
    }

    verifyToken()
  }, [token])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Token de réinitialisation manquant.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      })

      if (response.ok) {
        setSuccess(
          'Votre mot de passe a été réinitialisé avec succès ! Vous allez être redirigé vers la page de connexion.'
        )
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        const errorData = await response.json()
        setError(
          errorData.message ||
            'Une erreur est survenue lors de la réinitialisation.'
        )
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const ValidationIcon = ({ isValid }: { isValid: boolean }) =>
    isValid ? (
      <Check className="h-3 w-3 text-green-600" />
    ) : (
      <X className="h-3 w-3 text-red-500" />
    )

  // Affichage pendant la vérification du token
  if (isValidToken === null) {
    return (
      <>
        <CardHeader className="space-y-1 pb-4 text-center">
          <CardTitle className="text-2xl font-bold">
            Réinitialisation du mot de passe
          </CardTitle>
          <CardDescription>
            Vérification du lien de réinitialisation...
          </CardDescription>
        </CardHeader>

        <CardContent className="py-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-gray-600">Vérification en cours...</p>
        </CardContent>
      </>
    )
  }

  // Affichage si le token est invalide
  if (!isValidToken) {
    return (
      <>
        <CardHeader className="space-y-1 pb-4 text-center">
          <CardTitle className="text-2xl font-bold">Lien invalide</CardTitle>
          <CardDescription>
            Ce lien de réinitialisation n'est pas valide
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Le lien de réinitialisation est peut-être expiré ou a déjà été
              utilisé.
            </p>

            <div className="space-y-2">
              <Link href="/forgot-password">
                <Button className="w-full">Demander un nouveau lien</Button>
              </Link>

              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </>
    )
  }

  return (
    <>
      <CardHeader className="space-y-1 pb-4 text-center">
        <CardTitle className="text-2xl font-bold">
          Nouveau mot de passe
        </CardTitle>
        <CardDescription>
          Créez un nouveau mot de passe sécurisé pour votre compte
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Check className="h-4 w-4" />
            <AlertDescription className="ml-2">{success}</AlertDescription>
          </Alert>
        )}

        {!success && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Créer un nouveau mot de passe"
                          className="h-11 pr-10"
                          disabled={isLoading}
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>

                    {/* Indicateurs de validation du mot de passe */}
                    {password && (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <ValidationIcon isValid={passwordValidation.length} />
                          <span
                            className={
                              passwordValidation.length
                                ? 'text-green-600'
                                : 'text-red-500'
                            }
                          >
                            Au moins 8 caractères
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ValidationIcon
                            isValid={passwordValidation.uppercase}
                          />
                          <span
                            className={
                              passwordValidation.uppercase
                                ? 'text-green-600'
                                : 'text-red-500'
                            }
                          >
                            Une lettre majuscule
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ValidationIcon
                            isValid={passwordValidation.lowercase}
                          />
                          <span
                            className={
                              passwordValidation.lowercase
                                ? 'text-green-600'
                                : 'text-red-500'
                            }
                          >
                            Une lettre minuscule
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ValidationIcon isValid={passwordValidation.number} />
                          <span
                            className={
                              passwordValidation.number
                                ? 'text-green-600'
                                : 'text-red-500'
                            }
                          >
                            Un chiffre
                          </span>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirmer votre nouveau mot de passe"
                          className="h-11 pr-10"
                          disabled={isLoading}
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-11 w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Réinitialisation en cours...
                  </>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </Button>
            </form>
          </Form>
        )}

        {!success && (
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              Retour à la connexion
            </Link>
          </div>
        )}
      </CardContent>
    </>
  )
}
