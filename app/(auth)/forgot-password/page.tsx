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
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Schema de validation Zod
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email('Veuillez entrer une adresse email valide'),
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
      const response = await fetch('/api/forgot-password', {
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
        setError(
          errorData.message || 'Une erreur est survenue. Veuillez réessayer.'
        )
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <CardHeader className="space-y-1 pb-4 text-center">
        <CardTitle className="text-2xl font-bold">
          Mot de passe oublié
        </CardTitle>
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
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
            <Mail className="h-4 w-4 text-emerald-600" />
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
                    <FormLabel className="text-gray-700">
                      Adresse email
                    </FormLabel>
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
                className="h-11 w-full"
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
              <span className="bg-background text-muted-foreground px-2">
                Ou
              </span>
            </div>
          </div>

          <div className="space-y-2 text-center">
            <Link
              href="/login"
              className="text-coffee-accent hover:text-coffee-primary inline-flex items-center text-sm hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Pas encore de compte ? </span>
            <Link
              href="/register"
              className="text-coffee-accent hover:text-coffee-primary font-medium hover:underline"
            >
              Créer un compte
            </Link>
          </div>
        </div>

        {success && (
          <div className="border-coffee-primary/20 bg-coffee-primary/5 mt-6 rounded-lg border p-4">
            <div className="text-coffee-accent text-sm">
              <p className="mb-2 font-medium">Que faire ensuite ?</p>
              <ul className="space-y-1 text-xs">
                <li>• Vérifiez votre boîte email (y compris les spams)</li>
                <li>• Cliquez sur le lien dans l&apos;email reçu</li>
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
