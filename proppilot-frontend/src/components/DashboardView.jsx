import React, { useMemo, useCallback, memo, useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Home,
  People,
  AttachMoney,
  Warning,
  Add,
  Payment,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Schedule,
  Description,
  EventNote
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'
import axios from 'axios'
import { useIndices } from '../hooks/useIndices'

const DashboardView = memo(({ onNavigate, onNavigateToPayment }) => {
  const { t, formatCurrency, formatNumber } = useLanguage()
  const { indices, loading: indicesLoading } = useIndices('AR')
  const [loading, setLoading] = useState(true)
  const [propertyUnits, setPropertyUnits] = useState([])
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])
  const [leases, setLeases] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [propertiesRes, tenantsRes, paymentsRes, leasesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/property-units`),
          axios.get(`${API_BASE_URL}/tenants`),
          axios.get(`${API_BASE_URL}/payments`),
          axios.get(`${API_BASE_URL}/leases`)
        ])
        setPropertyUnits(Array.isArray(propertiesRes.data) ? propertiesRes.data : [])
        setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : [])
        setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : [])
        setLeases(Array.isArray(leasesRes.data) ? leasesRes.data : [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate dashboard stats from real data
  const dashboardStats = useMemo(() => {
    const totalProperties = propertyUnits.length
    // A property is occupied if it has an active lease
    const activeLeasePropertyIds = new Set(
      leases.filter(l => l.status === 'ACTIVE').map(l => l.propertyUnitIdRef)
    )
    const occupiedProperties = propertyUnits.filter(p => activeLeasePropertyIds.has(p.id)).length
    const vacantProperties = totalProperties - occupiedProperties
    const activeTenants = tenants.length
    const monthlyRevenue = propertyUnits.reduce((sum, p) => sum + (parseFloat(p.baseRentAmount) || 0), 0)
    const outstandingPayments = payments.filter(p => p.status === 'PENDING').length
    const activeLeases = leases.filter(l => l.status === 'ACTIVE').length
    const expiringLeases = leases.filter(l => {
      if (l.status !== 'ACTIVE') return false
      const endDate = new Date(l.endDate)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 60 && daysUntilExpiry >= 0
    }).length
    return { totalProperties, vacantProperties, occupiedProperties, activeTenants, monthlyRevenue, outstandingPayments, activeLeases, expiringLeases }
  }, [propertyUnits, tenants, payments, leases])

  // Get recent completed payments
  const recentPaymentsData = useMemo(() => {
    return payments
      .filter(p => p.status === 'PAID')
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      .slice(0, 5)
      .map(p => {
        return {
          tenant: p.tenantName || 'Sin inquilino',
          property: p.propertyAddress || 'Unknown',
          amount: p.amount,
          date: p.paymentDate
        }
      })
  }, [payments])

  // Get upcoming expiring contracts (within 60 days)
  const upcomingExpiringContracts = useMemo(() => {
    return leases
      .filter(l => l.status === 'ACTIVE')
      .map(l => {
        const endDate = new Date(l.endDate)
        const today = new Date()
        const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
        return { ...l, daysUntilExpiry }
      })
      .filter(l => l.daysUntilExpiry <= 60 && l.daysUntilExpiry >= 0)
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
      .slice(0, 3)
  }, [leases])

  // Get next pending payment
  const nextPaymentDue = useMemo(() => {
    const pendingPayments = payments
      .filter(p => p.status === 'PENDING')
      .sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate))

    if (pendingPayments.length === 0) {
      return null
    }

    const next = pendingPayments[0]
    const dueDate = new Date(next.paymentDate)
    const today = new Date()
    const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

    return {
      amount: next.amount,
      tenant: next.tenantName || 'Sin inquilino',
      property: next.propertyAddress || 'Unknown',
      dueDate: next.paymentDate,
      daysUntil: Math.max(0, daysUntil)
    }
  }, [payments])

  const stats = useMemo(() => [
    {
      title: t('totalProperties'),
      value: dashboardStats.totalProperties.toString(),
      change: `${dashboardStats.vacantProperties} ${t('vacant') || 'vacantes'}`,
      icon: <Home sx={{ fontSize: 40, color: '#2196F3' }} />,
      color: '#2196F3',
      navigateTo: 1,
      trendPositive: true
    },
    {
      title: t('activeTenants'),
      value: dashboardStats.activeTenants.toString(),
      change: `${dashboardStats.occupiedProperties} ${t('occupied') || 'ocupadas'}`,
      icon: <People sx={{ fontSize: 40, color: '#4CAF50' }} />,
      color: '#4CAF50',
      navigateTo: 2,
      trendPositive: true
    },
    {
      title: t('monthlyRevenue'),
      value: formatCurrency(dashboardStats.monthlyRevenue),
      change: `+8% ${t('fromLastMonth')}`,
      icon: <AttachMoney sx={{ fontSize: 40, color: '#FF9800' }} />,
      color: '#FF9800',
      navigateTo: 3,
      trendPositive: true
    },
    {
      title: t('activeLeases') || 'Contratos Activos',
      value: dashboardStats.activeLeases.toString(),
      change: dashboardStats.expiringLeases > 0
        ? `${dashboardStats.expiringLeases} ${t('expiringSoon') || 'por vencer'}`
        : t('allGood') || 'todos vigentes',
      icon: <Description sx={{ fontSize: 40, color: '#9C27B0' }} />,
      color: '#9C27B0',
      navigateTo: 3,
      trendPositive: dashboardStats.expiringLeases === 0
    },
    {
      title: t('outstandingPayments'),
      value: dashboardStats.outstandingPayments.toString(),
      change: `${dashboardStats.outstandingPayments} ${t('overdue')}`,
      icon: <Warning sx={{ fontSize: 40, color: '#F44336' }} />,
      color: '#F44336',
      navigateTo: 4,
      statusFilter: 'pending',
      trendPositive: false
    }
  ], [t, formatCurrency, dashboardStats])

  const quickActions = useMemo(() => [
    { title: t('addProperty'), icon: <Home />, color: 'primary', navigateTo: 1, openAdd: true },
    { title: t('addNewTenant'), icon: <Add />, color: 'primary', navigateTo: 2, openAdd: true },
    { title: t('createLease') || 'Crear Contrato', icon: <Description />, color: 'secondary', navigateTo: 3, openAdd: true },
    { title: t('registerPayment'), icon: <Payment />, color: 'secondary', navigateTo: 4, openAdd: true }
  ], [t])

  const handleStatClick = useCallback((stat) => {
    if (stat.navigateTo === 4 && stat.statusFilter && onNavigateToPayment) {
      onNavigateToPayment({ statusFilter: stat.statusFilter })
    } else if (stat.openAdd) {
      onNavigate && onNavigate(stat.navigateTo, { openAdd: true })
    } else {
      onNavigate && onNavigate(stat.navigateTo)
    }
  }, [onNavigate, onNavigateToPayment])

  const handlePaymentClick = useCallback((statusFilter = null) => {
    if (onNavigateToPayment) {
      onNavigateToPayment({ statusFilter })
    } else {
      onNavigate && onNavigate(4)
    }
  }, [onNavigate, onNavigateToPayment])

  const handleContractClick = useCallback(() => {
    onNavigate && onNavigate(3)
  }, [onNavigate])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          {t('loading')}
        </Typography>
      </Box>
    )
  }

  return (
    <Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }} data-tour="dashboard-stats">
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <Card
              onClick={() => handleStatClick(stat)}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateY(-4px)' },
                  boxShadow: { xs: 2, sm: 4 }
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ mr: 1.5, pt: 0.25, flexShrink: 0 }}>
                    {React.cloneElement(stat.icon, { sx: { fontSize: { xs: 28, sm: 32, md: 36 }, color: stat.color } })}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        fontSize: 'clamp(1.25rem, 2vw, 2rem)',
                        lineHeight: 1.1,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' }, mt: 0.5, lineHeight: 1.3 }}
                    >
                      {stat.title}
                    </Typography>
                  </Box>
                  <ChevronRight sx={{ fontSize: { xs: 20, sm: 24 }, color: 'text.disabled', ml: 1 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {stat.trendPositive ? (
                    <TrendingUp sx={{ fontSize: { xs: 14, sm: 16 }, color: '#4CAF50', mr: 0.5, flexShrink: 0 }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: { xs: 14, sm: 16 }, color: '#F44336', mr: 0.5, flexShrink: 0 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      color: stat.trendPositive ? '#4CAF50' : '#F44336',
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                      lineHeight: 1.3
                    }}
                  >
                    {stat.change}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Economic Indices Widget */}
      {indices.length > 0 && (
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 3, sm: 4 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('economicIndices') || 'Índices Económicos'}
          </Typography>
          <Grid container spacing={2}>
            {indices.filter(idx => idx.indexType !== 'NONE').map((index) => (
              <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={index.indexType}>
                <Box sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                  textAlign: 'center'
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {index.indexType.replace('_', ' ')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: index.indexType.includes('DOLAR') ? 'success.main' : 'primary.main' }}>
                    {index.indexType.includes('DOLAR')
                      ? `$${formatNumber(index.value)}`
                      : index.indexType === 'IPC'
                        ? `${index.value}%`
                        : formatNumber(index.value)
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {index.valueDate}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Next Payment Due Card */}
      {nextPaymentDue && (
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 3, sm: 4 },
            background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: { xs: 'none', sm: 'translateY(-2px)' },
              boxShadow: 4
            }
          }}
          onClick={() => handlePaymentClick('pending')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
              <Schedule sx={{ fontSize: { xs: 32, sm: 40 } }} />
              <Box>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                >
                  {t('nextPaymentDue') || 'Next Payment Due'}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  {formatCurrency(nextPaymentDue.amount)} - {nextPaymentDue.tenant}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' }, mt: 0.5 }}
                >
                  {nextPaymentDue.property} • {nextPaymentDue.dueDate}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Chip
                label={`${nextPaymentDue.daysUntil} ${t('daysLeft') || 'days left'}`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>
            <ChevronRight sx={{ fontSize: 24, ml: 1 }} />
          </Box>
        </Paper>
      )}

      {/* Expiring Contracts Alert */}
      {upcomingExpiringContracts.length > 0 && (
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 3, sm: 4 },
            background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: { xs: 'none', sm: 'translateY(-2px)' },
              boxShadow: 4
            }
          }}
          onClick={handleContractClick}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: 2 }}>
            <EventNote sx={{ fontSize: { xs: 28, sm: 32 } }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {t('expiringContracts') || 'Contratos por Vencer'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {upcomingExpiringContracts.map((contract, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 1,
                  p: 1.5
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {contract.tenantName || t('noTenantAssigned') || 'Sin asignar'}
                  </Typography>
                  <Typography sx={{ opacity: 0.8, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {contract.propertyAddress || t('unknownProperty') || 'Propiedad'}
                  </Typography>
                </Box>
                <Chip
                  label={`${contract.daysUntilExpiry} ${t('daysLabel') || 'días'}`}
                  sx={{
                    bgcolor: contract.daysUntilExpiry <= 30 ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}
                />
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Recent Payments */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            onClick={() => handlePaymentClick('paid')}
            sx={{
              p: { xs: 2, sm: 3 },
              height: 'fit-content',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-4px)' },
                boxShadow: { xs: 2, sm: 4 }
              }
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              {t('recentPayments')}
            </Typography>
            {recentPaymentsData.length > 0 ? (
              <List>
                {recentPaymentsData.map((payment, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: { xs: 1.5, sm: 2 },
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'flex-start' },
                        gap: { xs: 1, sm: 0 }
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 0.5,
                          gap: 1,
                          flexWrap: 'wrap'
                        }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 500,
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                          >
                            {payment.tenant}
                          </Typography>
                          <Chip
                            label={t('paid')}
                            size="small"
                            color="success"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          {payment.property}
                        </Typography>
                      </Box>
                      <Box sx={{
                        textAlign: { xs: 'left', sm: 'right' },
                        ml: { xs: 0, sm: 2 },
                        flexShrink: 0,
                        width: { xs: '100%', sm: 'auto' }
                      }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                          }}
                        >
                          {formatCurrency(payment.amount)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          {payment.date}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < recentPaymentsData.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Payment sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {t('noRecentPayments') || 'No recent payments'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              {t('quickActions')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  startIcon={action.icon}
                  color={action.color}
                  onClick={() => handleStatClick(action)}
                  sx={{
                    justifyContent: 'flex-start',
                    py: { xs: 1.25, sm: 1.5 },
                    textTransform: 'none',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    '&:hover': {
                      backgroundColor: `${action.color === 'primary' ? '#2196F3' : action.color === 'secondary' ? '#FF9800' : '#F44336'}10`
                    }
                  }}
                >
                  {action.title}
                </Button>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
})

export default DashboardView
