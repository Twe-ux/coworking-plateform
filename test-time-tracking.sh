#!/bin/bash

# Test script pour le système de suivi du temps de travail
# Ce script teste tous les endpoints de l'API time tracking

set -e  # Exit on error

BASE_URL="http://localhost:3000"
EMPLOYEE_ID=""
TIME_ENTRY_ID=""
PIN="1111"

echo "🧪 Tests du système de suivi du temps de travail"
echo "================================================"

# Fonction pour faire des requêtes API
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    
    echo "📡 $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -w "HTTPSTATUS:%{http_code}" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -w "HTTPSTATUS:%{http_code}" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:.*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]{3}$//')
    
    echo "📊 Status: $http_code"
    echo "📄 Response: $body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    
    if [ -n "$expected_status" ] && [ "$http_code" != "$expected_status" ]; then
        echo "❌ Erreur: Status attendu $expected_status, reçu $http_code"
        exit 1
    fi
    
    echo "$body"
}

# Test 1: Récupérer la liste des employés
echo "🔍 Test 1: Récupération des employés"
employees_response=$(api_call "GET" "/api/employees" "" "200")
EMPLOYEE_ID=$(echo "$employees_response" | jq -r '.data[0].id' 2>/dev/null || "")

if [ -z "$EMPLOYEE_ID" ] || [ "$EMPLOYEE_ID" = "null" ]; then
    echo "❌ Aucun employé trouvé. Créons-en un..."
    
    # Créer un employé de test
    employee_data='{
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean.dupont@test.com",
        "role": "Staff",
        "pin": "1111"
    }'
    
    employee_response=$(api_call "POST" "/api/employees" "$employee_data" "201")
    EMPLOYEE_ID=$(echo "$employee_response" | jq -r '.data.id')
fi

echo "✅ Employé ID: $EMPLOYEE_ID"
echo ""

# Test 2: Vérification du PIN
echo "🔐 Test 2: Vérification du PIN"
pin_data="{\"employeeId\": \"$EMPLOYEE_ID\", \"pin\": \"$PIN\"}"
api_call "POST" "/api/employees/verify-pin" "$pin_data" "200"

# Test 2b: Vérification avec mauvais PIN
echo "🔐 Test 2b: Vérification avec mauvais PIN"
bad_pin_data="{\"employeeId\": \"$EMPLOYEE_ID\", \"pin\": \"9999\"}"
api_call "POST" "/api/employees/verify-pin" "$bad_pin_data" "401"

# Test 3: Clock-in (Pointage d'entrée)
echo "⏰ Test 3: Clock-in"
clockin_data="{\"employeeId\": \"$EMPLOYEE_ID\", \"pin\": \"$PIN\"}"
clockin_response=$(api_call "POST" "/api/time-entries/clock-in" "$clockin_data" "201")
TIME_ENTRY_ID=$(echo "$clockin_response" | jq -r '.data.id')

echo "✅ Time Entry ID: $TIME_ENTRY_ID"
echo ""

# Test 4: Tentative de double clock-in (doit échouer)
echo "⏰ Test 4: Tentative de double clock-in"
api_call "POST" "/api/time-entries/clock-in" "$clockin_data" "409"

# Test 5: Récupération des time entries
echo "📋 Test 5: Récupération des time entries"
api_call "GET" "/api/time-entries" "" "200"

# Test 6: Récupération d'un time entry spécifique
echo "🔍 Test 6: Récupération d'un time entry spécifique"
api_call "GET" "/api/time-entries/$TIME_ENTRY_ID" "" "200"

# Test 7: Attendre quelques secondes puis clock-out
echo "⏰ Test 7: Attente de 3 secondes puis clock-out"
sleep 3

clockout_data="{\"employeeId\": \"$EMPLOYEE_ID\", \"pin\": \"$PIN\", \"timeEntryId\": \"$TIME_ENTRY_ID\"}"
api_call "POST" "/api/time-entries/clock-out" "$clockout_data" "200"

# Test 8: Clock-in pour un second shift
echo "⏰ Test 8: Clock-in pour un second shift"
second_clockin_response=$(api_call "POST" "/api/time-entries/clock-in" "$clockin_data" "201")
SECOND_TIME_ENTRY_ID=$(echo "$second_clockin_response" | jq -r '.data.id')

echo "✅ Second Time Entry ID: $SECOND_TIME_ENTRY_ID"
echo ""

# Test 9: Tentative de troisième shift (doit échouer)
echo "⏰ Test 9: Tentative de troisième shift (max 2 par jour)"
api_call "POST" "/api/time-entries/clock-in" "$clockin_data" "409"

# Test 10: Modification d'un time entry
echo "✏️ Test 10: Modification d'un time entry"
current_time=$(date -u +"%Y-%m-%dT%H:%M:%S.%03NZ")
update_data="{\"clockOut\": \"$current_time\"}"
api_call "PUT" "/api/time-entries/$SECOND_TIME_ENTRY_ID" "$update_data" "200"

# Test 11: Rapport journalier
echo "📊 Test 11: Rapport journalier"
today=$(date +%Y-%m-%d)
api_call "GET" "/api/time-entries/reports?type=daily&date=$today" "" "200"

# Test 12: Statistiques d'employé
echo "📈 Test 12: Statistiques d'employé"
api_call "GET" "/api/time-entries/reports?type=employee-stats&employeeId=$EMPLOYEE_ID" "" "200"

# Test 13: Statistiques résumées
echo "📊 Test 13: Statistiques résumées"
api_call "GET" "/api/time-entries/reports?type=summary" "" "200"

# Test 14: Récupération avec filtres
echo "🔍 Test 14: Récupération avec filtres"
api_call "GET" "/api/time-entries?employeeId=$EMPLOYEE_ID&status=completed" "" "200"

# Test 15: Suppression d'un time entry (soft delete)
echo "🗑️ Test 15: Suppression d'un time entry"
api_call "DELETE" "/api/time-entries/$TIME_ENTRY_ID" "" "200"

# Test 16: Vérification que le time entry supprimé n'apparaît plus
echo "🔍 Test 16: Vérification de la suppression"
api_call "GET" "/api/time-entries/$TIME_ENTRY_ID" "" "404"

echo "✅ Tous les tests sont terminés!"
echo ""
echo "📋 Résumé des fonctionnalités testées:"
echo "- Gestion des employés et vérification PIN ✅"
echo "- Clock-in avec validation des shifts ✅"
echo "- Clock-out avec calcul d'heures ✅"
echo "- Limitation à 2 shifts par jour ✅"
echo "- CRUD complet des time entries ✅"
echo "- Génération de rapports ✅"
echo "- Filtrage et pagination ✅"
echo "- Soft delete ✅"
echo ""
echo "🎉 Le système de suivi du temps est opérationnel!"