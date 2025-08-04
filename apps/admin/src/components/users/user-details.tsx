"use client"

import React from 'react'
import { 
  CalendarIcon, 
  MailIcon, 
  PhoneIcon, 
  MapPinIcon,
  ClockIcon,
  ShieldIcon,
  UserIcon,
  ActivityIcon
} from 'lucide-react'
import { User, LoginHistoryEntry } from '@/types/admin'
import { 
  Card, 
  Badge, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@coworking/ui'
import { formatDate, getStatusColor, getRoleColor } from '@/lib/utils'

interface UserDetailsProps {
  user: User
}

const InfoItem: React.FC<{
  icon: React.ReactNode
  label: string
  value: string | React.ReactNode
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 rounded-md bg-muted/50">
      {icon}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  </div>
)

const LoginHistoryTable: React.FC<{ history: LoginHistoryEntry[] }> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Aucun historique de connexion disponible</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date & Heure</TableHead>
          <TableHead>Adresse IP</TableHead>
          <TableHead>Navigateur</TableHead>
          <TableHead>Localisation</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.slice(0, 10).map((entry, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                {formatDate(entry.timestamp)}
              </div>
            </TableCell>
            <TableCell className="font-mono text-sm">
              {entry.ip}
            </TableCell>
            <TableCell className="text-sm">
              {entry.userAgent || 'N/A'}
            </TableCell>
            <TableCell>
              {entry.location ? (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3 text-muted-foreground" />
                  {entry.location}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge 
                variant={entry.success ? "default" : "destructive"}
                className="text-xs"
              >
                {entry.success ? 'Succès' : 'Échec'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export const UserDetails: React.FC<UserDetailsProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      {/* Informations principales */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Informations personnelles</h3>
            </div>

            <div className="space-y-4">
              <InfoItem
                icon={<UserIcon className="h-4 w-4 text-muted-foreground" />}
                label="Nom complet"
                value={user.name}
              />

              <InfoItem
                icon={<MailIcon className="h-4 w-4 text-muted-foreground" />}
                label="Email"
                value={
                  <div className="flex items-center gap-2">
                    {user.email}
                    {user.isEmailVerified && (
                      <Badge variant="outline" className="text-xs">
                        Vérifié
                      </Badge>
                    )}
                  </div>
                }
              />

              {user.phone && (
                <InfoItem
                  icon={<PhoneIcon className="h-4 w-4 text-muted-foreground" />}
                  label="Téléphone"
                  value={user.phone}
                />
              )}

              {user.department && (
                <InfoItem
                  icon={<MapPinIcon className="h-4 w-4 text-muted-foreground" />}
                  label="Département"
                  value={user.department}
                />
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Informations du compte</h3>
            </div>

            <div className="space-y-4">
              <InfoItem
                icon={<ShieldIcon className="h-4 w-4 text-muted-foreground" />}
                label="Rôle"
                value={
                  <Badge variant="outline" className={getRoleColor(user.role)}>
                    {user.role}
                  </Badge>
                }
              />

              <InfoItem
                icon={<ActivityIcon className="h-4 w-4 text-muted-foreground" />}
                label="Statut"
                value={
                  <Badge variant="outline" className={getStatusColor(user.status)}>
                    {user.status}
                  </Badge>
                }
              />

              <InfoItem
                icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
                label="Compte créé le"
                value={formatDate(user.createdAt)}
              />

              {user.lastLoginAt && (
                <InfoItem
                  icon={<ClockIcon className="h-4 w-4 text-muted-foreground" />}
                  label="Dernière connexion"
                  value={formatDate(user.lastLoginAt)}
                />
              )}

              <InfoItem
                icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
                label="Dernière modification"
                value={formatDate(user.updatedAt)}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Statistiques rapides */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Statistiques rapides</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {user.loginHistory?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Connexions totales
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {user.loginHistory?.filter(h => h.success).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Connexions réussies
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {user.loginHistory?.filter(h => !h.success).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Tentatives échouées
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-muted-foreground">
                Jours depuis création
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Historique des connexions */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Historique des connexions</h3>
            <Badge variant="outline">
              {user.loginHistory?.length || 0} connexions
            </Badge>
          </div>
          <LoginHistoryTable history={user.loginHistory || []} />
          {user.loginHistory && user.loginHistory.length > 10 && (
            <p className="text-sm text-muted-foreground text-center">
              Affichage des 10 connexions les plus récentes
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}