#!/bin/bash

echo "🧪 Test complet du flux de réservation..."

# Test d'authentification d'abord
echo "🔐 Test d'authentification..."
AUTH_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/authenticate" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@coworking.com", 
    "password": "testpassword123"
  }')

echo "Réponse d'authentification: $AUTH_RESPONSE"

# Test de création de réservation avec les logs détaillés
echo -e "\n📋 Test création réservation avec logs..."
BOOKING_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "spaceId": "places",
    "date": "2025-08-08T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00", 
    "duration": 2,
    "durationType": "hour",
    "guests": 1,
    "paymentMethod": "onsite",
    "notes": "Test de réservation depuis le script"
  }' \
  -w "\n\nStatus Code: %{http_code}\n")

echo "Réponse de création: $BOOKING_RESPONSE"

echo -e "\n📄 Logs du serveur:"
tail -20 /Users/twe/Developer/coworking-platform/server.log

echo -e "\n✅ Test terminé"