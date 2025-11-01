import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('es') // Default to Spanish
  const [currency, setCurrency] = useState('ARS') // Default to Argentine Peso

  const translations = {
    es: {
      // Header
      appTitle: 'PropPilot',
      appSubtitle: 'Gestión de Propiedades de Alquiler',
      
      // Tabs
      propertyUnits: 'UNIDADES DE PROPIEDAD',
      registerPayment: 'REGISTRAR PAGO',
      tenants: 'INQUILINOS',
      
      // Property List
      propertyUnitsTitle: 'Unidades de Propiedad',
      addProperty: 'AGREGAR PROPIEDAD',
      searchPlaceholder: 'Buscar por dirección...',
      
      // Table Headers
      id: 'ID',
      address: 'Dirección',
      type: 'Tipo',
      baseRent: 'Alquiler Base',
      leaseStart: 'Inicio Contrato',
      tenant: 'Inquilino',
      noTenant: 'Sin Inquilino',
      
      // Property Types
      apartment: 'Departamento',
      house: 'Casa',
      duplex: 'Duplex',
      ph: 'PH (Propiedad Horizontal)',
      studio: 'Estudio',
      loft: 'Loft',
      townhouse: 'Casa Adosada',
      
      // Add Property Dialog
      addNewProperty: 'Agregar Nueva Propiedad',
      addressLabel: 'Dirección',
      addressPlaceholder: 'Ej: Calle Principal 1234, Barrio Centro',
      addressHelper: 'Dirección completa de la propiedad',
      propertyTypeLabel: 'Tipo de Propiedad',
      selectPropertyType: 'Seleccionar tipo de propiedad',
      baseRentLabel: 'Alquiler Base',
      baseRentPlaceholder: 'Ej: 85000',
      baseRentHelper: 'Monto mensual',
      leaseStartLabel: 'Fecha de Inicio del Contrato',
      leaseStartHelper: 'Fecha de inicio del contrato de alquiler',
      
      // Dialog Actions
      cancel: 'CANCELAR',
      addPropertyAction: 'AGREGAR PROPIEDAD',
      
      // Messages
      totalUnits: 'Total: {count} unidade{plural} de propiedad',
      loading: 'Cargando...',
      errorOccurred: 'Ocurrió un error',
      
      // Tenant Management
      tenantsTitle: 'Inquilinos',
      addTenant: 'AGREGAR INQUILINO',
      editTenant: 'EDITAR INQUILINO',
      deleteTenant: 'ELIMINAR INQUILINO',
      fullName: 'Nombre Completo',
      nationalId: 'DNI/CUIT',
      email: 'Email',
      phone: 'Teléfono',
      actions: 'Acciones',
      edit: 'Editar',
      delete: 'Eliminar',
      save: 'GUARDAR',
      addNewTenant: 'Agregar Nuevo Inquilino',
      editTenantTitle: 'Editar Inquilino',
      fullNameLabel: 'Nombre Completo',
      fullNamePlaceholder: 'Ej: Juan Carlos Pérez',
      nationalIdLabel: 'DNI/CUIT',
      nationalIdPlaceholder: 'Ej: 12345678',
      emailLabel: 'Email',
      emailPlaceholder: 'Ej: juan.perez@email.com',
      phoneLabel: 'Teléfono',
      phonePlaceholder: 'Ej: +54 9 11 1234-5678',
      confirmDelete: '¿Estás seguro de que deseas eliminar este inquilino?',
      confirmDeleteMessage: 'Esta acción no se puede deshacer.',
      tenantCreatedSuccess: '¡Inquilino creado exitosamente!',
      tenantUpdatedSuccess: '¡Inquilino actualizado exitosamente!',
      tenantDeletedSuccess: '¡Inquilino eliminado exitosamente!',
      failedToCreateTenant: 'Error al crear el inquilino',
      failedToUpdateTenant: 'Error al actualizar el inquilino',
      failedToDeleteTenant: 'Error al eliminar el inquilino',
      duplicateNationalId: 'Ya existe un inquilino con este DNI/CUIT',
      duplicateEmail: 'Ya existe un inquilino con este email',
      totalTenants: 'Total: {count} inquilino{plural}',
      
      // Property Management
      deleteProperty: 'ELIMINAR PROPIEDAD',
      confirmDeleteProperty: '¿Estás seguro de que deseas eliminar esta propiedad?',
      confirmDeletePropertyMessage: 'Esta acción no se puede deshacer.',
      propertyDeletedSuccess: '¡Propiedad eliminada exitosamente!',
      failedToDeleteProperty: 'Error al eliminar la propiedad',
      
      // Payment Form
      registerPaymentTitle: 'Registrar Pago',
      propertyUnitLabel: 'Unidad de Propiedad',
      paymentAmountLabel: 'Monto del Pago',
      paymentDateLabel: 'Fecha de Pago',
      paymentTypeLabel: 'Tipo de Pago',
      descriptionLabel: 'Descripción (Opcional)',
      clearForm: 'Limpiar Formulario',
      registerPaymentAction: 'Registrar Pago',
      selectedPropertyDetails: 'Detalles de la Propiedad Seleccionada:',
      paymentRegisteredSuccess: '¡Pago registrado exitosamente!',
      failedToRegisterPayment: 'Error al registrar el pago',
      fixValidationErrors: 'Por favor corrige los errores de validación',
      charactersCount: '{count}/500 caracteres',
      
      // Payment Types
      rentPayment: 'Pago de Alquiler',
      depositPayment: 'Depósito',
      maintenancePayment: 'Mantenimiento',
      utilityPayment: 'Servicios',
      otherPayment: 'Otro',
      
      // Currencies
      currencySymbol: {
        ARS: '$',
        USD: 'US$'
      },
      currencyName: {
        ARS: 'Pesos Argentinos',
        USD: 'Dólares Estadounidenses'
      }
    },
    en: {
      // Header
      appTitle: 'PropPilot',
      appSubtitle: 'Rental Property Management',
      
      // Tabs
      propertyUnits: 'PROPERTY UNITS',
      registerPayment: 'REGISTER PAYMENT',
      tenants: 'TENANTS',
      
      // Property List
      propertyUnitsTitle: 'Property Units',
      addProperty: 'ADD PROPERTY',
      searchPlaceholder: 'Search by address...',
      
      // Table Headers
      id: 'ID',
      address: 'Address',
      type: 'Type',
      baseRent: 'Base Rent',
      leaseStart: 'Lease Start',
      tenant: 'Tenant',
      noTenant: 'No Tenant',
      
      // Property Types
      apartment: 'Apartment',
      house: 'House',
      duplex: 'Duplex',
      ph: 'Townhouse',
      studio: 'Studio',
      loft: 'Loft',
      townhouse: 'Townhouse',
      
      // Add Property Dialog
      addNewProperty: 'Add New Property',
      addressLabel: 'Address',
      addressPlaceholder: 'Ex: 123 Main Street, Downtown',
      addressHelper: 'Complete property address',
      propertyTypeLabel: 'Property Type',
      selectPropertyType: 'Select property type',
      baseRentLabel: 'Base Rent',
      baseRentPlaceholder: 'Ex: 1500',
      baseRentHelper: 'Monthly amount',
      leaseStartLabel: 'Lease Start Date',
      leaseStartHelper: 'Lease contract start date',
      
      // Dialog Actions
      cancel: 'CANCEL',
      addPropertyAction: 'ADD PROPERTY',
      
      // Messages
      totalUnits: 'Total: {count} property unit{plural}',
      loading: 'Loading...',
      errorOccurred: 'An error occurred',
      
      // Tenant Management
      tenantsTitle: 'Tenants',
      addTenant: 'ADD TENANT',
      editTenant: 'EDIT TENANT',
      deleteTenant: 'DELETE TENANT',
      fullName: 'Full Name',
      nationalId: 'National ID',
      email: 'Email',
      phone: 'Phone',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      save: 'SAVE',
      addNewTenant: 'Add New Tenant',
      editTenantTitle: 'Edit Tenant',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Ex: John Smith',
      nationalIdLabel: 'National ID',
      nationalIdPlaceholder: 'Ex: 12345678',
      emailLabel: 'Email',
      emailPlaceholder: 'Ex: john.smith@email.com',
      phoneLabel: 'Phone',
      phonePlaceholder: 'Ex: +1 555-123-4567',
      confirmDelete: 'Are you sure you want to delete this tenant?',
      confirmDeleteMessage: 'This action cannot be undone.',
      tenantCreatedSuccess: 'Tenant created successfully!',
      tenantUpdatedSuccess: 'Tenant updated successfully!',
      tenantDeletedSuccess: 'Tenant deleted successfully!',
      failedToCreateTenant: 'Failed to create tenant',
      failedToUpdateTenant: 'Failed to update tenant',
      failedToDeleteTenant: 'Failed to delete tenant',
      duplicateNationalId: 'A tenant with this National ID already exists',
      duplicateEmail: 'A tenant with this email already exists',
      totalTenants: 'Total: {count} tenant{plural}',
      
      // Property Management
      deleteProperty: 'DELETE PROPERTY',
      confirmDeleteProperty: 'Are you sure you want to delete this property?',
      confirmDeletePropertyMessage: 'This action cannot be undone.',
      propertyDeletedSuccess: 'Property deleted successfully!',
      failedToDeleteProperty: 'Failed to delete property',
      
      // Payment Form
      registerPaymentTitle: 'Register Payment',
      propertyUnitLabel: 'Property Unit',
      paymentAmountLabel: 'Payment Amount',
      paymentDateLabel: 'Payment Date',
      paymentTypeLabel: 'Payment Type',
      descriptionLabel: 'Description (Optional)',
      clearForm: 'Clear Form',
      registerPaymentAction: 'Register Payment',
      selectedPropertyDetails: 'Selected Property Details:',
      paymentRegisteredSuccess: 'Payment registered successfully!',
      failedToRegisterPayment: 'Failed to register payment',
      fixValidationErrors: 'Please fix the validation errors below',
      charactersCount: '{count}/500 characters',
      
      // Payment Types
      rentPayment: 'Rent Payment',
      depositPayment: 'Deposit',
      maintenancePayment: 'Maintenance',
      utilityPayment: 'Utility',
      otherPayment: 'Other',
      
      // Currencies
      currencySymbol: {
        ARS: 'AR$',
        USD: '$'
      },
      currencyName: {
        ARS: 'Argentine Pesos',
        USD: 'US Dollars'
      }
    }
  }

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (typeof value === 'string' && params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => params[paramKey] || match)
    }
    
    return value || key
  }

  const formatCurrency = (amount, currencyCode = currency) => {
    const symbol = t(`currencySymbol.${currencyCode}`)
    const formattedAmount = new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US').format(amount)
    return `${symbol}${formattedAmount}`
  }

  const value = {
    language,
    setLanguage,
    currency,
    setCurrency,
    t,
    formatCurrency,
    availableLanguages: [
      { code: 'es', name: 'Español' },
      { code: 'en', name: 'English' }
    ],
    availableCurrencies: [
      { code: 'ARS', name: t('currencyName.ARS') },
      { code: 'USD', name: t('currencyName.USD') }
    ]
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
