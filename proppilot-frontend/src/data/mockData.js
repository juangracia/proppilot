// Shared mock data for consistent data across all components

// Properties - 8 total (6 occupied, 2 vacant)
export const mockProperties = [
  {
    id: 1,
    address: 'Av. Corrientes 1234, Piso 5A',
    type: 'Apartment',
    status: 'Occupied',
    tenantId: 1,
    tenant: 'Juan Carlos Pérez',
    monthlyRent: 85000,
    leaseStart: '2024-01-15',
    leaseEnd: '2025-01-14',
    hasPendingPayment: false,
    lastPaymentDate: '2024-11-15',
    bedrooms: 2,
    bathrooms: 1,
    sqMeters: 65,
    description: 'Departamento luminoso con vista a la calle, cocina equipada, balcón.'
  },
  {
    id: 2,
    address: 'Calle Florida 567, Depto 3B',
    type: 'Apartment',
    status: 'Occupied',
    tenantId: 2,
    tenant: 'María González',
    monthlyRent: 120000,
    leaseStart: '2024-03-01',
    leaseEnd: '2025-02-28',
    hasPendingPayment: true,
    lastPaymentDate: '2024-10-20',
    bedrooms: 3,
    bathrooms: 2,
    sqMeters: 95,
    description: 'Amplio departamento en zona céntrica, ideal para familia.'
  },
  {
    id: 3,
    address: 'Av. Santa Fe 890, Local 2',
    type: 'Commercial',
    status: 'Occupied',
    tenantId: 3,
    tenant: 'Carlos Rodríguez',
    monthlyRent: 250000,
    leaseStart: '2023-06-01',
    leaseEnd: '2025-05-31',
    hasPendingPayment: false,
    lastPaymentDate: '2024-11-01',
    sqMeters: 150,
    description: 'Local comercial en avenida principal, gran vidriera, depósito incluido.'
  },
  {
    id: 4,
    address: 'Belgrano 2345',
    type: 'House',
    status: 'Occupied',
    tenantId: 4,
    tenant: 'Ana Martínez',
    monthlyRent: 180000,
    leaseStart: '2024-02-01',
    leaseEnd: '2025-01-31',
    hasPendingPayment: true,
    lastPaymentDate: '2024-09-15',
    bedrooms: 4,
    bathrooms: 2,
    sqMeters: 180,
    garage: true,
    description: 'Casa amplia con jardín, cochera para 2 autos, parrilla.'
  },
  {
    id: 5,
    address: 'Av. Libertador 4567, Piso 12C',
    type: 'Apartment',
    status: 'Occupied',
    tenantId: 5,
    tenant: 'Pedro Sánchez',
    monthlyRent: 200000,
    leaseStart: '2024-05-01',
    leaseEnd: '2025-04-30',
    hasPendingPayment: false,
    lastPaymentDate: '2024-11-05',
    bedrooms: 3,
    bathrooms: 2,
    sqMeters: 110,
    amenities: ['Gimnasio', 'Pileta', 'SUM'],
    description: 'Departamento de categoría en edificio con amenities completos.'
  },
  {
    id: 6,
    address: 'Callao 789, Piso 2A',
    type: 'Apartment',
    status: 'Occupied',
    tenantId: 6,
    tenant: 'Roberto Silva',
    monthlyRent: 95000,
    leaseStart: '2024-07-01',
    leaseEnd: '2025-06-30',
    hasPendingPayment: false,
    lastPaymentDate: '2024-11-10',
    bedrooms: 2,
    bathrooms: 1,
    sqMeters: 70,
    description: 'Departamento reciclado, excelente ubicación cerca de subte.'
  },
  {
    id: 7,
    address: 'Av. Rivadavia 6789, Local 5',
    type: 'Commercial',
    status: 'Vacant',
    tenantId: null,
    tenant: null,
    monthlyRent: 180000,
    leaseStart: null,
    leaseEnd: null,
    hasPendingPayment: false,
    lastPaymentDate: null,
    sqMeters: 120,
    description: 'Local a estrenar, ideal gastronomía, habilitación al día.'
  },
  {
    id: 8,
    address: 'Palermo 1234',
    type: 'House',
    status: 'Vacant',
    tenantId: null,
    tenant: null,
    monthlyRent: 220000,
    leaseStart: null,
    leaseEnd: null,
    hasPendingPayment: false,
    lastPaymentDate: null,
    bedrooms: 3,
    bathrooms: 2,
    sqMeters: 150,
    garage: true,
    description: 'Casa en Palermo con pileta, lista para alquilar.'
  }
]

// Tenants - 6 active tenants linked to properties
export const mockTenants = [
  {
    id: 1,
    fullName: 'Juan Carlos Pérez',
    nationalId: '12345678',
    email: 'juan.perez@email.com',
    phone: '+54 9 11 1234-5678',
    propertyId: 1,
    property: 'Av. Corrientes 1234, Piso 5A',
    leaseStart: '2024-01-15',
    leaseEndDate: '2025-01-14',
    monthlyRent: 85000,
    paymentStatus: 'onTime',
    emergencyContact: 'Laura Pérez - +54 9 11 8765-4321',
    notes: 'Inquilino puntual, sin inconvenientes.'
  },
  {
    id: 2,
    fullName: 'María González',
    nationalId: '23456789',
    email: 'maria.gonzalez@email.com',
    phone: '+54 9 11 2345-6789',
    propertyId: 2,
    property: 'Calle Florida 567, Depto 3B',
    leaseStart: '2024-03-01',
    leaseEndDate: '2025-02-28',
    monthlyRent: 120000,
    paymentStatus: 'late',
    emergencyContact: 'Roberto González - +54 9 11 9876-5432',
    notes: 'Retraso en pago de noviembre.'
  },
  {
    id: 3,
    fullName: 'Carlos Rodríguez',
    nationalId: '34567890',
    email: 'carlos.rodriguez@email.com',
    phone: '+54 9 11 3456-7890',
    propertyId: 3,
    property: 'Av. Santa Fe 890, Local 2',
    leaseStart: '2023-06-01',
    leaseEndDate: '2025-05-31',
    monthlyRent: 250000,
    paymentStatus: 'onTime',
    emergencyContact: 'Silvia Rodríguez - +54 9 11 0987-6543',
    notes: 'Local comercial - Negocio de ropa.'
  },
  {
    id: 4,
    fullName: 'Ana Martínez',
    nationalId: '45678901',
    email: 'ana.martinez@email.com',
    phone: '+54 9 11 4567-8901',
    propertyId: 4,
    property: 'Belgrano 2345',
    leaseStart: '2024-02-01',
    leaseEndDate: '2025-01-31',
    monthlyRent: 180000,
    paymentStatus: 'late',
    emergencyContact: 'Miguel Martínez - +54 9 11 1098-7654',
    notes: 'Pendiente pago octubre y noviembre.'
  },
  {
    id: 5,
    fullName: 'Pedro Sánchez',
    nationalId: '56789012',
    email: 'pedro.sanchez@email.com',
    phone: '+54 9 11 5678-9012',
    propertyId: 5,
    property: 'Av. Libertador 4567, Piso 12C',
    leaseStart: '2024-05-01',
    leaseEndDate: '2025-04-30',
    monthlyRent: 200000,
    paymentStatus: 'onTime',
    emergencyContact: 'Carmen Sánchez - +54 9 11 2109-8765',
    notes: 'Excelente inquilino, siempre adelanta el pago.'
  },
  {
    id: 6,
    fullName: 'Roberto Silva',
    nationalId: '78901234',
    email: 'roberto.silva@email.com',
    phone: '+54 9 11 7890-1234',
    propertyId: 6,
    property: 'Callao 789, Piso 2A',
    leaseStart: '2024-07-01',
    leaseEndDate: '2025-06-30',
    monthlyRent: 95000,
    paymentStatus: 'onTime',
    emergencyContact: 'Elena Silva - +54 9 11 3210-9876',
    notes: ''
  }
]

// Payment history - linked to tenants and properties
export const mockPayments = [
  {
    id: 1,
    tenantId: 1,
    tenant: 'Juan Carlos Pérez',
    propertyId: 1,
    property: 'Av. Corrientes 1234, Piso 5A',
    amount: 85000,
    date: '2024-11-15',
    type: 'rent',
    method: 'transfer',
    status: 'completed',
    reference: 'TRF-2024-1115-001',
    notes: 'Pago mensual noviembre'
  },
  {
    id: 2,
    tenantId: 2,
    tenant: 'María González',
    propertyId: 2,
    property: 'Calle Florida 567, Depto 3B',
    amount: 120000,
    date: '2024-10-20',
    type: 'rent',
    method: 'cash',
    status: 'completed',
    reference: 'EFE-2024-1020-001',
    notes: 'Pago mensual octubre'
  },
  {
    id: 3,
    tenantId: 3,
    tenant: 'Carlos Rodríguez',
    propertyId: 3,
    property: 'Av. Santa Fe 890, Local 2',
    amount: 250000,
    date: '2024-11-01',
    type: 'rent',
    method: 'transfer',
    status: 'completed',
    reference: 'TRF-2024-1101-001',
    notes: 'Pago mensual noviembre - Local comercial'
  },
  {
    id: 4,
    tenantId: 4,
    tenant: 'Ana Martínez',
    propertyId: 4,
    property: 'Belgrano 2345',
    amount: 180000,
    date: '2024-09-15',
    type: 'rent',
    method: 'check',
    status: 'completed',
    reference: 'CHQ-2024-0915-001',
    notes: 'Pago mensual septiembre'
  },
  {
    id: 5,
    tenantId: 5,
    tenant: 'Pedro Sánchez',
    propertyId: 5,
    property: 'Av. Libertador 4567, Piso 12C',
    amount: 200000,
    date: '2024-11-05',
    type: 'rent',
    method: 'transfer',
    status: 'completed',
    reference: 'TRF-2024-1105-001',
    notes: 'Pago mensual noviembre'
  },
  {
    id: 6,
    tenantId: 6,
    tenant: 'Roberto Silva',
    propertyId: 6,
    property: 'Callao 789, Piso 2A',
    amount: 95000,
    date: '2024-11-10',
    type: 'rent',
    method: 'transfer',
    status: 'completed',
    reference: 'TRF-2024-1110-001',
    notes: 'Pago mensual noviembre'
  },
  {
    id: 7,
    tenantId: 1,
    tenant: 'Juan Carlos Pérez',
    propertyId: 1,
    property: 'Av. Corrientes 1234, Piso 5A',
    amount: 85000,
    date: '2024-10-15',
    type: 'rent',
    method: 'transfer',
    status: 'completed',
    reference: 'TRF-2024-1015-001',
    notes: 'Pago mensual octubre'
  },
  {
    id: 8,
    tenantId: 5,
    tenant: 'Pedro Sánchez',
    propertyId: 5,
    property: 'Av. Libertador 4567, Piso 12C',
    amount: 200000,
    date: '2024-10-03',
    type: 'rent',
    method: 'transfer',
    status: 'completed',
    reference: 'TRF-2024-1003-001',
    notes: 'Pago mensual octubre - adelantado'
  },
  {
    id: 9,
    tenantId: 3,
    tenant: 'Carlos Rodríguez',
    propertyId: 3,
    property: 'Av. Santa Fe 890, Local 2',
    amount: 250000,
    date: '2024-10-01',
    type: 'rent',
    method: 'transfer',
    status: 'completed',
    reference: 'TRF-2024-1001-001',
    notes: 'Pago mensual octubre - Local comercial'
  },
  {
    id: 10,
    tenantId: 6,
    tenant: 'Roberto Silva',
    propertyId: 6,
    property: 'Callao 789, Piso 2A',
    amount: 95000,
    date: '2024-10-12',
    type: 'rent',
    method: 'cash',
    status: 'completed',
    reference: 'EFE-2024-1012-001',
    notes: 'Pago mensual octubre'
  }
]

// Dashboard stats derived from mock data
export const getDashboardStats = () => {
  const totalProperties = mockProperties.length
  const activeTenants = mockTenants.length
  const occupiedProperties = mockProperties.filter(p => p.status === 'Occupied').length
  const vacantProperties = mockProperties.filter(p => p.status === 'Vacant').length
  const outstandingPayments = mockTenants.filter(t => t.paymentStatus === 'late').length

  // Calculate monthly revenue from active tenants
  const monthlyRevenue = mockTenants.reduce((sum, t) => sum + t.monthlyRent, 0)

  return {
    totalProperties,
    activeTenants,
    occupiedProperties,
    vacantProperties,
    outstandingPayments,
    monthlyRevenue
  }
}

// Get recent payments (last 5)
export const getRecentPayments = () => {
  return [...mockPayments]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
}

// Get next payment due
export const getNextPaymentDue = () => {
  const lateTenant = mockTenants.find(t => t.paymentStatus === 'late')
  if (lateTenant) {
    const property = mockProperties.find(p => p.id === lateTenant.propertyId)
    return {
      tenant: lateTenant.fullName,
      tenantId: lateTenant.id,
      property: property?.address || lateTenant.property,
      propertyId: lateTenant.propertyId,
      amount: lateTenant.monthlyRent,
      dueDate: 'Vencido',
      daysUntil: 0,
      isOverdue: true
    }
  }

  // If no late payments, show next upcoming
  const nextTenant = mockTenants[0]
  return {
    tenant: nextTenant.fullName,
    tenantId: nextTenant.id,
    property: nextTenant.property,
    propertyId: nextTenant.propertyId,
    amount: nextTenant.monthlyRent,
    dueDate: '1 Dic, 2024',
    daysUntil: 5,
    isOverdue: false
  }
}

// Helper to get tenant by ID
export const getTenantById = (id) => mockTenants.find(t => t.id === id)

// Helper to get property by ID
export const getPropertyById = (id) => mockProperties.find(p => p.id === id)

// Helper to get payments by tenant ID
export const getPaymentsByTenantId = (tenantId) =>
  mockPayments.filter(p => p.tenantId === tenantId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

// Helper to get payments by property ID
export const getPaymentsByPropertyId = (propertyId) =>
  mockPayments.filter(p => p.propertyId === propertyId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
