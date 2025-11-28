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
  Schedule
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'
import axios from 'axios'

const DashboardView = memo(({ onNavigate }) => {
  const { t, formatCurrency } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [propertyUnits, setPropertyUnits] = useState([])
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [propertiesRes, tenantsRes, paymentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/property-units`),
          axios.get(`${API_BASE_URL}/tenants`),
          axios.get(`${API_BASE_URL}/payments`)
        ])
        setPropertyUnits(propertiesRes.data)
        setTenants(tenantsRes.data)
        setPayments(paymentsRes.data)
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
    const occupiedProperties = propertyUnits.filter(p => p.tenant).length
    const vacantProperties = totalProperties - occupiedProperties
    const activeTenants = tenants.length
    const monthlyRevenue = propertyUnits.reduce((sum, p) => sum + (parseFloat(p.baseRentAmount) || 0), 0)
    const outstandingPayments = payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').length
    return { totalProperties, vacantProperties, occupiedProperties, activeTenants, monthlyRevenue, outstandingPayments }
  }, [propertyUnits, tenants, payments])

  // Get recent completed payments
  const recentPaymentsData = useMemo(() => {
    return payments
      .filter(p => p.status === 'COMPLETED')
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      .slice(0, 5)
      .map(p => {
        const property = propertyUnits.find(prop => prop.id === p.propertyUnitId)
        return {
          tenant: property?.tenant?.fullName || 'Unknown',
          property: property?.address || 'Unknown',
          amount: p.amount,
          date: p.paymentDate
        }
      })
  }, [payments, propertyUnits])

  // Get next pending payment
  const nextPaymentDue = useMemo(() => {
    const pendingPayments = payments
      .filter(p => p.status === 'PENDING')
      .sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate))

    if (pendingPayments.length === 0) {
      return null
    }

    const next = pendingPayments[0]
    const property = propertyUnits.find(prop => prop.id === next.propertyUnitId)
    const dueDate = new Date(next.paymentDate)
    const today = new Date()
    const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

    return {
      amount: next.amount,
      tenant: property?.tenant?.fullName || 'Unknown',
      property: property?.address || 'Unknown',
      dueDate: next.paymentDate,
      daysUntil: Math.max(0, daysUntil)
    }
  }, [payments, propertyUnits])

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
      title: t('outstandingPayments'),
      value: dashboardStats.outstandingPayments.toString(),
      change: `${dashboardStats.outstandingPayments} ${t('overdue')}`,
      icon: <Warning sx={{ fontSize: 40, color: '#F44336' }} />,
      color: '#F44336',
      navigateTo: 1,
      trendPositive: false
    }
  ], [t, formatCurrency, dashboardStats])

  const quickActions = useMemo(() => [
    { title: t('addNewTenant'), icon: <Add />, color: 'primary', navigateTo: 2 },
    { title: t('registerPayment'), icon: <Payment />, color: 'secondary', navigateTo: 3 },
    { title: t('addProperty'), icon: <Home />, color: 'primary', navigateTo: 1 },
    { title: t('viewOutstanding'), icon: <Warning />, color: 'error', navigateTo: 1 }
  ], [t])

  const handleStatClick = useCallback((navigateTo) => {
    onNavigate && onNavigate(navigateTo)
  }, [onNavigate])

  const handlePaymentClick = useCallback(() => {
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
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <Card
              onClick={() => handleStatClick(stat.navigateTo)}
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
          onClick={handlePaymentClick}
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

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Recent Payments */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content' }}>
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
                  onClick={() => handleStatClick(action.navigateTo)}
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
