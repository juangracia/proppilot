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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  InputAdornment,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Checkbox,
  OutlinedInput,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Description,
  Close,
  Home,
  Person,
  CalendarToday,
  AttachMoney,
  TrendingUp,
  CheckCircle,
  Cancel,
  OpenInNew,
  Add as AddIcon,
  Delete,
  Restore,
  DeleteForever,
  Search,
  Clear,
  Payment as PaymentIcon,
  Schedule
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format, addYears, addMonths } from 'date-fns'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'
import MoneyInput from './MoneyInput'
import { useCountries } from '../hooks/useCountries'

const LeaseForm = memo(function LeaseForm({ onNavigateToProperty, onNavigateToTenant, onNavigateToPayment, initialLeaseId, onLeaseViewed, openAddForm, onAddFormOpened }) {
  const { t, formatCurrency, currency, formatNumber } = useLanguage()
  const { countries, getAvailableIndices } = useCountries()
  const [activeTab, setActiveTab] = useState(0)

  const [formData, setFormData] = useState({
    propertyUnitId: '',
    tenantIds: [],
    startDate: new Date(),
    endDate: addYears(new Date(), 2),
    monthlyRent: '',
    countryCode: 'AR',
    adjustmentIndex: 'ICL',
    adjustmentFrequencyMonths: 12
  })

  const [selectedPeriod, setSelectedPeriod] = useState(24)

  const [validationErrors, setValidationErrors] = useState({})
  const [propertyUnits, setPropertyUnits] = useState([])
  const [tenants, setTenants] = useState([])
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedLease, setSelectedLease] = useState(null)
  const [deletedLeases, setDeletedLeases] = useState([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leaseToDelete, setLeaseToDelete] = useState(null)
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(0)
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false)
  const [leaseToPermDelete, setLeaseToPermDelete] = useState(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [leaseToRestore, setLeaseToRestore] = useState(null)
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false)
  const [leaseToTerminate, setLeaseToTerminate] = useState(null)
  const [terminateConfirmStep, setTerminateConfirmStep] = useState(0)
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)
  const [leaseToReactivate, setLeaseToReactivate] = useState(null)
  const [leasePayments, setLeasePayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  // Inline creation dialogs
  const [newTenantDialogOpen, setNewTenantDialogOpen] = useState(false)
  const [newPropertyDialogOpen, setNewPropertyDialogOpen] = useState(false)
  const [newTenantData, setNewTenantData] = useState({ fullName: '', nationalId: '', email: '', phone: '' })
  const [newPropertyData, setNewPropertyData] = useState({ address: '', type: '', baseRentAmount: '' })
  const [newTenantErrors, setNewTenantErrors] = useState({})
  const [newPropertyErrors, setNewPropertyErrors] = useState({})
  const [creatingTenant, setCreatingTenant] = useState(false)
  const [creatingProperty, setCreatingProperty] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE') // 'all', 'ACTIVE', 'EXPIRED', 'TERMINATED'

  const indexLabels = useMemo(() => ({
    ICL: t('indexICL'),
    IPC: t('indexIPC'),
    DOLAR_BLUE: t('indexDolarBlue'),
    DOLAR_OFICIAL: t('indexDolarOficial'),
    DOLAR_MEP: t('indexDolarMep'),
    NONE: t('indexFixed')
  }), [t])

  const adjustmentIndices = useMemo(() => {
    const availableIndices = getAvailableIndices(formData.countryCode)
    return availableIndices.map(index => ({
      value: index,
      label: indexLabels[index] || index
    }))
  }, [formData.countryCode, getAvailableIndices, indexLabels])

  const periodOptions = useMemo(() => [
    { value: 6, label: t('sixMonths') },
    { value: 12, label: t('oneYear') },
    { value: 24, label: t('twoYears') },
    { value: 36, label: t('threeYears') },
    { value: 'custom', label: t('customPeriod') }
  ], [t])

  const fetchData = useCallback(async () => {
    try {
      setInitialLoading(true)
      const [propertiesRes, tenantsRes, leasesRes, deletedLeasesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/property-units`),
        axios.get(`${API_BASE_URL}/tenants`),
        axios.get(`${API_BASE_URL}/leases`),
        axios.get(`${API_BASE_URL}/leases/deleted`)
      ])
      setPropertyUnits(Array.isArray(propertiesRes.data) ? propertiesRes.data : [])
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : [])
      setLeases(Array.isArray(leasesRes.data) ? leasesRes.data : [])
      setDeletedLeases(Array.isArray(deletedLeasesRes.data) ? deletedLeasesRes.data : [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-select and show lease detail when initialLeaseId is provided
  useEffect(() => {
    if (initialLeaseId && leases.length > 0) {
      const lease = leases.find(l => l.id === initialLeaseId)
      if (lease) {
        setSelectedLease(lease)
        setDetailDialogOpen(true)
        if (onLeaseViewed) {
          onLeaseViewed()
        }
      }
    }
  }, [initialLeaseId, leases, onLeaseViewed])

  // Auto-switch to new contract tab when openAddForm is true
  useEffect(() => {
    if (openAddForm) {
      setActiveTab(1) // Tab 1 is "New Contract"
      onAddFormOpened?.()
    }
  }, [openAddForm, onAddFormOpened])

  // Fetch payments when a lease is selected for detail view
  useEffect(() => {
    if (selectedLease && detailDialogOpen) {
      const fetchLeasePayments = async () => {
        setLoadingPayments(true)
        try {
          const response = await axios.get(`${API_BASE_URL}/payments/lease/${selectedLease.id}`)
          setLeasePayments(Array.isArray(response.data) ? response.data : [])
        } catch (err) {
          console.error('Failed to fetch payments for lease:', err)
          setLeasePayments([])
        } finally {
          setLoadingPayments(false)
        }
      }
      fetchLeasePayments()
    } else {
      setLeasePayments([])
    }
  }, [selectedLease, detailDialogOpen])

  // Auto-fill rent and set default end date when property or start date changes
  const handlePropertyChange = useCallback((propertyId) => {
    const selectedUnit = propertyUnits.find(u => u.id === parseInt(propertyId))
    setFormData(prev => ({
      ...prev,
      propertyUnitId: propertyId,
      monthlyRent: selectedUnit ? selectedUnit.baseRentAmount.toString() : prev.monthlyRent
    }))
  }, [propertyUnits])

  const handleStartDateChange = useCallback((date) => {
    setFormData(prev => {
      let newEndDate = prev.endDate
      if (date && selectedPeriod !== 'custom') {
        newEndDate = addMonths(date, selectedPeriod)
      }
      return {
        ...prev,
        startDate: date,
        endDate: newEndDate
      }
    })
  }, [selectedPeriod])

  const handlePeriodChange = useCallback((event, newPeriod) => {
    if (newPeriod === null) return
    setSelectedPeriod(newPeriod)
    if (newPeriod !== 'custom' && formData.startDate) {
      setFormData(prev => ({
        ...prev,
        endDate: addMonths(prev.startDate, newPeriod)
      }))
    }
  }, [formData.startDate])

  const handleEndDateChange = useCallback((date) => {
    setSelectedPeriod('custom')
    setFormData(prev => ({ ...prev, endDate: date }))
  }, [])

  const validateForm = useCallback(() => {
    const errors = {}

    if (!formData.propertyUnitId) {
      errors.propertyUnitId = t('propertyRequired') || 'Propiedad requerida'
    }

    if (!formData.tenantIds || formData.tenantIds.length === 0) {
      errors.tenantIds = t('tenantRequired') || 'Inquilino requerido'
    }

    if (!formData.startDate) {
      errors.startDate = t('startDateRequired') || 'Fecha de inicio requerida'
    }

    if (!formData.endDate) {
      errors.endDate = t('endDateRequired') || 'Fecha de fin requerida'
    } else if (formData.startDate && formData.endDate <= formData.startDate) {
      errors.endDate = t('endDateAfterStart') || 'La fecha de fin debe ser posterior a la de inicio'
    } else if (formData.startDate && formData.endDate) {
      // Check minimum lease duration (at least 1 month)
      const diffMs = formData.endDate - formData.startDate
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      if (diffDays < 30) {
        errors.endDate = t('minLeaseDuration') || 'El contrato debe durar al menos 1 mes'
      }
    }

    if (!formData.monthlyRent) {
      errors.monthlyRent = t('rentRequired') || 'Alquiler mensual requerido'
    } else {
      const rent = parseFloat(formData.monthlyRent)
      if (isNaN(rent) || rent <= 0) {
        errors.monthlyRent = t('rentPositive') || 'El alquiler debe ser mayor a 0'
      } else if (rent > 99999999) {
        errors.monthlyRent = t('rentMaxExceeded') || 'El monto excede el límite permitido'
      }
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
      const leaseData = {
        propertyUnitId: parseInt(formData.propertyUnitId),
        tenantIds: formData.tenantIds.map(id => parseInt(id)),
        startDate: format(formData.startDate, 'yyyy-MM-dd'),
        endDate: format(formData.endDate, 'yyyy-MM-dd'),
        monthlyRent: parseFloat(formData.monthlyRent),
        countryCode: formData.countryCode,
        adjustmentIndex: formData.adjustmentIndex,
        adjustmentFrequencyMonths: parseInt(formData.adjustmentFrequencyMonths)
      }

      const response = await axios.post(`${API_BASE_URL}/leases`, leaseData)

      if (response.status === 201) {
        setSuccess(t('leaseCreatedSuccess') || 'Contrato creado exitosamente')
        setLeases(prev => [response.data, ...prev])
        setSelectedPeriod(24)
        setFormData({
          propertyUnitId: '',
          tenantIds: [],
          startDate: new Date(),
          endDate: addYears(new Date(), 2),
          monthlyRent: '',
          countryCode: 'AR',
          adjustmentIndex: 'ICL',
          adjustmentFrequencyMonths: 12
        })
        setValidationErrors({})
      }
    } catch (err) {
      console.error('Error creating lease:', err)

      if (err.response?.status === 400 && err.response?.data?.validationErrors) {
        setValidationErrors(err.response.data.validationErrors)
        setError(t('fixValidationErrors'))
      } else {
        setError(err.response?.data?.message || t('failedToCreateLease') || 'Error al crear el contrato')
      }
    } finally {
      setLoading(false)
    }
  }

  const openTerminateDialog = useCallback((lease) => {
    setLeaseToTerminate(lease)
    setTerminateConfirmStep(0)
    setTerminateDialogOpen(true)
  }, [])

  const handleCloseTerminateDialog = useCallback(() => {
    setTerminateDialogOpen(false)
    setLeaseToTerminate(null)
    setTerminateConfirmStep(0)
  }, [])

  const handleConfirmTerminate = async () => {
    if (!leaseToTerminate) return

    try {
      await axios.post(`${API_BASE_URL}/leases/${leaseToTerminate.id}/terminate`)
      setLeases(prev => prev.map(l =>
        l.id === leaseToTerminate.id ? { ...l, status: 'TERMINATED' } : l
      ))
      handleCloseTerminateDialog()
      setDetailDialogOpen(false)
      setSuccess(t('leaseTerminatedSuccess') || 'Contrato terminado exitosamente')
    } catch (err) {
      console.error('Error terminating lease:', err)
      setError(err.response?.data?.message || 'Error al terminar el contrato')
    }
  }

  const openReactivateDialog = useCallback((lease) => {
    setLeaseToReactivate(lease)
    setReactivateDialogOpen(true)
  }, [])

  const handleCloseReactivateDialog = useCallback(() => {
    setReactivateDialogOpen(false)
    setLeaseToReactivate(null)
  }, [])

  const handleConfirmReactivate = async () => {
    if (!leaseToReactivate) return

    try {
      await axios.post(`${API_BASE_URL}/leases/${leaseToReactivate.id}/reactivate`)
      // Refresh leases to get the new status (could be ACTIVE or EXPIRED)
      const leasesRes = await axios.get(`${API_BASE_URL}/leases`)
      setLeases(Array.isArray(leasesRes.data) ? leasesRes.data : [])
      handleCloseReactivateDialog()
      setDetailDialogOpen(false)
      setSuccess(t('leaseReactivatedSuccess') || 'Contrato reactivado exitosamente')
    } catch (err) {
      console.error('Error reactivating lease:', err)
      setError(err.response?.data?.message || 'Error al reactivar el contrato')
    }
  }

  const openDeleteDialog = useCallback((lease) => {
    setLeaseToDelete(lease)
    setConfirmDeleteStep(lease.status === 'ACTIVE' ? 0 : 1)
    setDeleteDialogOpen(true)
  }, [])

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false)
    setLeaseToDelete(null)
    setConfirmDeleteStep(0)
  }, [])

  const handleDeleteLease = async () => {
    if (!leaseToDelete) return

    try {
      await axios.delete(`${API_BASE_URL}/leases/${leaseToDelete.id}`)
      setLeases(prev => prev.filter(l => l.id !== leaseToDelete.id))
      setDeletedLeases(prev => [...prev, { ...leaseToDelete, deleted: true, deletedAt: new Date().toISOString() }])
      handleCloseDeleteDialog()
      setDetailDialogOpen(false)
      setSuccess(t('leaseDeletedSuccess'))
    } catch (err) {
      console.error('Error deleting lease:', err)
      setError(err.response?.data?.message || t('failedToDeleteLease'))
    }
  }

  const openRestoreDialog = useCallback((lease) => {
    setLeaseToRestore(lease)
    setRestoreDialogOpen(true)
  }, [])

  const handleRestoreLease = async () => {
    if (!leaseToRestore) return

    try {
      await axios.post(`${API_BASE_URL}/leases/${leaseToRestore.id}/restore`)
      setDeletedLeases(prev => prev.filter(l => l.id !== leaseToRestore.id))
      setLeases(prev => [...prev, { ...leaseToRestore, deleted: false, deletedAt: null }])
      setRestoreDialogOpen(false)
      setLeaseToRestore(null)
      setSuccess(t('leaseRestoredSuccess'))
    } catch (err) {
      console.error('Error restoring lease:', err)
      setError(err.response?.data?.message || t('failedToRestoreLease'))
    }
  }

  const openPermanentDeleteDialog = useCallback((lease) => {
    setLeaseToPermDelete(lease)
    setPermanentDeleteDialogOpen(true)
  }, [])

  const handlePermanentDelete = async () => {
    if (!leaseToPermDelete) return

    try {
      await axios.delete(`${API_BASE_URL}/leases/${leaseToPermDelete.id}/permanent`)
      setDeletedLeases(prev => prev.filter(l => l.id !== leaseToPermDelete.id))
      setPermanentDeleteDialogOpen(false)
      setLeaseToPermDelete(null)
      setSuccess(t('leasePermanentlyDeleted'))
    } catch (err) {
      console.error('Error permanently deleting lease:', err)
      setError(err.response?.data?.message || t('failedToPermanentlyDelete'))
    }
  }

  // Inline creation handlers
  const handleCreateTenant = async () => {
    const errors = {}
    if (!newTenantData.fullName.trim()) errors.fullName = t('fullNameRequired') || 'Nombre completo requerido'
    if (!newTenantData.nationalId.trim()) errors.nationalId = t('nationalIdRequired') || 'DNI/CUIT requerido'

    if (Object.keys(errors).length > 0) {
      setNewTenantErrors(errors)
      return
    }

    setCreatingTenant(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/tenants`, newTenantData)
      setTenants(prev => [...prev, response.data])
      setFormData(prev => ({ ...prev, tenantIds: [...prev.tenantIds, response.data.id] }))
      setNewTenantDialogOpen(false)
      setNewTenantData({ fullName: '', nationalId: '', email: '', phone: '' })
      setNewTenantErrors({})
    } catch (err) {
      console.error('Error creating tenant:', err)
      setNewTenantErrors({ submit: err.response?.data?.message || 'Error al crear inquilino' })
    } finally {
      setCreatingTenant(false)
    }
  }

  const handleCreateProperty = async () => {
    const errors = {}
    if (!newPropertyData.address.trim()) errors.address = t('addressRequired') || 'Dirección requerida'
    if (!newPropertyData.type) errors.type = t('typeRequired') || 'Tipo requerido'
    if (!newPropertyData.baseRentAmount || parseFloat(newPropertyData.baseRentAmount) <= 0) {
      errors.baseRentAmount = t('rentPositive') || 'El alquiler debe ser mayor a 0'
    }

    if (Object.keys(errors).length > 0) {
      setNewPropertyErrors(errors)
      return
    }

    setCreatingProperty(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/property-units`, {
        ...newPropertyData,
        baseRentAmount: parseFloat(newPropertyData.baseRentAmount)
      })
      setPropertyUnits(prev => [...prev, response.data])
      handlePropertyChange(response.data.id)
      setNewPropertyDialogOpen(false)
      setNewPropertyData({ address: '', type: '', baseRentAmount: '' })
      setNewPropertyErrors({})
    } catch (err) {
      console.error('Error creating property:', err)
      setNewPropertyErrors({ submit: err.response?.data?.message || 'Error al crear propiedad' })
    } finally {
      setCreatingProperty(false)
    }
  }

  const selectedPropertyUnit = useMemo(() =>
    propertyUnits.find(unit => unit.id === parseInt(formData.propertyUnitId))
  , [propertyUnits, formData.propertyUnitId])

  const selectedTenants = useMemo(() =>
    tenants.filter(tenant => formData.tenantIds.includes(tenant.id))
  , [tenants, formData.tenantIds])

  const handleTabChange = useCallback((e, newValue) => {
    setActiveTab(newValue)
  }, [])

  // Filter counts (include deleted leases count)
  const filterCounts = useMemo(() => {
    const active = leases.filter(l => l.status === 'ACTIVE').length
    const expired = leases.filter(l => l.status === 'EXPIRED').length
    const terminated = leases.filter(l => l.status === 'TERMINATED').length
    const deleted = deletedLeases.length
    return { all: leases.length, active, expired, terminated, deleted }
  }, [leases, deletedLeases])

  // Filtered leases (includes deleted leases when that filter is selected)
  const filteredLeases = useMemo(() => {
    // For DELETED filter, use deletedLeases array
    if (statusFilter === 'DELETED') {
      let filtered = deletedLeases
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(l =>
          l.propertyAddress?.toLowerCase().includes(query) ||
          (l.tenantNames || [l.tenantName]).some(name => name?.toLowerCase().includes(query))
        )
      }
      return filtered
    }

    let filtered = leases

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter)
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(l =>
        l.propertyAddress?.toLowerCase().includes(query) ||
        (l.tenantNames || [l.tenantName]).some(name => name?.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [leases, deletedLeases, statusFilter, searchQuery])

  const hasActiveFilters = (statusFilter !== 'all' && statusFilter !== 'DELETED') || searchQuery.trim() !== ''

  const clearFilters = useCallback(() => {
    setStatusFilter('all')
    setSearchQuery('')
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'EXPIRED': return 'warning'
      case 'TERMINATED': return 'error'
      default: return 'default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return t('leaseActive')
      case 'EXPIRED': return t('leaseExpired')
      case 'TERMINATED': return t('leaseTerminated')
      default: return status
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mx: 0 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={t('leaseList') || 'Contratos'} sx={{ textTransform: 'none' }} />
            <Tab label={t('newLease') || 'Nuevo Contrato'} sx={{ textTransform: 'none' }} />
          </Tabs>

          {/* Tab 1: Create Lease */}
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

              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : (
                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <FormControl fullWidth required error={!!validationErrors.propertyUnitId}>
                          <InputLabel>{t('selectProperty') || 'Seleccionar Propiedad'}</InputLabel>
                          <Select
                            value={formData.propertyUnitId}
                            onChange={(e) => handlePropertyChange(e.target.value)}
                            label={t('selectProperty') || 'Seleccionar Propiedad'}
                          >
                            {propertyUnits.map((unit) => (
                              <MenuItem key={unit.id} value={unit.id}>
                                {unit.address} ({unit.type})
                              </MenuItem>
                            ))}
                          </Select>
                          {validationErrors.propertyUnitId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                              {validationErrors.propertyUnitId}
                            </Typography>
                          )}
                        </FormControl>
                        <Tooltip title={t('addProperty') || 'Agregar Propiedad'}>
                          <IconButton
                            onClick={() => setNewPropertyDialogOpen(true)}
                            sx={{ mt: 1, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <FormControl fullWidth required error={!!validationErrors.tenantIds}>
                          <InputLabel>{t('selectTenants') || 'Seleccionar Inquilino(s)'}</InputLabel>
                          <Select
                            multiple
                            value={formData.tenantIds}
                            onChange={(e) => setFormData(prev => ({ ...prev, tenantIds: e.target.value }))}
                            input={<OutlinedInput label={t('selectTenants') || 'Seleccionar Inquilino(s)'} />}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((id) => {
                                  const tenant = tenants.find(t => t.id === id)
                                  return tenant ? (
                                    <Chip key={id} label={tenant.fullName} size="small" />
                                  ) : null
                                })}
                              </Box>
                            )}
                          >
                            {tenants.map((tenant) => (
                              <MenuItem key={tenant.id} value={tenant.id}>
                                <Checkbox checked={formData.tenantIds.indexOf(tenant.id) > -1} />
                                <ListItemText primary={`${tenant.fullName} - ${formatNumber(tenant.nationalId)}`} />
                              </MenuItem>
                            ))}
                          </Select>
                          {validationErrors.tenantIds && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                              {validationErrors.tenantIds}
                            </Typography>
                          )}
                        </FormControl>
                        <Tooltip title={t('addTenant') || 'Agregar Inquilino'}>
                          <IconButton
                            onClick={() => setNewTenantDialogOpen(true)}
                            sx={{ mt: 1, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {t('leaseDuration')}
                        </Typography>
                        <ToggleButtonGroup
                          value={selectedPeriod}
                          exclusive
                          onChange={handlePeriodChange}
                          size="small"
                          sx={{
                            flexWrap: 'wrap',
                            '& .MuiToggleButton-root': {
                              px: { xs: 1.5, sm: 2 },
                              py: 0.75,
                              textTransform: 'none'
                            }
                          }}
                        >
                          {periodOptions.map((option) => (
                            <ToggleButton key={option.value} value={option.value}>
                              {option.label}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <DatePicker
                        label={t('startDate') || 'Fecha de Inicio'}
                        value={formData.startDate}
                        onChange={handleStartDateChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: !!validationErrors.startDate,
                            helperText: validationErrors.startDate
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <DatePicker
                        label={t('endDate') || 'Fecha de Fin'}
                        value={formData.endDate}
                        onChange={handleEndDateChange}
                        minDate={formData.startDate}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: !!validationErrors.endDate,
                            helperText: validationErrors.endDate
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <MoneyInput
                        label={t('monthlyRent') || 'Alquiler Mensual'}
                        value={formData.monthlyRent}
                        onChange={(value) => setFormData(prev => ({ ...prev, monthlyRent: value }))}
                        required
                        error={!!validationErrors.monthlyRent}
                        helperText={validationErrors.monthlyRent}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        label={t('country') || 'País'}
                        value={formData.countryCode}
                        onChange={(e) => {
                          const newCountry = e.target.value
                          const availableForCountry = getAvailableIndices(newCountry)
                          const newIndex = availableForCountry.includes(formData.adjustmentIndex)
                            ? formData.adjustmentIndex
                            : (availableForCountry.includes('ICL') ? 'ICL' : 'NONE')
                          setFormData(prev => ({
                            ...prev,
                            countryCode: newCountry,
                            adjustmentIndex: newIndex
                          }))
                        }}
                        fullWidth
                        required
                      >
                        {countries.map((country) => (
                          <MenuItem key={country.code} value={country.code}>
                            {country.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        label={t('adjustmentIndex') || 'Índice de Ajuste'}
                        value={formData.adjustmentIndex}
                        onChange={(e) => setFormData(prev => ({ ...prev, adjustmentIndex: e.target.value }))}
                        fullWidth
                        required
                      >
                        {adjustmentIndices.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {formData.adjustmentIndex !== 'NONE' && (
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          select
                          label={t('adjustmentFrequency')}
                          value={formData.adjustmentFrequencyMonths}
                          onChange={(e) => setFormData(prev => ({ ...prev, adjustmentFrequencyMonths: e.target.value }))}
                          fullWidth
                        >
                          <MenuItem value={1}>{t('monthly')}</MenuItem>
                          <MenuItem value={2}>{t('bimonthly')}</MenuItem>
                          <MenuItem value={3}>{t('quarterly')}</MenuItem>
                          <MenuItem value={6}>{t('semiannual')}</MenuItem>
                          <MenuItem value={12}>{t('annual')}</MenuItem>
                        </TextField>
                      </Grid>
                    )}

                    {(selectedPropertyUnit || selectedTenants.length > 0) && (
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{
                          p: { xs: 1.5, sm: 2 },
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: 'background.default'
                        }}>
                          <Typography variant="subtitle2" gutterBottom color="primary">
                            {t('leaseSummary') || 'Resumen del Contrato'}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {selectedPropertyUnit && (
                              <Typography variant="body2">
                                <strong>{t('propertyInfo') || 'Propiedad'}:</strong> {selectedPropertyUnit.address}
                              </Typography>
                            )}
                            {selectedTenants.length > 0 && (
                              <Typography variant="body2">
                                <strong>{t('tenants') || 'Inquilino(s)'}:</strong> {selectedTenants.map(t => t.fullName).join(', ')}
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
                            setSelectedPeriod(24)
                            setFormData({
                              propertyUnitId: '',
                              tenantIds: [],
                              startDate: new Date(),
                              endDate: addYears(new Date(), 2),
                              monthlyRent: '',
                              countryCode: 'AR',
                              adjustmentIndex: 'ICL',
                              adjustmentFrequencyMonths: 12
                            })
                            setError('')
                            setSuccess('')
                            setValidationErrors({})
                          }}
                          sx={{ minWidth: { xs: '100%', sm: 100 } }}
                        >
                          {t('clearForm')}
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={loading}
                          sx={{ minWidth: { xs: '100%', sm: 140 } }}
                        >
                          {loading ? <CircularProgress size={24} color="inherit" /> : (t('createLease') || 'Crear Contrato')}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </>
          )}

          {/* Tab 0: Lease List */}
          {activeTab === 0 && (
            <Box>
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
                    {t('noLeases')}
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    {t('noLeasesDesc')}
                  </Typography>
                </Paper>
              ) : (
                <>
                  {/* Filters */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
                      <Tabs
                        value={statusFilter}
                        onChange={(e, val) => setStatusFilter(val)}
                        sx={{
                          minHeight: 36,
                          '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontSize: '0.875rem' }
                        }}
                        variant="scrollable"
                        scrollButtons="auto"
                      >
                        <Tab value="all" label={`${t('all')} (${filterCounts.all})`} />
                        <Tab
                          value="ACTIVE"
                          icon={<CheckCircle sx={{ fontSize: 16 }} />}
                          iconPosition="start"
                          label={`${t('activeLeases') || 'Activos'} (${filterCounts.active})`}
                        />
                        <Tab
                          value="EXPIRED"
                          icon={<CalendarToday sx={{ fontSize: 16 }} />}
                          iconPosition="start"
                          label={`${t('expiredLeases') || 'Vencidos'} (${filterCounts.expired})`}
                        />
                        <Tab
                          value="TERMINATED"
                          icon={<Cancel sx={{ fontSize: 16 }} />}
                          iconPosition="start"
                          label={`${t('terminatedLeases') || 'Terminados'} (${filterCounts.terminated})`}
                        />
                        <Tab
                          value="DELETED"
                          icon={<Delete sx={{ fontSize: 16 }} />}
                          iconPosition="start"
                          label={`${t('deletedContractsMenu') || 'Eliminados'} (${filterCounts.deleted})`}
                        />
                      </Tabs>
                      <TextField
                        size="small"
                        placeholder={t('searchLeasesPlaceholder') || 'Buscar por propiedad o inquilino...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 280 } }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                          endAdornment: searchQuery && (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setSearchQuery('')}>
                                <Clear sx={{ fontSize: 18 }} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Box>
                    {hasActiveFilters && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          startIcon={<Clear sx={{ fontSize: 16 }} />}
                          onClick={clearFilters}
                          sx={{ textTransform: 'none' }}
                        >
                          {t('clearFilters') || 'Limpiar filtros'}
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {/* Empty state for filtered results */}
                  {filteredLeases.length === 0 && (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', border: '2px dashed', borderColor: 'divider' }}>
                      {statusFilter === 'DELETED' ? (
                        <>
                          <Delete sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            {t('noDeletedContracts') || 'No hay contratos eliminados'}
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            {t('noDeletedContractsDesc') || 'Los contratos eliminados aparecerán aquí'}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Description sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            {t('noLeasesMatchFilter') || 'No hay contratos que coincidan con los filtros'}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<Clear sx={{ fontSize: 16 }} />}
                            onClick={clearFilters}
                            sx={{ textTransform: 'none', mt: 1 }}
                          >
                            {t('clearFilters') || 'Limpiar filtros'}
                          </Button>
                        </>
                      )}
                    </Paper>
                  )}

                  {/* Show info alert for deleted contracts */}
                  {statusFilter === 'DELETED' && filteredLeases.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {t('deletedContractsInfo') || 'Estos contratos han sido eliminados pero pueden ser restaurados o eliminados permanentemente.'}
                    </Alert>
                  )}

                  {filteredLeases.length > 0 && (
                  <>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('propertyInfo') || 'Propiedad'}</TableCell>
                            <TableCell>{t('tenant')}</TableCell>
                            <TableCell>{t('leasePeriod') || 'Período'}</TableCell>
                            <TableCell>{statusFilter === 'DELETED' ? (t('deletedAt') || 'Eliminado') : (t('monthlyRent') || 'Alquiler')}</TableCell>
                            <TableCell>{statusFilter === 'DELETED' ? (t('actions')) : (t('status'))}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredLeases.map((lease) => (
                            <TableRow
                              key={lease.id}
                              hover
                              onClick={statusFilter !== 'DELETED' ? () => { setSelectedLease(lease); setDetailDialogOpen(true) } : undefined}
                              sx={{ cursor: statusFilter !== 'DELETED' ? 'pointer' : 'default', opacity: statusFilter === 'DELETED' ? 0.8 : 1 }}
                            >
                              <TableCell>{lease.propertyAddress}</TableCell>
                              <TableCell>
                                {(lease.tenantNames || [lease.tenantName]).filter(Boolean).map((name, idx) => (
                                  <Box key={idx}>{name}</Box>
                                ))}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="body2">{lease.startDate}</Typography>
                                  <Typography variant="body2">{lease.endDate}</Typography>
                                  {(() => {
                                    const start = new Date(lease.startDate)
                                    const end = new Date(lease.endDate)
                                    const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30))
                                    return (
                                      <Typography variant="caption" color="text.secondary">
                                        {months} {t('months') || 'meses'}
                                      </Typography>
                                    )
                                  })()}
                                </Box>
                              </TableCell>
                              {statusFilter === 'DELETED' ? (
                                <>
                                  <TableCell>
                                    {lease.deletedAt ? new Date(lease.deletedAt).toLocaleDateString() : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Tooltip title={t('restoreLease') || 'Restaurar'}>
                                      <IconButton
                                        color="primary"
                                        onClick={(e) => { e.stopPropagation(); openRestoreDialog(lease) }}
                                        size="small"
                                      >
                                        <Restore />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('permanentlyDelete') || 'Eliminar permanentemente'}>
                                      <IconButton
                                        color="error"
                                        onClick={(e) => { e.stopPropagation(); openPermanentDeleteDialog(lease) }}
                                        size="small"
                                      >
                                        <DeleteForever />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(lease.monthlyRent)}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={getStatusLabel(lease.status)}
                                      size="small"
                                      color={getStatusColor(lease.status)}
                                    />
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                    {filteredLeases.map((lease) => (
                      <Paper
                        key={lease.id}
                        variant="outlined"
                        onClick={statusFilter !== 'DELETED' ? () => { setSelectedLease(lease); setDetailDialogOpen(true) } : undefined}
                        sx={{
                          p: 2,
                          mb: 2,
                          cursor: statusFilter !== 'DELETED' ? 'pointer' : 'default',
                          opacity: statusFilter === 'DELETED' ? 0.9 : 1,
                          bgcolor: statusFilter === 'DELETED' ? 'action.hover' : 'background.paper',
                          '&:hover': statusFilter !== 'DELETED' ? { boxShadow: 2 } : {}
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {lease.propertyAddress}
                          </Typography>
                          {statusFilter === 'DELETED' ? (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                color="primary"
                                onClick={(e) => { e.stopPropagation(); openRestoreDialog(lease) }}
                                size="small"
                              >
                                <Restore fontSize="small" />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={(e) => { e.stopPropagation(); openPermanentDeleteDialog(lease) }}
                                size="small"
                              >
                                <DeleteForever fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Chip
                              label={getStatusLabel(lease.status)}
                              size="small"
                              color={getStatusColor(lease.status)}
                            />
                          )}
                        </Box>
                        <Box sx={{ mb: 1 }}>
                          {(lease.tenantNames || [lease.tenantName]).filter(Boolean).map((name, idx) => (
                            <Typography key={idx} variant="body2" color="text.secondary">{name}</Typography>
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {statusFilter === 'DELETED' ? (
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {lease.startDate} - {lease.endDate}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {t('deletedAt')}: {lease.deletedAt ? new Date(lease.deletedAt).toLocaleDateString() : '-'}
                              </Typography>
                            </>
                          ) : (
                            <>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {formatCurrency(lease.monthlyRent)}
                              </Typography>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {lease.startDate}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {lease.endDate}
                                </Typography>
                                {(() => {
                                  const start = new Date(lease.startDate)
                                  const end = new Date(lease.endDate)
                                  const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30))
                                  return (
                                    <Typography variant="caption" color="text.secondary">
                                      {months} {t('months') || 'meses'}
                                    </Typography>
                                  )
                                })()}
                              </Box>
                            </>
                          )}
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

        {/* Lease Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedLease && (
            <>
              <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <Description />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('leaseDetails') || 'Detalles del Contrato'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      #{selectedLease.id}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                  <Close />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Box sx={{ mb: 3 }}>
                  <Chip
                    label={getStatusLabel(selectedLease.status)}
                    color={getStatusColor(selectedLease.status)}
                    sx={{ fontWeight: 500 }}
                  />
                </Box>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('leasePeriod') || 'Período'}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <CalendarToday sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedLease.startDate} - {selectedLease.endDate}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AttachMoney sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t('monthlyRent') || 'Alquiler Mensual'}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(selectedLease.monthlyRent)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('adjustmentInfo') || 'Ajuste'}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TrendingUp sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedLease.adjustmentIndex} - cada {selectedLease.adjustmentFrequencyMonths} meses
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('propertyInfo')}
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 2,
                    cursor: onNavigateToProperty && selectedLease.propertyUnitIdRef ? 'pointer' : 'default',
                    '&:hover': onNavigateToProperty && selectedLease.propertyUnitIdRef ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {}
                  }}
                  onClick={() => {
                    if (onNavigateToProperty && selectedLease.propertyUnitIdRef) {
                      setDetailDialogOpen(false)
                      onNavigateToProperty(selectedLease.propertyUnitIdRef)
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Home sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                      {selectedLease.propertyAddress}
                    </Typography>
                    {onNavigateToProperty && selectedLease.propertyUnitIdRef && <OpenInNew sx={{ fontSize: 16, color: 'text.secondary' }} />}
                  </Box>
                </Paper>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('tenants') || 'Inquilino(s)'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {(selectedLease.tenantNames || [selectedLease.tenantName]).map((tenantName, index) => {
                    const tenantId = selectedLease.tenantIdRefs?.[index] || selectedLease.tenantIdRef
                    const tenantEmail = selectedLease.tenantEmails?.[index] || selectedLease.tenantEmail
                    return (
                      <Paper
                        key={tenantId || index}
                        variant="outlined"
                        sx={{
                          p: 2,
                          cursor: onNavigateToTenant && tenantId ? 'pointer' : 'default',
                          '&:hover': onNavigateToTenant && tenantId ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {}
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
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {tenantName}
                            </Typography>
                            {tenantEmail && (
                              <Typography variant="caption" color="text.secondary">
                                {tenantEmail}
                              </Typography>
                            )}
                          </Box>
                          {onNavigateToTenant && tenantId && <OpenInNew sx={{ fontSize: 16, color: 'text.secondary' }} />}
                        </Box>
                      </Paper>
                    )
                  })}
                </Box>

                {/* Latest Payments Section */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, mt: 3, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('latestPayments')}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {loadingPayments ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : leasePayments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('noPaymentsForLease')}
                      </Typography>
                      {onNavigateToPayment && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={() => {
                            setDetailDialogOpen(false)
                            onNavigateToPayment({ leaseId: selectedLease?.id })
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          {t('registerPayment')}
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <>
                      {/* Payment Status Indicator */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        {leasePayments.some(p => p.status === 'PENDING') ? (
                          <Chip
                            icon={<Schedule sx={{ fontSize: 16 }} />}
                            label={t('paymentsPending')}
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        ) : (
                          <Chip
                            icon={<CheckCircle sx={{ fontSize: 16 }} />}
                            label={t('upToDate')}
                            color="success"
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        )}
                      </Box>

                      {/* Recent Payments List (max 3) */}
                      <List dense sx={{ py: 0 }}>
                        {leasePayments.slice(0, 3).map((payment, index) => (
                          <React.Fragment key={payment.id}>
                            {index > 0 && <Divider />}
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <PaymentIcon sx={{ fontSize: 20, color: payment.status === 'PAID' ? 'success.main' : 'warning.main' }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {formatCurrency(payment.amount)}
                                    </Typography>
                                    <Chip
                                      label={payment.status === 'PAID' ? t('paid') : t('pending')}
                                      color={payment.status === 'PAID' ? 'success' : 'warning'}
                                      size="small"
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  </Box>
                                }
                                secondary={payment.paymentDate}
                              />
                            </ListItem>
                          </React.Fragment>
                        ))}
                      </List>
                      {leasePayments.length > 3 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                          +{leasePayments.length - 3} {t('paymentsMenu').toLowerCase()}
                        </Typography>
                      )}
                    </>
                  )}
                </Paper>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Button
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => openDeleteDialog(selectedLease)}
                >
                  {t('delete')}
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {selectedLease.status === 'ACTIVE' && (
                    <Button
                      color="warning"
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={() => openTerminateDialog(selectedLease)}
                    >
                      {t('terminateLease') || 'Terminar'}
                    </Button>
                  )}
                  {selectedLease.status === 'TERMINATED' && (
                    <Button
                      color="success"
                      variant="outlined"
                      startIcon={<CheckCircle />}
                      onClick={() => openReactivateDialog(selectedLease)}
                    >
                      {t('reactivateLease') || 'Reactivar'}
                    </Button>
                  )}
                  <Button onClick={() => setDetailDialogOpen(false)}>
                    {t('close') || 'Cerrar'}
                  </Button>
                </Box>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* New Property Dialog */}
        <Dialog
          open={newPropertyDialogOpen}
          onClose={() => {
            setNewPropertyDialogOpen(false)
            setNewPropertyData({ address: '', type: '', baseRentAmount: '' })
            setNewPropertyErrors({})
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Home sx={{ color: 'primary.main' }} />
              <Typography variant="h6">{t('addProperty') || 'Agregar Propiedad'}</Typography>
            </Box>
            <IconButton onClick={() => setNewPropertyDialogOpen(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {newPropertyErrors.submit && (
              <Alert severity="error" sx={{ mb: 2 }}>{newPropertyErrors.submit}</Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label={t('address') || 'Dirección'}
                value={newPropertyData.address}
                onChange={(e) => setNewPropertyData(prev => ({ ...prev, address: e.target.value }))}
                fullWidth
                required
                error={!!newPropertyErrors.address}
                helperText={newPropertyErrors.address}
              />
              <TextField
                select
                label={t('propertyType') || 'Tipo de Propiedad'}
                value={newPropertyData.type}
                onChange={(e) => setNewPropertyData(prev => ({ ...prev, type: e.target.value }))}
                fullWidth
                required
                error={!!newPropertyErrors.type}
                helperText={newPropertyErrors.type}
              >
                <MenuItem value="Apartment">{t('apartment') || 'Departamento'}</MenuItem>
                <MenuItem value="House">{t('house') || 'Casa'}</MenuItem>
                <MenuItem value="Commercial">{t('commercial') || 'Comercial'}</MenuItem>
              </TextField>
              <MoneyInput
                label={t('baseRent') || 'Alquiler Base'}
                value={newPropertyData.baseRentAmount}
                onChange={(value) => setNewPropertyData(prev => ({ ...prev, baseRentAmount: value }))}
                required
                error={!!newPropertyErrors.baseRentAmount}
                helperText={newPropertyErrors.baseRentAmount}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setNewPropertyDialogOpen(false)} disabled={creatingProperty}>
              {t('cancel') || 'Cancelar'}
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateProperty}
              disabled={creatingProperty}
              startIcon={creatingProperty ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            >
              {t('create') || 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Tenant Dialog */}
        <Dialog
          open={newTenantDialogOpen}
          onClose={() => {
            setNewTenantDialogOpen(false)
            setNewTenantData({ fullName: '', nationalId: '', email: '', phone: '' })
            setNewTenantErrors({})
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Person sx={{ color: 'primary.main' }} />
              <Typography variant="h6">{t('addTenant') || 'Agregar Inquilino'}</Typography>
            </Box>
            <IconButton onClick={() => setNewTenantDialogOpen(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {newTenantErrors.submit && (
              <Alert severity="error" sx={{ mb: 2 }}>{newTenantErrors.submit}</Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label={t('fullName') || 'Nombre Completo'}
                value={newTenantData.fullName}
                onChange={(e) => setNewTenantData(prev => ({ ...prev, fullName: e.target.value }))}
                fullWidth
                required
                error={!!newTenantErrors.fullName}
                helperText={newTenantErrors.fullName}
              />
              <TextField
                label={t('nationalId') || 'DNI/CUIT'}
                value={newTenantData.nationalId}
                onChange={(e) => setNewTenantData(prev => ({ ...prev, nationalId: e.target.value }))}
                fullWidth
                required
                error={!!newTenantErrors.nationalId}
                helperText={newTenantErrors.nationalId}
              />
              <TextField
                label={t('email') || 'Email'}
                type="email"
                value={newTenantData.email}
                onChange={(e) => setNewTenantData(prev => ({ ...prev, email: e.target.value }))}
                fullWidth
              />
              <TextField
                label={t('phone') || 'Teléfono'}
                value={newTenantData.phone}
                onChange={(e) => setNewTenantData(prev => ({ ...prev, phone: e.target.value }))}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setNewTenantDialogOpen(false)} disabled={creatingTenant}>
              {t('cancel') || 'Cancelar'}
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateTenant}
              disabled={creatingTenant}
              startIcon={creatingTenant ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            >
              {t('create') || 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog with Double Confirmation for Active Contracts */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {confirmDeleteStep === 0
              ? (t('confirmDeleteActiveLease') || '¡Atención! Este es un contrato activo.')
              : t('confirmDelete')}
          </DialogTitle>
          <DialogContent>
            {confirmDeleteStep === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('confirmDeleteActiveLeaseWarning') || 'Estás a punto de eliminar un contrato que está actualmente en vigencia. Esta acción puede afectar los registros de pagos y otros datos relacionados.'}
              </Alert>
            ) : (
              <>
                <Typography>
                  {t('confirmDeleteLeaseMessage') || '¿Estás seguro de que deseas eliminar este contrato? El contrato podrá ser restaurado desde la pestaña "Eliminados".'}
                </Typography>
                {leaseToDelete && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {leaseToDelete.propertyAddress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(leaseToDelete.tenantNames || [leaseToDelete.tenantName]).filter(Boolean).join(', ')} • {leaseToDelete.startDate} - {leaseToDelete.endDate}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>
              {t('cancel')}
            </Button>
            {confirmDeleteStep === 0 ? (
              <Button
                variant="contained"
                color="warning"
                onClick={() => setConfirmDeleteStep(1)}
              >
                {t('understand') || 'Entiendo, continuar'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                startIcon={<Delete />}
                onClick={handleDeleteLease}
              >
                {t('delete')}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Restore Confirmation Dialog */}
        <Dialog
          open={restoreDialogOpen}
          onClose={() => { setRestoreDialogOpen(false); setLeaseToRestore(null) }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {t('confirmRestore') || 'Confirmar Restauración'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {t('confirmRestoreMessage') || '¿Estás seguro de que deseas restaurar este contrato?'}
            </Typography>
            {leaseToRestore && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {leaseToRestore.propertyAddress}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(leaseToRestore.tenantNames || [leaseToRestore.tenantName]).filter(Boolean).join(', ')} • {leaseToRestore.startDate} - {leaseToRestore.endDate}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setRestoreDialogOpen(false); setLeaseToRestore(null) }}>
              {t('cancel')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Restore />}
              onClick={handleRestoreLease}
            >
              {t('restoreLease') || 'Restaurar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Permanent Delete Confirmation Dialog */}
        <Dialog
          open={permanentDeleteDialogOpen}
          onClose={() => { setPermanentDeleteDialogOpen(false); setLeaseToPermDelete(null) }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>
            {t('confirmPermanentDelete') || '¡Eliminar Permanentemente!'}
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('permanentDeleteWarning') || 'Esta acción no se puede deshacer. El contrato será eliminado permanentemente y no podrá ser recuperado.'}
            </Alert>
            {leaseToPermDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {leaseToPermDelete.propertyAddress}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(leaseToPermDelete.tenantNames || [leaseToPermDelete.tenantName]).filter(Boolean).join(', ')} • {leaseToPermDelete.startDate} - {leaseToPermDelete.endDate}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setPermanentDeleteDialogOpen(false); setLeaseToPermDelete(null) }}>
              {t('cancel')}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteForever />}
              onClick={handlePermanentDelete}
            >
              {t('permanentlyDelete') || 'Eliminar Permanentemente'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Terminate Confirmation Dialog with Double Confirmation */}
        <Dialog
          open={terminateDialogOpen}
          onClose={handleCloseTerminateDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'warning.main' }}>
            {terminateConfirmStep === 0
              ? (t('confirmTerminateStep1') || '¿Terminar este contrato?')
              : (t('confirmTerminateStep2') || 'Confirmar terminación')}
          </DialogTitle>
          <DialogContent>
            {terminateConfirmStep === 0 ? (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {t('terminateWarningStep1') || 'Terminar un contrato lo marcará como finalizado anticipadamente. Esta acción es reversible - podrás reactivar el contrato luego si es necesario.'}
                </Alert>
                {leaseToTerminate && (
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {leaseToTerminate.propertyAddress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(leaseToTerminate.tenantNames || [leaseToTerminate.tenantName]).filter(Boolean).join(', ')} • {leaseToTerminate.startDate} - {leaseToTerminate.endDate}
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {t('terminateWarningStep2') || '¿Estás seguro de que deseas terminar este contrato? El inquilino ya no estará asociado a esta propiedad de forma activa.'}
                </Alert>
                {leaseToTerminate && (
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {leaseToTerminate.propertyAddress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(leaseToTerminate.tenantNames || [leaseToTerminate.tenantName]).filter(Boolean).join(', ')} • {leaseToTerminate.startDate} - {leaseToTerminate.endDate}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTerminateDialog}>
              {t('cancel')}
            </Button>
            {terminateConfirmStep === 0 ? (
              <Button
                variant="contained"
                color="warning"
                onClick={() => setTerminateConfirmStep(1)}
              >
                {t('continue') || 'Continuar'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                startIcon={<Cancel />}
                onClick={handleConfirmTerminate}
              >
                {t('confirmTerminate') || 'Sí, terminar contrato'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Reactivate Confirmation Dialog */}
        <Dialog
          open={reactivateDialogOpen}
          onClose={handleCloseReactivateDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'success.main' }}>
            {t('confirmReactivate') || 'Reactivar Contrato'}
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('reactivateInfo') || 'Reactivar este contrato lo volverá a marcar como activo (o vencido si la fecha de fin ya pasó). Asegúrate de que no haya otro contrato activo para esta propiedad en el mismo período.'}
            </Alert>
            {leaseToReactivate && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {leaseToReactivate.propertyAddress}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(leaseToReactivate.tenantNames || [leaseToReactivate.tenantName]).filter(Boolean).join(', ')} • {leaseToReactivate.startDate} - {leaseToReactivate.endDate}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReactivateDialog}>
              {t('cancel')}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleConfirmReactivate}
            >
              {t('reactivate') || 'Reactivar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
})

export default LeaseForm
