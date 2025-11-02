# Bugs Encontrados - Reporte QA

## Bugs Críticos

### 1. **Grid Component - Props deprecadas (ERROR)**
- **Ubicación**: DashboardView.jsx, PaymentForm.jsx, PropertyUnitsList.jsx
- **Problema**: Grid está usando props `xs`, `sm`, `md` que fueron removidas en MUI v7
- **Error en consola**: "MUI Grid: The `xs` prop has been removed"
- **Impacto**: Errores en consola, posible comportamiento inesperado

### 2. **Atributo no-booleano en botón (WARNING)**
- **Ubicación**: Varios componentes
- **Problema**: Un atributo `true` está siendo pasado como string en lugar de booleano
- **Error en consola**: "Received `true` for a non-boolean attribute `button`"
- **Impacto**: Warning en consola, posible problema de accesibilidad

### 3. **Aria-hidden y focus (WARNING)**
- **Ubicación**: Componentes con diálogos
- **Problema**: Elemento con focus tiene un ancestro con aria-hidden
- **Error en consola**: "Blocked aria-hidden on an element because its descendant retained focus"
- **Impacto**: Problema de accesibilidad

## Bugs Funcionales Encontrados

### 4. **Búsqueda en Properties no funciona**
- **Ubicación**: PropertyUnitsList.jsx
- **Problema**: Escribí "Oak" en el campo de búsqueda pero no filtró los resultados
- **Impacto**: Funcionalidad de búsqueda no funciona
- **Nota**: Necesita más pruebas - puede que sí funcione pero no fue visible en el snapshot

### 5. **Botones "View Details" y "Edit" en Properties no tienen funcionalidad**
- **Ubicación**: PropertyUnitsList.jsx
- **Problema**: Los botones no hacen nada al hacer clic
- **Impacto**: Funcionalidad incompleta
- **Nota**: Puede ser funcionalidad pendiente de implementar

## Bugs Arreglados

### ✅ 1. **Grid Component - Props deprecadas** - ARREGLADO
- **Solución**: Cambiado de `xs={12}` a `size={{ xs: 12 }}` en todos los componentes
- **Archivos**: DashboardView.jsx, PaymentForm.jsx, PropertyUnitsList.jsx

### ✅ 2. **Atributo no-booleano en botón** - ARREGLADO
- **Solución**: Cambiado `button` prop a `component="button"` en App.jsx ListItem
- **Archivo**: App.jsx línea 198

## Bugs de UX Menores

### 6. **Mensajes de consola de desarrollo**
- **Problema**: Mensajes de React DevTools y Vite en consola
- **Impacto**: Ruido en consola (no crítico)

## Funcionalidades Probadas y Funcionando

✅ Dashboard - Navegación de cards clickables funciona
✅ Properties - Lista de propiedades se muestra correctamente
✅ Tenants - Lista de inquilinos se muestra correctamente (6 inquilinos)
✅ Tenants - Tabla y vista móvil funcionan
✅ Navigation - Menú lateral funciona correctamente
✅ Add Property Dialog - Se abre correctamente

## Próximas Pruebas Pendientes

- Probar agregar inquilino completo
- Probar editar inquilino
- Probar eliminar inquilino
- Probar formulario de pagos
- Probar validaciones de formularios
- Probar manejo de errores

