"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import {
  Button,
  Input,
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
  Alert,
  AlertDescription
} from '@coworking/ui'

// Schéma de validation Zod
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Veuillez entrer une adresse email valide"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      })

      if (response.ok) {
        setSuccess(
          'Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation dans quelques minutes. Vérifiez également votre dossier de courriers indésirables.'
        )
        form.reset()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Une erreur est survenue. Veuillez réessayer.')
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <CardHeader className="space-y-1 text-center pb-4">
        <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
        <CardDescription>
          Entrez votre adresse email pour recevoir un lien de réinitialisation
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
            <Mail className="h-4 w-4" />
            <AlertDescription className="ml-2">{success}</AlertDescription>
          </Alert>
        )}

        {!success && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="votre@email.com"
                        className="h-11"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </Button>
            </form>
          </Form>
        )}

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Pas encore de compte ?{' '}
            </span>
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
            >
              Créer un compte
            </Link>
          </div>
        </div>

        {success && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-2">Que faire ensuite ?</p>
              <ul className="space-y-1 text-xs">
                <li>• Vérifiez votre boîte email (y compris les spams)</li>
                <li>• Cliquez sur le lien dans l'email reçu</li>
                <li>• Créez un nouveau mot de passe sécurisé</li>
                <li>• Le lien expire dans 24 heures</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </>
  )
}