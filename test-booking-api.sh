#!/bin/bash

echo "🧪 Test de l'API de réservation..."

# Démarrer le serveur en arrière-plan
pnpm dev &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 5

# Tester la création d'une réservation
echo "📍 Test création réservation..."
curl -X POST "http://localhost:3000/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=test" \
  -d '{
    "spaceId": "space-1",
    "date": "2025-08-08",
    "startTime": "10:00",
    "endTime": "12:00",
    "duration": 2,
    "durationType": "hour",
    "guests": 1,
    "paymentMethod": "onsite",
    "notes": "Test booking"
  }' \
  -w "\n\nStatus: %{http_code}\n" \
  -s

echo -e "\n🔍 Vérification des logs d'erreur du serveur..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo "✅ Test terminé"