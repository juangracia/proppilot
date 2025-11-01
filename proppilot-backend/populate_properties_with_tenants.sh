#!/bin/bash

# Script para poblar la tabla de propiedades con inquilinos usando la API REST
# Autor: PropPilot System
# Fecha: $(date)

BASE_URL="http://localhost:8080/api"

echo "=== PropPilot: Poblando propiedades con inquilinos ==="
echo "Fecha: $(date)"
echo "URL Base: $BASE_URL"
echo ""

# Función para crear un inquilino
create_tenant() {
    local full_name="$1"
    local national_id="$2"
    local email="$3"
    local phone="$4"
    
    echo "Creando inquilino: $full_name..."
    
    response=$(curl -s -X POST "$BASE_URL/tenants" \
        -H "Content-Type: application/json" \
        -d "{
            \"fullName\": \"$full_name\",
            \"nationalId\": \"$national_id\",
            \"email\": \"$email\",
            \"phone\": \"$phone\"
        }")
    
    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        tenant_id=$(echo "$response" | jq -r '.id')
        echo "✅ Inquilino creado exitosamente - ID: $tenant_id"
        return $tenant_id
    else
        echo "❌ Error creando inquilino: $response"
        return 0
    fi
}

# Función para asignar inquilino a propiedad
assign_tenant_to_property() {
    local property_id="$1"
    local tenant_id="$2"
    
    echo "Asignando inquilino ID $tenant_id a propiedad ID $property_id..."
    
    # Primero obtenemos los datos de la propiedad
    property_data=$(curl -s "$BASE_URL/property-units/$property_id")
    
    if echo "$property_data" | jq -e '.id' > /dev/null 2>&1; then
        # Extraemos los datos necesarios y agregamos el tenant_id
        updated_property=$(echo "$property_data" | jq --arg tenant_id "$tenant_id" '
            {
                address: .address,
                type: .type,
                baseRentAmount: .baseRentAmount,
                leaseStartDate: .leaseStartDate,
                tenant: {id: ($tenant_id | tonumber)}
            }')
        
        response=$(curl -s -X PUT "$BASE_URL/property-units/$property_id" \
            -H "Content-Type: application/json" \
            -d "$updated_property")
        
        if echo "$response" | jq -e '.tenant.id' > /dev/null 2>&1; then
            echo "✅ Inquilino asignado exitosamente a la propiedad"
        else
            echo "❌ Error asignando inquilino: $response"
        fi
    else
        echo "❌ Error obteniendo datos de la propiedad: $property_data"
    fi
}

echo "1. Creando inquilinos..."
echo "================================"

# Crear inquilinos diversos
create_tenant "María González" "20345678" "maria.gonzalez@email.com" "+54 9 11 2345-6789"
maria_id=$?

create_tenant "Carlos Rodríguez" "30456789" "carlos.rodriguez@email.com" "+54 9 11 3456-7890"
carlos_id=$?

create_tenant "Ana Martínez" "40567890" "ana.martinez@email.com" "+54 9 11 4567-8901"
ana_id=$?

create_tenant "Luis Fernández" "50678901" "luis.fernandez@email.com" "+54 9 11 5678-9012"
luis_id=$?

create_tenant "Carmen López" "60789012" "carmen.lopez@email.com" "+54 9 11 6789-0123"
carmen_id=$?

create_tenant "Roberto Silva" "70890123" "roberto.silva@email.com" "+54 9 11 7890-1234"
roberto_id=$?

create_tenant "Patricia Morales" "80901234" "patricia.morales@email.com" "+54 9 11 8901-2345"
patricia_id=$?

create_tenant "Diego Herrera" "91012345" "diego.herrera@email.com" "+54 9 11 9012-3456"
diego_id=$?

echo ""
echo "2. Asignando inquilinos a propiedades..."
echo "========================================"

# Obtener lista de propiedades sin inquilinos
echo "Obteniendo propiedades disponibles..."
properties=$(curl -s "$BASE_URL/property-units" | jq -r '.[] | select(.tenant == null) | .id')

if [ -z "$properties" ]; then
    echo "❌ No se encontraron propiedades sin inquilinos"
    exit 1
fi

echo "Propiedades sin inquilinos encontradas:"
echo "$properties"
echo ""

# Convertir a array
property_array=($properties)
tenant_ids=($maria_id $carlos_id $ana_id $luis_id $carmen_id $roberto_id $patricia_id $diego_id)

# Asignar inquilinos a propiedades
for i in "${!property_array[@]}"; do
    if [ $i -lt ${#tenant_ids[@]} ]; then
        property_id=${property_array[$i]}
        tenant_id=${tenant_ids[$i]}
        
        if [ $tenant_id -gt 0 ]; then
            assign_tenant_to_property $property_id $tenant_id
            echo ""
        fi
    fi
done

echo ""
echo "3. Verificando resultados..."
echo "============================"

# Mostrar propiedades con inquilinos
echo "Propiedades con inquilinos asignados:"
curl -s "$BASE_URL/property-units" | jq -r '.[] | select(.tenant != null) | "ID: \(.id) - \(.address) - Inquilino: \(.tenant.fullName // "N/A")"'

echo ""
echo "Inquilinos registrados:"
curl -s "$BASE_URL/tenants" | jq -r '.[] | "ID: \(.id) - \(.fullName) - \(.email)"'

echo ""
echo "=== Proceso completado ==="
echo "Fecha de finalización: $(date)"
