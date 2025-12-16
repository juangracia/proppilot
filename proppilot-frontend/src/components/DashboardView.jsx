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
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  EventNote,
  ExpandMore,
  Apartment,
  ArrowForward
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'
import axios from 'axios'
import { useIndices } from '../hooks/useIndices'
import PullToRefresh from './PullToRefresh'

const DashboardView = memo(({ onNavigate, onNavigateToPayment }) => {
  const { t, formatCurrency, formatNumber } = useLanguage()
  const { indices, getMonthlyChange, loading: indicesLoading } = useIndices('AR')
  const [loading, setLoading] = useState(true)
  const [propertyUnits, setPropertyUnits] = useState([])
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])
  const [leases, setLeases] = useState([])
  const [indicesExpanded, setIndicesExpanded] = useState(false)

  const fetchData = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  // Check if user is new (no properties)
  const isNewUser = useMemo(() => {
    return dashboardStats.totalProperties === 0
  }, [dashboardStats.totalProperties])

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
    <PullToRefresh onRefresh={fetchData}>
      <Box>

      {/* Onboarding View for New Users */}
      {isNewUser ? (
        <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
          <Apartment sx={{ fontSize: { xs: 60, sm: 80 }, color: 'primary.main', mb: 3 }} />

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {t('welcomeTitle')}
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 4,
              maxWidth: 500,
              mx: 'auto',
              px: 2,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            {t('welcomeSubtitle')}
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => onNavigate(1, { openAdd: true })}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              mb: 2
            }}
          >
            {t('addFirstProperty')}
          </Button>

          <Box sx={{ mt: 1 }}>
            <Button
              variant="text"
              size="small"
              startIcon={<People />}
              onClick={() => onNavigate(2, { openAdd: true })}
              sx={{ textTransform: 'none' }}
            >
              {t('orAddTenant')}
            </Button>
          </Box>

          {/* How it works section */}
          <Paper sx={{ mt: 5, p: { xs: 2, sm: 3 }, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              {t('howItWorks')}
            </Typography>
            <Grid container spacing={2}>
              {[
                { title: t('step1Title'), desc: t('step1Desc'), icon: <Home /> },
                { title: t('step2Title'), desc: t('step2Desc'), icon: <People /> },
                { title: t('step3Title'), desc: t('step3Desc'), icon: <Description /> },
                { title: t('step4Title'), desc: t('step4Desc'), icon: <Payment /> }
              ].map((step, index) => (
                <Grid size={{ xs: 6, sm: 3 }} key={index}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{
                      color: 'primary.main',
                      mb: 1,
                      '& > svg': { fontSize: { xs: 28, sm: 32 } }
                    }}>
                      {step.icon}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      ) : (
        <>
        {/* DASHBOARD FOR USERS WITH DATA */}

        {/* 1. Alerts Section - Pending Payments & Expiring Contracts */}
        {(nextPaymentDue || upcomingExpiringContracts.length > 0) && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {nextPaymentDue && (
              <Grid size={{ xs: 12, md: upcomingExpiringContracts.length > 0 ? 6 : 12 }}>
                <Paper
                  sx={{
                    p: 2,
                    background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: { xs: 'none', sm: 'translateY(-2px)' } }
                  }}
                  onClick={() => handlePaymentClick('pending')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Schedule sx={{ fontSize: 28 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {t('nextPaymentDue')}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {formatCurrency(nextPaymentDue.amount)}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {nextPaymentDue.tenant} • {nextPaymentDue.daysUntil} {t('daysLeft')}
                      </Typography>
                    </Box>
                    <ChevronRight />
                  </Box>
                </Paper>
              </Grid>
            )}
            {upcomingExpiringContracts.length > 0 && (
              <Grid size={{ xs: 12, md: nextPaymentDue ? 6 : 12 }}>
                <Paper
                  sx={{
                    p: 2,
                    background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: { xs: 'none', sm: 'translateY(-2px)' } }
                  }}
                  onClick={handleContractClick}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EventNote sx={{ fontSize: 28 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {t('expiringContracts')}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {upcomingExpiringContracts.length} {t('expiringSoon')}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {upcomingExpiringContracts[0]?.tenantName} - {upcomingExpiringContracts[0]?.daysUntilExpiry} {t('daysLabel')}
                      </Typography>
                    </Box>
                    <ChevronRight />
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* 2. Quick Actions - Prominent */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            justifyContent: { xs: 'stretch', sm: 'center' }
          }}>
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outlined"
                startIcon={action.icon}
                color={action.color}
                onClick={() => handleStatClick(action)}
                sx={{
                  textTransform: 'none',
                  flex: { xs: '1 1 45%', sm: '0 0 auto' },
                  minWidth: { sm: 140 },
                  py: 1.25
                }}
              >
                {action.title}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* 3. Compact Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }} data-tour="dashboard-stats">
          {stats.map((stat, index) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={index}>
              <Card
                onClick={() => handleStatClick(stat)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {React.cloneElement(stat.icon, { sx: { fontSize: 24, color: stat.color } })}
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 4. Economic Indices - Collapsible */}
        {indices.length > 0 && (
          <Accordion
            expanded={indicesExpanded}
            onChange={() => setIndicesExpanded(!indicesExpanded)}
            sx={{ mb: 3 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <TrendingUp color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t('economicIndices')}
                </Typography>
                {!indicesExpanded && (
                  <Box sx={{ display: 'flex', gap: 1, ml: 'auto', mr: 2 }}>
                    {indices.filter(idx => idx.indexType !== 'NONE').slice(0, 2).map(idx => {
                      const isDolar = idx.indexType.includes('DOLAR')
                      const isMonthlyChangeIndex = idx.indexType === 'ICL' || idx.indexType === 'IPC'
                      const monthlyChange = isMonthlyChangeIndex ? getMonthlyChange(idx.indexType) : null
                      return (
                        <Chip
                          key={idx.indexType}
                          label={`${idx.indexType.replace('_', ' ')}: ${isDolar ? `$${formatNumber(idx.value)}` : isMonthlyChangeIndex && monthlyChange !== null ? `${formatNumber(monthlyChange, 2)}%` : formatNumber(idx.value)}`}
                          size="small"
                          variant="outlined"
                          sx={{ display: { xs: 'none', sm: 'flex' } }}
                        />
                      )
                    })}
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {indices.filter(idx => idx.indexType !== 'NONE').map((index) => {
                  const isDolar = index.indexType.includes('DOLAR')
                  const isMonthlyChangeIndex = index.indexType === 'ICL' || index.indexType === 'IPC'
                  const monthlyChange = isMonthlyChangeIndex ? getMonthlyChange(index.indexType) : null

                  return (
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
                        <Typography variant="h6" sx={{ fontWeight: 600, color: isDolar ? 'success.main' : 'primary.main' }}>
                          {isDolar
                            ? `$${formatNumber(index.value)}`
                            : isMonthlyChangeIndex && monthlyChange !== null
                              ? `${formatNumber(monthlyChange, 2)}%`
                              : formatNumber(index.value)
                          }
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                          {isMonthlyChangeIndex
                            ? (t('monthlyChange'))
                            : index.valueDate
                          }
                        </Typography>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* 5. Recent Payments - Full Width */}
        <Paper
          onClick={() => handlePaymentClick('paid')}
          sx={{
            p: { xs: 2, sm: 3 },
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: { xs: 'none', sm: 'translateY(-2px)' },
              boxShadow: { xs: 2, sm: 4 }
            }
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            {t('recentPayments')}
          </Typography>
          {recentPaymentsData.length > 0 ? (
            <List sx={{ py: 0 }}>
              {recentPaymentsData.map((payment, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    sx={{
                      px: 0,
                      py: 1.5,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {payment.tenant}
                        </Typography>
                        <Chip
                          label={t('paid')}
                          size="small"
                          color="success"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {payment.property}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {formatCurrency(payment.amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payment.date}
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < recentPaymentsData.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Payment sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {t('noRecentPayments') || 'No recent payments'}
              </Typography>
            </Box>
          )}
        </Paper>
        </>
      )}
      </Box>
    </PullToRefresh>
  )
})

export default DashboardView
