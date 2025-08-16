'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, User, Mail, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface FormData {
  nom: string
  email: string
  typeDemdande: string
  objet: string
  message: string
  accepteCGU: boolean
}

export function ContactDPOForm() {
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    email: '',
    typeDemdande: '',
    objet: '',
    message: '',
    accepteCGU: false
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<Partial<FormData>>({})

  const typesDemandeOptions = [
    { value: '', label: 'Sélectionnez le type de demande' },
    { value: 'acces', label: '📋 Droit d\'accès - Consulter mes données' },
    { value: 'rectification', label: '✏️ Droit de rectification - Corriger mes données' },
    { value: 'effacement', label: '🗑️ Droit à l\'effacement - Supprimer mes données' },
    { value: 'limitation', label: '⏸️ Droit à la limitation - Suspendre le traitement' },
    { value: 'portabilite', label: '📦 Droit à la portabilité - Récupérer mes données' },
    { value: 'opposition', label: '🚫 Droit d\'opposition - M\'opposer au traitement' },
    { value: 'consentement', label: '✅ Retirer mon consentement' },
    { value: 'question', label: '❓ Question générale sur mes données' },
    { value: 'plainte', label: '⚠️ Signaler un problème de confidentialité' }
  ]

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est obligatoire'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide'
    }

    if (!formData.typeDemdande) {
      newErrors.typeDemdande = 'Veuillez sélectionner le type de demande'
    }

    if (!formData.objet.trim()) {
      newErrors.objet = 'L\'objet est obligatoire'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Le message est obligatoire'
    } else if (formData.message.length < 10) {
      newErrors.message = 'Le message doit contenir au moins 10 caractères'
    }

    if (!formData.accepteCGU) {
      newErrors.accepteCGU = 'Vous devez accepter les conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // Simulation d'envoi (à remplacer par votre API)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Ici vous intégreriez votre service d'email
      console.log('Données du formulaire DPO:', formData)
      
      setSubmitStatus('success')
      
      // Reset du formulaire après succès
      setFormData({
        nom: '',
        email: '',
        typeDemdande: '',
        objet: '',
        message: '',
        accepteCGU: false
      })
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
            <Mail className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Contactez notre DPO
          </h3>
          <p className="text-gray-600">
            Exercez vos droits RGPD ou posez vos questions sur la protection de vos données
          </p>
        </div>

        {submitStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3"
          >
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold">Message envoyé avec succès !</p>
              <p className="text-sm">Nous vous répondrons dans un délai de 1 mois maximum.</p>
            </div>
          </motion.div>
        )}

        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3"
          >
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-semibold">Erreur lors de l'envoi</p>
              <p className="text-sm">Veuillez réessayer ou nous contacter directement par email.</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom */}
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-2" />
              Nom complet *
            </label>
            <input
              type="text"
              id="nom"
              value={formData.nom}
              onChange={(e) => handleInputChange('nom', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.nom ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Votre nom et prénom"
            />
            {errors.nom && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.nom}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-2" />
              Adresse email *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="votre.email@exemple.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Type de demande */}
          <div>
            <label htmlFor="typeDemdande" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-2" />
              Type de demande *
            </label>
            <select
              id="typeDemdande"
              value={formData.typeDemdande}
              onChange={(e) => handleInputChange('typeDemdande', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.typeDemdande ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              {typesDemandeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.typeDemdande && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.typeDemdande}
              </p>
            )}
          </div>

          {/* Objet */}
          <div>
            <label htmlFor="objet" className="block text-sm font-medium text-gray-700 mb-2">
              Objet de votre demande *
            </label>
            <input
              type="text"
              id="objet"
              value={formData.objet}
              onChange={(e) => handleInputChange('objet', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.objet ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Résumé de votre demande en quelques mots"
            />
            {errors.objet && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.objet}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message détaillé *
            </label>
            <textarea
              id="message"
              rows={6}
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${
                errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Décrivez précisément votre demande. Plus vous serez détaillé(e), plus nous pourrons vous aider efficacement."
            />
            <div className="flex justify-between items-center mt-1">
              {errors.message ? (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.message}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Minimum 10 caractères
                </p>
              )}
              <p className="text-sm text-gray-500">
                {formData.message.length} caractères
              </p>
            </div>
          </div>

          {/* Acceptation CGU */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.accepteCGU}
                onChange={(e) => handleInputChange('accepteCGU', e.target.checked)}
                className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border rounded ${
                  errors.accepteCGU ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <span className="text-sm text-gray-700">
                J'accepte que mes données soient traitées dans le cadre de cette demande conformément à notre{' '}
                <a href="/cgu" className="text-blue-600 hover:underline">politique de confidentialité</a>.
                Ces données seront conservées uniquement le temps nécessaire au traitement de ma demande. *
              </span>
            </label>
            {errors.accepteCGU && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.accepteCGU}
              </p>
            )}
          </div>

          {/* Bouton d'envoi */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:scale-[1.02]'
            }`}
            whileHover={isSubmitting ? {} : { scale: 1.02 }}
            whileTap={isSubmitting ? {} : { scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Envoyer ma demande
              </>
            )}
          </motion.button>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-blue-800 text-sm">
              <strong>Délai de réponse :</strong> 1 mois maximum (prolongeable de 2 mois si nécessaire)
              <br />
              <strong>Réponse gratuite</strong> pour toute demande légitime
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  )
}