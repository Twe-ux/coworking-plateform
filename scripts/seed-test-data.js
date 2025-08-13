/**
 * Script pour créer des données de test (employés et shifts)
 * Usage: node scripts/seed-test-data.js
 */

const dbConnect = require('../lib/mongodb').default
const Employee = require('../lib/models/employee').default
const Shift = require('../lib/models/shift').default

async function seedTestData() {
  try {
    await dbConnect()
    console.log('🔗 Connexion MongoDB établie')

    // Créer des employés de test
    const employees = [
      {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@coworking.com',
        phone: '01 23 45 67 89',
        role: 'Manager',
        color: 'bg-blue-500',
        startDate: new Date('2024-01-15'),
        isActive: true
      },
      {
        firstName: 'Sarah',
        lastName: 'Martin',
        email: 'sarah.martin@coworking.com',
        phone: '01 23 45 67 90',
        role: 'Reception',
        color: 'bg-green-500',
        startDate: new Date('2024-02-01'),
        isActive: true
      },
      {
        firstName: 'Pierre',
        lastName: 'Bernard',
        email: 'pierre.bernard@coworking.com',
        phone: '01 23 45 67 91',
        role: 'Security',
        color: 'bg-purple-500',
        startDate: new Date('2024-01-20'),
        isActive: true
      }
    ]

    // Nettoyer les données existantes
    await Employee.deleteMany({})
    await Shift.deleteMany({})
    console.log('🧹 Données existantes supprimées')

    // Créer les employés
    const createdEmployees = await Employee.create(employees)
    console.log(`👥 ${createdEmployees.length} employés créés`)

    // Créer des shifts de test pour cette semaine
    const today = new Date()
    const shifts = []

    // Créer des shifts pour les 7 prochains jours
    for (let i = 0; i < 7; i++) {
      const shiftDate = new Date(today)
      shiftDate.setDate(today.getDate() + i)

      // Shift matin pour Jean (Manager)
      shifts.push({
        employeeId: createdEmployees[0]._id,
        date: new Date(shiftDate),
        startTime: '08:00',
        endTime: '12:00',
        type: 'morning',
        location: 'Reception',
        notes: 'Gestion équipe matin',
        isActive: true
      })

      // Shift après-midi pour Sarah (Reception) si ce n'est pas dimanche
      if (shiftDate.getDay() !== 0) {
        shifts.push({
          employeeId: createdEmployees[1]._id,
          date: new Date(shiftDate),
          startTime: '12:00',
          endTime: '18:00',
          type: 'afternoon',
          location: 'Reception',
          notes: 'Accueil clients',
          isActive: true
        })
      }

      // Shift soir pour Pierre (Security) du lundi au vendredi
      if (shiftDate.getDay() >= 1 && shiftDate.getDay() <= 5) {
        shifts.push({
          employeeId: createdEmployees[2]._id,
          date: new Date(shiftDate),
          startTime: '18:00',
          endTime: '22:00',
          type: 'evening',
          location: 'Security Desk',
          notes: 'Surveillance bâtiment',
          isActive: true
        })
      }
    }

    // Créer les shifts
    const createdShifts = await Shift.create(shifts)
    console.log(`📅 ${createdShifts.length} shifts créés`)

    console.log('\n✅ Données de test créées avec succès !')
    console.log('\n📊 Résumé :')
    console.log(`   - ${createdEmployees.length} employés`)
    console.log(`   - ${createdShifts.length} shifts`)
    console.log('   - Shifts pour les 7 prochains jours')
    console.log('\n🎯 Vous pouvez maintenant tester le planning !')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error)
    process.exit(1)
  }
}

// Exécuter le script
seedTestData()