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
      registerPayment: 'Registrar Pago',
      tenants: 'INQUILINOS',

      // Property List
      propertyUnitsTitle: 'Unidades de Propiedad',
      addProperty: 'Agregar Propiedad',
      searchPlaceholder: 'Buscar por dirección...',

      // Table Headers
      id: 'ID',
      address: 'Dirección',
      type: 'Tipo',
      baseRent: 'Alquiler Base',
      monthlyRent: 'Alquiler Mensual',
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

      // Validation Errors
      fullNameRequired: 'El nombre completo es requerido',
      nationalIdRequired: 'El DNI/CUIT es requerido',
      emailRequired: 'El email es requerido',
      emailInvalid: 'El formato del email no es válido',
      phoneRequired: 'El teléfono es requerido',
      propertyUnitRequired: 'La unidad de propiedad es requerida',
      amountRequired: 'El monto del pago es requerido',
      amountPositive: 'El monto del pago debe ser mayor a 0',
      amountExceeded: 'El monto del pago no puede exceder 999,999.99',
      dateRequired: 'La fecha de pago es requerida',
      dateFuture: 'La fecha de pago no puede ser futura',
      descriptionLength: 'La descripción no puede exceder 500 caracteres',
      failedToLoadProperties: 'Error al cargar las unidades de propiedad. Por favor asegúrese de que el servidor backend esté funcionando.',

      // Selectors
      language: 'Idioma',
      currency: 'Moneda',

      // Menu Items
      dashboardMenu: 'Panel',
      propertiesMenu: 'Propiedades',
      tenantsMenu: 'Inquilinos',
      paymentsMenu: 'Pagos',

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
      },
      // Dashboard
      dashboardTitle: 'Panel de Control',
      dashboardSubtitle: '¡Bienvenido de nuevo! Aquí está el resumen de sus propiedades.',
      totalProperties: 'Total de Propiedades',
      activeTenants: 'Inquilinos Activos',
      monthlyRevenue: 'Ingresos Mensuales',
      outstandingPayments: 'Pagos Pendientes',
      recentPayments: 'Pagos Recientes',
      noRecentPayments: 'No hay pagos recientes',
      quickActions: 'Acciones Rápidas',
      viewOutstanding: 'Ver Pendientes',
      thisMonth: 'este mes',
      thisWeek: 'esta semana',
      fromLastMonth: 'desde el mes pasado',
      overdue: 'vencidos',
      paid: 'Pagado',
      pending: 'Pendiente',
      nextPaymentDue: 'Próximo Pago',
      daysLeft: 'días restantes',
      lastPayment: 'Último Pago',
      paymentOverdue: 'Pago Vencido',
      onTime: 'Al Día',
      late: 'Atrasado',
      leaseEnds: 'Fin de Contrato',
      paymentHistory: 'Historial de Pagos',
      partialPayment: 'Pago Parcial',
      remainingBalance: 'Saldo Restante',
      noProperties: 'No hay propiedades',
      noPropertiesDesc: 'Agrega tu primera propiedad para comenzar',
      noTenants: 'No hay inquilinos',
      noTenantsDesc: 'Agrega tu primer inquilino para comenzar',
      noPayments: 'No hay pagos registrados',
      noPaymentsDesc: 'Registra tu primer pago para verlo aquí',
      actionUndone: 'Acción deshecha',
      undo: 'Deshacer',
      deleted: 'eliminado',
      filterAll: 'Todos',
      filterOccupied: 'Ocupados',
      filterVacant: 'Vacantes',
      filterOverdue: 'Vencidos',

      // Common
      viewDetails: 'Ver Detalles',
      close: 'Cerrar',
      saveChanges: 'Guardar Cambios',
      propertyDetails: 'Detalles de la Propiedad',
      editProperty: 'Editar Propiedad',
      status: 'Estado',
      occupied: 'Ocupado',
      vacant: 'Vacante',
      commercial: 'Comercial',

      // Tenant Details
      contactInfo: 'Información de Contacto',
      propertyInfo: 'Propiedad',
      notes: 'Notas',
      noPaymentsYet: 'Sin pagos registrados',
      noPropertyAssigned: 'Sin propiedad asignada',
      emergencyContact: 'Contacto de Emergencia',

      // Property Details
      pendingPayment: 'Pago Pendiente',
      area: 'Superficie',
      yes: 'Sí',
      no: 'No',
      amenities: 'Amenities',
      noTenantAssigned: 'Sin inquilino asignado',
      paymentDetails: 'Detalles del Pago',
      paymentMethod: 'Método de Pago',

      // Payment Status
      statusCompleted: 'Pagado',
      statusPending: 'Pendiente',
      statusOverdue: 'Vencido',

      // Payment Methods
      methodTransfer: 'Transferencia',
      methodCash: 'Efectivo',
      methodCheck: 'Cheque',
      methodCard: 'Tarjeta',

      // Product Tour
      tourWelcomeTitle: '¡Bienvenido a PropPilot!',
      tourWelcome: 'Te guiaremos por las principales funciones de la aplicación para que puedas gestionar tus propiedades de manera eficiente.',
      tourDashboardStatsTitle: 'Panel de Control',
      tourDashboardStats: 'Aquí puedes ver un resumen rápido de tus propiedades, inquilinos activos, ingresos mensuales y pagos pendientes.',
      tourSidebarNavTitle: 'Navegación',
      tourSidebarNav: 'Usa el menú lateral para navegar entre las diferentes secciones de la aplicación.',
      tourNavPropertiesTitle: 'Propiedades',
      tourNavProperties: 'Gestiona todas tus unidades de propiedad. Agrega, edita o elimina propiedades y asigna inquilinos.',
      tourNavTenantsTitle: 'Inquilinos',
      tourNavTenants: 'Administra la información de tus inquilinos. Mantén un registro de sus datos de contacto y contratos.',
      tourNavPaymentsTitle: 'Pagos',
      tourNavPayments: 'Registra y da seguimiento a los pagos de alquiler. Mantén un historial completo de todas las transacciones.',
      tourLanguageSelectorTitle: 'Idioma y Moneda',
      tourLanguageSelector: 'Cambia el idioma de la aplicación y la moneda para visualizar los montos.',
      tourDarkModeTitle: 'Modo Oscuro',
      tourDarkMode: 'Alterna entre modo claro y oscuro según tu preferencia visual.',
      tourUserMenuTitle: 'Tu Perfil',
      tourUserMenu: 'Accede a tu perfil y cierra sesión cuando lo necesites.',
      tourCompleteTitle: '¡Listo para comenzar!',
      tourComplete: 'Ya conoces las funciones principales de PropPilot. ¡Comienza a gestionar tus propiedades ahora!',
      tourBack: 'Atrás',
      tourClose: 'Cerrar',
      tourFinish: 'Finalizar',
      tourNext: 'Siguiente',
      tourSkip: 'Saltar tour',
      startTour: 'Iniciar Tour',
    },
    en: {
      // Header
      appTitle: 'PropPilot',
      appSubtitle: 'Rental Property Management',

      // Tabs
      propertyUnits: 'PROPERTY UNITS',
      registerPayment: 'Register Payment',
      tenants: 'TENANTS',

      // Property List
      propertyUnitsTitle: 'Property Units',
      addProperty: 'Add Property',
      searchPlaceholder: 'Search by address...',

      // Table Headers
      id: 'ID',
      address: 'Address',
      type: 'Type',
      baseRent: 'Base Rent',
      monthlyRent: 'Monthly Rent',
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

      // Validation Errors
      fullNameRequired: 'Full name is required',
      nationalIdRequired: 'National ID is required',
      emailRequired: 'Email is required',
      emailInvalid: 'Email format is invalid',
      phoneRequired: 'Phone is required',
      propertyUnitRequired: 'Property unit is required',
      amountRequired: 'Payment amount is required',
      amountPositive: 'Payment amount must be greater than 0',
      amountExceeded: 'Payment amount cannot exceed 999,999.99',
      dateRequired: 'Payment date is required',
      dateFuture: 'Payment date cannot be in the future',
      descriptionLength: 'Description cannot exceed 500 characters',
      failedToLoadProperties: 'Failed to load property units. Please make sure the backend server is running.',

      // Selectors
      language: 'Language',
      currency: 'Currency',

      // Menu Items
      dashboardMenu: 'Dashboard',
      propertiesMenu: 'Properties',
      tenantsMenu: 'Tenants',
      paymentsMenu: 'Payments',

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
      },
      // Dashboard
      dashboardTitle: 'Dashboard',
      dashboardSubtitle: 'Welcome back! Here\'s your property overview.',
      totalProperties: 'Total Properties',
      activeTenants: 'Active Tenants',
      monthlyRevenue: 'Monthly Revenue',
      outstandingPayments: 'Outstanding Payments',
      recentPayments: 'Recent Payments',
      noRecentPayments: 'No recent payments',
      quickActions: 'Quick Actions',
      viewOutstanding: 'View Outstanding',
      thisMonth: 'this month',
      thisWeek: 'this week',
      fromLastMonth: 'from last month',
      overdue: 'overdue',
      paid: 'Paid',
      pending: 'Pending',
      nextPaymentDue: 'Next Payment Due',
      daysLeft: 'days left',
      lastPayment: 'Last Payment',
      paymentOverdue: 'Payment Overdue',
      onTime: 'On Time',
      late: 'Late',
      leaseEnds: 'Lease Ends',
      paymentHistory: 'Payment History',
      partialPayment: 'Partial Payment',
      remainingBalance: 'Remaining Balance',
      noProperties: 'No properties',
      noPropertiesDesc: 'Add your first property to get started',
      noTenants: 'No tenants',
      noTenantsDesc: 'Add your first tenant to get started',
      noPayments: 'No payments recorded',
      noPaymentsDesc: 'Register your first payment to see it here',
      actionUndone: 'Action undone',
      undo: 'Undo',
      deleted: 'deleted',
      filterAll: 'All',
      filterOccupied: 'Occupied',
      filterVacant: 'Vacant',
      filterOverdue: 'Overdue',

      // Common
      viewDetails: 'View Details',
      close: 'Close',
      saveChanges: 'Save Changes',
      propertyDetails: 'Property Details',
      editProperty: 'Edit Property',
      status: 'Status',
      occupied: 'Occupied',
      vacant: 'Vacant',
      commercial: 'Commercial',

      // Tenant Details
      contactInfo: 'Contact Information',
      propertyInfo: 'Property',
      notes: 'Notes',
      noPaymentsYet: 'No payments recorded',
      noPropertyAssigned: 'No property assigned',
      emergencyContact: 'Emergency Contact',

      // Property Details
      pendingPayment: 'Pending Payment',
      area: 'Area',
      yes: 'Yes',
      no: 'No',
      amenities: 'Amenities',
      noTenantAssigned: 'No tenant assigned',
      paymentDetails: 'Payment Details',
      paymentMethod: 'Payment Method',

      // Payment Status
      statusCompleted: 'Completed',
      statusPending: 'Pending',
      statusOverdue: 'Overdue',

      // Payment Methods
      methodTransfer: 'Transfer',
      methodCash: 'Cash',
      methodCheck: 'Check',
      methodCard: 'Card',

      // Product Tour
      tourWelcomeTitle: 'Welcome to PropPilot!',
      tourWelcome: 'We\'ll guide you through the main features of the app so you can manage your properties efficiently.',
      tourDashboardStatsTitle: 'Dashboard',
      tourDashboardStats: 'Here you can see a quick summary of your properties, active tenants, monthly revenue, and outstanding payments.',
      tourSidebarNavTitle: 'Navigation',
      tourSidebarNav: 'Use the sidebar menu to navigate between the different sections of the application.',
      tourNavPropertiesTitle: 'Properties',
      tourNavProperties: 'Manage all your property units. Add, edit, or delete properties and assign tenants.',
      tourNavTenantsTitle: 'Tenants',
      tourNavTenants: 'Manage your tenant information. Keep track of their contact details and contracts.',
      tourNavPaymentsTitle: 'Payments',
      tourNavPayments: 'Record and track rent payments. Maintain a complete history of all transactions.',
      tourLanguageSelectorTitle: 'Language & Currency',
      tourLanguageSelector: 'Change the app language and currency for displaying amounts.',
      tourDarkModeTitle: 'Dark Mode',
      tourDarkMode: 'Toggle between light and dark mode based on your visual preference.',
      tourUserMenuTitle: 'Your Profile',
      tourUserMenu: 'Access your profile and log out when needed.',
      tourCompleteTitle: 'Ready to Go!',
      tourComplete: 'You now know the main features of PropPilot. Start managing your properties now!',
      tourBack: 'Back',
      tourClose: 'Close',
      tourFinish: 'Finish',
      tourNext: 'Next',
      tourSkip: 'Skip tour',
      startTour: 'Start Tour',
    }
  }

  const t = (key, params = {}) => {
    if (!key) return ''
    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    if (typeof value === 'string' && params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) =>
        params[paramKey] !== undefined ? params[paramKey] : match
      )
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
