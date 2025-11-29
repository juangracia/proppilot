import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  Card,
  Divider
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  CheckCircle,
  Schedule,
  Payment as PaymentIcon,
  Close,
  Home,
  Person,
  Receipt,
  CalendarToday,
  Notes,
  OpenInNew
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format } from 'date-fns'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'

const PaymentForm = memo(function PaymentForm({ onNavigateToProperty, onNavigateToTenant, initialPaymentId, onPaymentViewed }) {
  const { t, formatCurrency, currency } = useLanguage()
  const [activeTab, setActiveTab] = useState(0)

  const [formData, setFormData] = useState({
    propertyUnitId: '',
    amount: '',
    paymentDate: null,
    paymentType: 'RENT',
    description: '',
    isPartialPayment: false
  })

  const [validationErrors, setValidationErrors] = useState({})
  const [propertyUnits, setPropertyUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [payments, setPayments] = useState([])

  const paymentTypes = useMemo(() => [
    { value: 'RENT', label: t('rentPayment') },
    { value: 'DEPOSIT', label: t('depositPayment') },
    { value: 'MAINTENANCE', label: t('maintenancePayment') },
    { value: 'UTILITY', label: t('utilityPayment') },
    { value: 'OTHER', label: t('otherPayment') }
  ], [t])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesRes, paymentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/property-units`),
          axios.get(`${API_BASE_URL}/payments`)
        ])
        setPropertyUnits(propertiesRes.data)
        setPayments(paymentsRes.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  // Auto-open detail dialog when initialPaymentId is provided
  useEffect(() => {
    if (initialPaymentId && payments.length > 0) {
      const payment = payments.find(p => p.id === initialPaymentId)
      if (payment) {
        setSelectedPayment(payment)
        setDetailDialogOpen(true)
        setActiveTab(1) // Switch to payment history tab
        onPaymentViewed?.()
      }
    }
  }, [initialPaymentId, payments, onPaymentViewed])

  // Auto-fill rent amount when property is selected
  const handlePropertyChange = useCallback((propertyId) => {
    const selectedUnit = propertyUnits.find(u => u.id === parseInt(propertyId))
    setFormData(prev => ({
      ...prev,
      propertyUnitId: propertyId,
      amount: selectedUnit && !prev.isPartialPayment ? selectedUnit.baseRentAmount.toString() : prev.amount
    }))
  }, [propertyUnits])

  const validateForm = useCallback(() => {
    const errors = {}

    if (!formData.propertyUnitId) {
      errors.propertyUnitId = t('propertyUnitRequired')
    }

    if (!formData.amount) {
      errors.amount = t('amountRequired')
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        errors.amount = t('amountPositive')
      } else if (amount > 999999.99) {
        errors.amount = t('amountExceeded')
      }
    }

    if (!formData.paymentDate) {
      errors.paymentDate = t('dateRequired')
    } else if (formData.paymentDate > new Date()) {
      errors.paymentDate = t('dateFuture')
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = t('descriptionLength')
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, t])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setError(t('fixValidationErrors'))
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setValidationErrors({})

    try {
      const paymentData = {
        propertyUnit: { id: parseInt(formData.propertyUnitId) },
        amount: parseFloat(formData.amount),
        paymentDate: format(formData.paymentDate, 'yyyy-MM-dd'),
        paymentType: formData.paymentType,
        description: formData.description || null
      }

      const response = await axios.post(`${API_BASE_URL}/payments`, paymentData)

      if (response.status === 201) {
        setSuccess(t('paymentRegisteredSuccess'))
        setFormData({
          propertyUnitId: '',
          amount: '',
          paymentDate: null,
          paymentType: 'RENT',
          description: ''
        })
        setValidationErrors({})
      }
    } catch (err) {
      console.error('Error creating payment:', err)

      // Handle validation errors from backend
      if (err.response?.status === 400 && err.response?.data?.validationErrors) {
        setValidationErrors(err.response.data.validationErrors)
        setError(t('fixValidationErrors'))
      } else {
        setError(err.response?.data?.message || t('failedToRegisterPayment'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    // Clear messages when user starts typing
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      paymentDate: newDate
    }))
  }

  const selectedPropertyUnit = useMemo(() =>
    propertyUnits.find(unit => unit.id === parseInt(formData.propertyUnitId))
  , [propertyUnits, formData.propertyUnitId])

  const handleTabChange = useCallback((e, newValue) => {
    setActiveTab(newValue)
  }, [])

  // Transform payments for display with property and tenant info
  const displayPayments = useMemo(() => {
    return payments.map(payment => {
      const property = propertyUnits.find(p => p.id === payment.propertyUnitId)
      return {
        ...payment,
        propertyAddress: property?.address || 'Unknown',
        tenantName: property?.tenant?.fullName || 'Unknown',
        propertyId: property?.id,
        tenantId: property?.tenant?.id
      }
    })
  }, [payments, propertyUnits])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mx: 0 }}>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={t('registerPaymentTitle')} sx={{ textTransform: 'none' }} />
            <Tab label={t('paymentHistory')} sx={{ textTransform: 'none' }} />
          </Tabs>

          {/* Tab 0: Register Payment */}
          {activeTab === 0 && (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required error={!!validationErrors.propertyUnitId}>
                    <InputLabel>{t('propertyUnitLabel')}</InputLabel>
                    <Select
                      value={formData.propertyUnitId}
                      onChange={(e) => handlePropertyChange(e.target.value)}
                      label={t('propertyUnitLabel')}
                    >
                      {propertyUnits.map((unit) => (
                        <MenuItem key={unit.id} value={unit.id}>
                          {unit.address} ({unit.type}) - {formatCurrency(unit.baseRentAmount)}
                        </MenuItem>
                      ))}
                    </Select>
                    {validationErrors.propertyUnitId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {validationErrors.propertyUnitId}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label={t('paymentAmountLabel')}
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    fullWidth
                    required
                    error={!!validationErrors.amount}
                    helperText={validationErrors.amount}
                    inputProps={{ step: '0.01', min: '0.01', max: '999999.99' }}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>{t(`currencySymbol.${currency}`)}</Typography>
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isPartialPayment}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPartialPayment: e.target.checked }))}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {t('partialPayment')}
                      </Typography>
                    }
                    sx={{ mt: 1 }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label={t('paymentDateLabel')}
                    value={formData.paymentDate}
                    onChange={(date) => setFormData(prev => ({ ...prev, paymentDate: date }))}
                    maxDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!validationErrors.paymentDate,
                        helperText: validationErrors.paymentDate
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label={t('paymentTypeLabel')}
                    value={formData.paymentType}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
                    fullWidth
                    required
                  >
                    {paymentTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label={t('descriptionLabel')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                    error={!!validationErrors.description}
                    helperText={validationErrors.description || t('charactersCount', { count: formData.description.length })}
                    inputProps={{ maxLength: 500 }}
                  />
                </Grid>

                {selectedPropertyUnit && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{
                      p: { xs: 1.5, sm: 2 },
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.default'
                    }}>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        color="primary"
                        sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
                      >
                        {t('selectedPropertyDetails')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          <strong>{t('addressLabel')}:</strong> {selectedPropertyUnit.address}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          <strong>{t('type')}:</strong> {t(selectedPropertyUnit.type.toLowerCase())}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          <strong>{t('baseRentLabel')}:</strong> {formatCurrency(selectedPropertyUnit.baseRentAmount)}
                        </Typography>
                        {selectedPropertyUnit.tenant && (
                          <Typography
                            variant="body2"
                            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                          >
                            <strong>{t('tenant')}:</strong> {selectedPropertyUnit.tenant.firstName} {selectedPropertyUnit.tenant.lastName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Box sx={{
                    display: 'flex',
                    gap: { xs: 1.5, sm: 2 },
                    justifyContent: 'flex-end',
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    pt: { xs: 1.5, sm: 2 },
                    borderTop: 1,
                    borderColor: 'divider'
                  }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => {
                        setFormData({
                          propertyUnitId: '',
                          amount: '',
                          paymentDate: null,
                          paymentType: 'RENT',
                          description: '',
                          isPartialPayment: false
                        })
                        setError('')
                        setSuccess('')
                        setValidationErrors({})
                      }}
                      sx={{
                        minWidth: { xs: '100%', sm: 100 },
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      {t('clearForm')}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        minWidth: { xs: '100%', sm: 140 },
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : t('registerPaymentAction')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
              </Box>
              )}
            </>
          )}

          {/* Tab 1: Payment History */}
          {activeTab === 1 && (
            <Box>
              {/* Empty State */}
              {payments.length === 0 && (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'background.default',
                    border: '2px dashed',
                    borderColor: 'divider'
                  }}
                >
                  <PaymentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('noPayments') || 'No payments found'}
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    {t('noPaymentsDesc') || 'Payment history will appear here once payments are registered'}
                  </Typography>
                </Paper>
              )}

              {/* Desktop/Tablet Table View */}
              {payments.length > 0 && (
              <>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('propertiesMenu')}</TableCell>
                        <TableCell>{t('tenant')}</TableCell>
                        <TableCell>{t('paymentAmountLabel')}</TableCell>
                        <TableCell>{t('paymentDateLabel')}</TableCell>
                        <TableCell>{t('status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayPayments.map((payment) => (
                        <TableRow
                          key={payment.id}
                          hover
                          onClick={() => { setSelectedPayment(payment); setDetailDialogOpen(true) }}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontSize: '0.875rem' }}>
                            {payment.propertyAddress}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem' }}>
                            {payment.tenantName}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem' }}>
                            {payment.paymentDate}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={payment.status === 'PAID' ? <CheckCircle /> : <Schedule />}
                              label={payment.status === 'PAID' ? t('paid') : t('pending')}
                              size="small"
                              color={payment.status === 'PAID' ? 'success' : 'warning'}
                              sx={{ '& .MuiChip-icon': { fontSize: 16 } }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Mobile Card View */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                {displayPayments.map((payment) => (
                  <Paper
                    key={payment.id}
                    variant="outlined"
                    onClick={() => { setSelectedPayment(payment); setDetailDialogOpen(true) }}
                    sx={{
                      p: 2,
                      mb: 2,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: 2 },
                      '&:last-child': { mb: 0 }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {payment.propertyAddress}
                      </Typography>
                      <Chip
                        icon={payment.status === 'PAID' ? <CheckCircle /> : <Schedule />}
                        label={payment.status === 'PAID' ? t('paid') : t('pending')}
                        size="small"
                        color={payment.status === 'PAID' ? 'success' : 'warning'}
                        sx={{ '& .MuiChip-icon': { fontSize: 14 }, ml: 1, flexShrink: 0 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', mb: 1 }}>
                      {payment.tenantName}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {formatCurrency(payment.amount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                        {payment.paymentDate}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
              </>
              )}
            </Box>
          )}
        </Paper>

        {/* Payment Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              maxHeight: { xs: '95vh', sm: '90vh' }
            }
          }}
        >
          {selectedPayment && (
            <>
              <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: selectedPayment.status === 'PAID' ? 'success.main' : 'warning.main', width: 48, height: 48 }}>
                    <Receipt />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(selectedPayment.amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      #{selectedPayment.id}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                  <Close />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                {/* Status */}
                <Box sx={{ mb: 3 }}>
                  <Chip
                    icon={selectedPayment.status === 'PAID' ? <CheckCircle /> : <Schedule />}
                    label={selectedPayment.status === 'PAID' ? (t('paid') || 'Pagado') : (t('pending') || 'Pendiente')}
                    color={selectedPayment.status === 'PAID' ? 'success' : 'warning'}
                    sx={{ fontWeight: 500 }}
                  />
                </Box>

                {/* Payment Info */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('paymentDetails') || 'Detalles del Pago'}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <CalendarToday sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t('paymentDateLabel')}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedPayment.paymentDate}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Receipt sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t('type')}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t(`${selectedPayment.paymentType?.toLowerCase()}Payment`) || selectedPayment.paymentType}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Property Info */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('propertyInfo')}
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 2,
                    cursor: onNavigateToProperty && selectedPayment.propertyId ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': onNavigateToProperty && selectedPayment.propertyId ? {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    } : {}
                  }}
                  onClick={() => {
                    if (onNavigateToProperty && selectedPayment.propertyId) {
                      setDetailDialogOpen(false)
                      onNavigateToProperty(selectedPayment.propertyId)
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Home sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>{selectedPayment.propertyAddress}</Typography>
                    {onNavigateToProperty && selectedPayment.propertyId && (
                      <OpenInNew sx={{ fontSize: 16, color: 'text.secondary' }} />
                    )}
                  </Box>
                </Paper>

                {/* Tenant Info */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('tenant')}
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 3,
                    cursor: onNavigateToTenant && selectedPayment.tenantId ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': onNavigateToTenant && selectedPayment.tenantId ? {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    } : {}
                  }}
                  onClick={() => {
                    if (onNavigateToTenant && selectedPayment.tenantId) {
                      setDetailDialogOpen(false)
                      onNavigateToTenant(selectedPayment.tenantId)
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Person sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>{selectedPayment.tenantName}</Typography>
                    {onNavigateToTenant && selectedPayment.tenantId && (
                      <OpenInNew sx={{ fontSize: 16, color: 'text.secondary' }} />
                    )}
                  </Box>
                </Paper>

                {/* Description */}
                {selectedPayment.description && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      {t('descriptionLabel') || 'Description'}
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Notes sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2">{selectedPayment.description}</Typography>
                      </Box>
                    </Paper>
                  </>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setDetailDialogOpen(false)}>
                  {t('close') || 'Cerrar'}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
})

export default PaymentForm
