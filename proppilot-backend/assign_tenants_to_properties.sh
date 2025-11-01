#!/bin/bash

# Script mejorado para asignar inquilinos a propiedades usando la API REST
# Autor: PropPilot System
# Fecha: $(date)

BASE_URL="http://localhost:8080/api"

echo "=== PropPilot: Asignando inquilinos a propiedades ==="
echo "Fecha: $(date)"
echo "URL Base: $BASE_URL"
echo ""

# Función para asignar inquilino a propiedad (versión mejorada)
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
        
        echo "Enviando datos: $updated_property"
        
        response=$(curl -s -X PUT "$BASE_URL/property-units/$property_id" \
            -H "Content-Type: application/json" \
            -d "$updated_property")
        
        echo "Respuesta: $response"
        
        if echo "$response" | jq -e '.tenant.id' > /dev/null 2>&1; then
            tenant_name=$(echo "$response" | jq -r '.tenant.fullName // "N/A"')
            echo "✅ Inquilino '$tenant_name' asignado exitosamente a la propiedad"
        else
            echo "❌ Error asignando inquilino: $response"
        fi
    else
        echo "❌ Error obteniendo datos de la propiedad: $property_data"
    fi
    echo ""
}

# Obtener inquilinos disponibles (excluyendo el que ya tiene propiedades)
echo "Obteniendo inquilinos disponibles..."
tenants=$(curl -s "$BASE_URL/tenants" | jq -r '.[] | select(.id != 2) | .id')

if [ -z "$tenants" ]; then
    echo "❌ No se encontraron inquilinos disponibles"
    exit 1
fi

echo "Inquilinos disponibles: $tenants"

# Obtener propiedades sin inquilinos
echo "Obteniendo propiedades sin inquilinos..."
properties=$(curl -s "$BASE_URL/property-units" | jq -r '.[] | select(.tenant == null) | .id')

if [ -z "$properties" ]; then
    echo "❌ No se encontraron propiedades sin inquilinos"
    exit 1
fi

echo "Propiedades sin inquilinos: $properties"
echo ""

# Convertir a arrays
property_array=($properties)
tenant_array=($tenants)

echo "Iniciando asignaciones..."
echo "========================"

# Asignar inquilinos a propiedades
for i in "${!property_array[@]}"; do
    if [ $i -lt ${#tenant_array[@]} ]; then
        property_id=${property_array[$i]}
        tenant_id=${tenant_array[$i]}
        
        assign_tenant_to_property $property_id $tenant_id
    fi
done

echo ""
echo "Verificando resultados finales..."
echo "================================"

# Mostrar propiedades con inquilinos
echo "Propiedades con inquilinos asignados:"
curl -s "$BASE_URL/property-units" | jq -r '.[] | select(.tenant != null) | "ID: \(.id) - \(.address) - Inquilino: \(.tenant.fullName // "N/A")"'

echo ""
echo "=== Proceso de asignación completado ==="
echo "Fecha de finalización: $(date)"
