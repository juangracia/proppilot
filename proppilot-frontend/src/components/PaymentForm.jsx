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
  Divider,
  InputAdornment
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
  OpenInNew,
  Description,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format } from 'date-fns'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'
import MoneyInput from './MoneyInput'

const PaymentForm = memo(function PaymentForm({
  onNavigateToProperty,
  onNavigateToTenant,
  onNavigateToLease,
  initialPaymentId,
  onPaymentViewed,
  initialStatusFilter,
  initialPropertyFilter,
  initialTenantFilter,
  onFiltersCleared,
  openAddForm,
  onAddFormOpened
}) {
  const { t, formatCurrency, currency } = useLanguage()
  const [activeTab, setActiveTab] = useState(0)

  // Filter states
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all')
  const [searchTerm, setSearchTerm] = useState('')
  const [propertyFilter, setPropertyFilter] = useState(initialPropertyFilter || null)
  const [tenantFilter, setTenantFilter] = useState(initialTenantFilter || null)

  const [formData, setFormData] = useState({
    leaseId: '',
    amount: '',
    paymentDate: null,
    paymentType: 'RENT',
    description: '',
    isPartialPayment: false
  })

  const [validationErrors, setValidationErrors] = useState({})
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
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

  const fetchData = useCallback(async () => {
    try {
      setInitialLoading(true)
      const [leasesRes, paymentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/leases/active`),
        axios.get(`${API_BASE_URL}/payments`)
      ])
      setLeases(Array.isArray(leasesRes.data) ? leasesRes.data : [])
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Sync external filter changes
  useEffect(() => {
    if (initialStatusFilter) setStatusFilter(initialStatusFilter)
  }, [initialStatusFilter])

  useEffect(() => {
    if (initialPropertyFilter) setPropertyFilter(initialPropertyFilter)
  }, [initialPropertyFilter])

  useEffect(() => {
    if (initialTenantFilter) setTenantFilter(initialTenantFilter)
  }, [initialTenantFilter])

  // Auto-switch to new payment tab when openAddForm is true
  useEffect(() => {
    if (openAddForm) {
      setActiveTab(1) // Tab 1 is "Register Payment"
      onAddFormOpened?.()
    }
  }, [openAddForm, onAddFormOpened])

  // Auto-open detail dialog when initialPaymentId is provided
  useEffect(() => {
    if (initialPaymentId && transformedPayments.length > 0) {
      const payment = transformedPayments.find(p => p.id === initialPaymentId)
      if (payment) {
        setSelectedPayment(payment)
        setDetailDialogOpen(true)
        setActiveTab(0)
        onPaymentViewed?.()
      }
    }
  }, [initialPaymentId, transformedPayments, onPaymentViewed])

  // Auto-fill rent amount when lease is selected
  const handleLeaseChange = useCallback((leaseId) => {
    const selectedLease = leases.find(l => l.id === parseInt(leaseId))
    setFormData(prev => ({
      ...prev,
      leaseId: leaseId,
      amount: selectedLease && !prev.isPartialPayment ? selectedLease.monthlyRent.toString() : prev.amount
    }))
  }, [leases])

  const validateForm = useCallback(() => {
    const errors = {}

    if (!formData.leaseId) {
      errors.leaseId = t('leaseRequired') || 'Contrato requerido'
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
        leaseId: parseInt(formData.leaseId),
        amount: parseFloat(formData.amount),
        paymentDate: format(formData.paymentDate, 'yyyy-MM-dd'),
        paymentType: formData.paymentType,
        description: formData.description || null
      }

      const response = await axios.post(`${API_BASE_URL}/payments`, paymentData)

      if (response.status === 201) {
        setSuccess(t('paymentRegisteredSuccess'))
        // Add new payment to the list immediately (fix reload bug)
        setPayments(prev => [response.data, ...prev])
        setFormData({
          leaseId: '',
          amount: '',
          paymentDate: null,
          paymentType: 'RENT',
          description: '',
          isPartialPayment: false
        })
        setValidationErrors({})
      }
    } catch (err) {
      console.error('Error creating payment:', err)

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

  const selectedLease = useMemo(() =>
    leases.find(lease => lease.id === parseInt(formData.leaseId))
  , [leases, formData.leaseId])

  const handleTabChange = useCallback((e, newValue) => {
    setActiveTab(newValue)
  }, [])

  // Transform payments with normalized field names
  const transformedPayments = useMemo(() => {
    return payments.map(payment => ({
      ...payment,
      propertyAddress: payment.propertyAddress || 'Unknown',
      tenantNames: payment.tenantNames || [payment.tenantName].filter(Boolean),
      tenantName: (payment.tenantNames || [payment.tenantName]).filter(Boolean).join(', ') || 'Sin inquilino',
      propertyId: payment.propertyUnitId,
      tenantIds: payment.tenantIds || [payment.tenantId].filter(Boolean),
      tenantId: payment.tenantId,
      leaseId: payment.leaseIdRef
    }))
  }, [payments])

  // Filter transformed payments for display
  const displayPayments = useMemo(() => {
    let filtered = transformedPayments

    // Apply status filter
    if (statusFilter === 'paid') {
      filtered = filtered.filter(p => p.status === 'PAID')
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(p => p.status === 'PENDING')
    }

    // Apply property filter
    if (propertyFilter) {
      filtered = filtered.filter(p => p.propertyId === propertyFilter)
    }

    // Apply tenant filter
    if (tenantFilter) {
      filtered = filtered.filter(p => p.tenantIds?.includes(tenantFilter) || p.tenantId === tenantFilter)
    }

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.propertyAddress.toLowerCase().includes(term) ||
        p.tenantName.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [transformedPayments, statusFilter, propertyFilter, tenantFilter, searchTerm])

  // Get counts for filter tabs
  const statusCounts = useMemo(() => {
    const all = payments.length
    const paid = payments.filter(p => p.status === 'PAID').length
    const pending = payments.filter(p => p.status === 'PENDING').length
    return { all, paid, pending }
  }, [payments])

  // Check if any filters are active (for showing clear button)
  const hasActiveFilters = useMemo(() => {
    return statusFilter !== 'all' || searchTerm || propertyFilter || tenantFilter
  }, [statusFilter, searchTerm, propertyFilter, tenantFilter])

  // Get the property/tenant name for filter chips
  const activeFilterLabels = useMemo(() => {
    const labels = []
    if (propertyFilter) {
      const payment = payments.find(p => p.propertyUnitId === propertyFilter)
      if (payment) labels.push({ type: 'property', label: payment.propertyAddress })
    }
    if (tenantFilter) {
      const payment = payments.find(p => p.tenantId === tenantFilter)
      if (payment) labels.push({ type: 'tenant', label: payment.tenantName })
    }
    return labels
  }, [propertyFilter, tenantFilter, payments])

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all')
    setSearchTerm('')
    setPropertyFilter(null)
    setTenantFilter(null)
    onFiltersCleared?.()
  }, [onFiltersCleared])

  const handleStatusFilterChange = useCallback((event, newValue) => {
    setStatusFilter(newValue)
  }, [])

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
            <Tab label={t('paymentHistory')} sx={{ textTransform: 'none' }} />
            <Tab label={t('registerPaymentTitle')} sx={{ textTransform: 'none' }} />
          </Tabs>

          {/* Tab 1: Register Payment */}
          {activeTab === 1 && (
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

              {initialLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : leases.length === 0 ? (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'background.default',
                    border: '2px dashed',
                    borderColor: 'divider'
                  }}
                >
                  <Description sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('noActiveLeases')}
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    {t('noActiveLeasesDesc')}
                  </Typography>
                </Paper>
              ) : loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required error={!!validationErrors.leaseId}>
                    <InputLabel>{t('selectLease') || 'Seleccionar Contrato'}</InputLabel>
                    <Select
                      value={formData.leaseId}
                      onChange={(e) => handleLeaseChange(e.target.value)}
                      label={t('selectLease') || 'Seleccionar Contrato'}
                    >
                      {leases.map((lease) => (
                        <MenuItem key={lease.id} value={lease.id}>
                          {lease.propertyAddress} - {(lease.tenantNames || [lease.tenantName]).filter(Boolean).join(', ')} ({formatCurrency(lease.monthlyRent)})
                        </MenuItem>
                      ))}
                    </Select>
                    {validationErrors.leaseId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {validationErrors.leaseId}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <MoneyInput
                    label={t('paymentAmountLabel')}
                    value={formData.amount}
                    onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                    required
                    error={!!validationErrors.amount}
                    helperText={validationErrors.amount}
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

                {selectedLease && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{
                      p: { xs: 1.5, sm: 2 },
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      overflow: 'hidden'
                    }}>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        color="primary"
                        sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
                      >
                        {t('leaseDetails')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                            wordBreak: 'break-word'
                          }}
                        >
                          <strong>{t('propertyInfo')}:</strong> {selectedLease.propertyAddress}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                            wordBreak: 'break-word'
                          }}
                        >
                          <strong>{t('tenants') || 'Inquilino(s)'}:</strong> {(selectedLease.tenantNames || [selectedLease.tenantName]).filter(Boolean).join(', ')}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          <strong>{t('monthlyRent')}:</strong> {formatCurrency(selectedLease.monthlyRent)}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          <strong>{t('leasePeriod')}:</strong> {selectedLease.startDate} - {selectedLease.endDate}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          <strong>{t('adjustmentIndex')}:</strong> {selectedLease.adjustmentIndex}
                        </Typography>
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
                          leaseId: '',
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

          {/* Tab 0: Payment History */}
          {activeTab === 0 && (
            <Box>
              {initialLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : payments.length === 0 ? (
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
                    {t('noPayments')}
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    {t('noPaymentsDesc')}
                  </Typography>
                </Paper>
              ) : (
              <>
              {/* Filters Section */}
              <Box sx={{ mb: 3 }}>
                {/* Status Filter Tabs */}
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 2
                }}>
                  <Tabs
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    sx={{
                      minHeight: 40,
                      '& .MuiTab-root': { minHeight: 40, py: 1, px: 2 }
                    }}
                  >
                    <Tab
                      label={`${t('filterAll')} (${statusCounts.all})`}
                      value="all"
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab
                      label={`${t('paid')} (${statusCounts.paid})`}
                      value="paid"
                      sx={{ textTransform: 'none' }}
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      iconPosition="start"
                    />
                    <Tab
                      label={`${t('pending')} (${statusCounts.pending})`}
                      value="pending"
                      sx={{ textTransform: 'none' }}
                      icon={<Schedule sx={{ fontSize: 16 }} />}
                      iconPosition="start"
                    />
                  </Tabs>

                  {/* Search Field */}
                  <TextField
                    size="small"
                    placeholder={t('searchPaymentsPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ minWidth: { xs: '100%', sm: 250 } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <ClearIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                {/* Active Filter Chips */}
                {(activeFilterLabels.length > 0 || hasActiveFilters) && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {activeFilterLabels.map((filter, index) => (
                      <Chip
                        key={index}
                        label={filter.label}
                        size="small"
                        icon={filter.type === 'property' ? <Home sx={{ fontSize: 16 }} /> : <Person sx={{ fontSize: 16 }} />}
                        onDelete={() => filter.type === 'property' ? setPropertyFilter(null) : setTenantFilter(null)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {hasActiveFilters && (
                      <Button
                        size="small"
                        onClick={handleClearFilters}
                        startIcon={<ClearIcon />}
                        sx={{ textTransform: 'none' }}
                      >
                        {t('clearFilters')}
                      </Button>
                    )}
                  </Box>
                )}

                {/* No Results Message */}
                {displayPayments.length === 0 && hasActiveFilters && (
                  <Paper
                    sx={{
                      p: 3,
                      mt: 2,
                      textAlign: 'center',
                      bgcolor: 'background.default',
                      border: '1px dashed',
                      borderColor: 'divider'
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      {t('noPaymentsMatchFilter')}
                    </Typography>
                    <Button
                      size="small"
                      onClick={handleClearFilters}
                      sx={{ mt: 1, textTransform: 'none' }}
                    >
                      {t('clearFilters')}
                    </Button>
                  </Paper>
                )}
              </Box>

              {displayPayments.length > 0 && (
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

                {/* Lease Info */}
                {(selectedPayment.leaseStartDate || selectedPayment.leaseEndDate) && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      {t('leaseInfo')}
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        mb: 2,
                        cursor: onNavigateToLease && selectedPayment.leaseId ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        '&:hover': onNavigateToLease && selectedPayment.leaseId ? {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover'
                        } : {}
                      }}
                      onClick={() => {
                        if (onNavigateToLease && selectedPayment.leaseId) {
                          setDetailDialogOpen(false)
                          onNavigateToLease(selectedPayment.leaseId)
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Description sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary">{t('leasePeriod')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedPayment.leaseStartDate} - {selectedPayment.leaseEndDate}
                          </Typography>
                        </Box>
                        {onNavigateToLease && selectedPayment.leaseId && (
                          <OpenInNew sx={{ fontSize: 16, color: 'text.secondary' }} />
                        )}
                      </Box>
                    </Paper>
                  </>
                )}

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
                  {t('tenants') || 'Inquilino(s)'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                  {(selectedPayment.tenantNames || [selectedPayment.tenantName]).filter(Boolean).map((tenantName, index) => {
                    const tenantId = selectedPayment.tenantIds?.[index] || selectedPayment.tenantId
                    return (
                      <Paper
                        key={tenantId || index}
                        variant="outlined"
                        sx={{
                          p: 2,
                          cursor: onNavigateToTenant && tenantId ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          '&:hover': onNavigateToTenant && tenantId ? {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover'
                          } : {}
                        }}
                        onClick={() => {
                          if (onNavigateToTenant && tenantId) {
                            setDetailDialogOpen(false)
                            onNavigateToTenant(tenantId)
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Person sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>{tenantName}</Typography>
                          {onNavigateToTenant && tenantId && (
                            <OpenInNew sx={{ fontSize: 16, color: 'text.secondary' }} />
                          )}
                        </Box>
                      </Paper>
                    )
                  })}
                </Box>

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
