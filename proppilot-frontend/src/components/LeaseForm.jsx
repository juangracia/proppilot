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
  Tooltip
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
  DeleteForever
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format, addYears } from 'date-fns'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'

const LeaseForm = memo(function LeaseForm({ onNavigateToProperty, onNavigateToTenant }) {
  const { t, formatCurrency, currency, formatNumber } = useLanguage()
  const [activeTab, setActiveTab] = useState(0)

  const [formData, setFormData] = useState({
    propertyUnitId: '',
    tenantId: '',
    startDate: null,
    endDate: null,
    monthlyRent: '',
    adjustmentIndex: 'ICL',
    adjustmentFrequencyMonths: 12
  })

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

  // Inline creation dialogs
  const [newTenantDialogOpen, setNewTenantDialogOpen] = useState(false)
  const [newPropertyDialogOpen, setNewPropertyDialogOpen] = useState(false)
  const [newTenantData, setNewTenantData] = useState({ fullName: '', nationalId: '', email: '', phone: '' })
  const [newPropertyData, setNewPropertyData] = useState({ address: '', type: '', baseRentAmount: '' })
  const [newTenantErrors, setNewTenantErrors] = useState({})
  const [newPropertyErrors, setNewPropertyErrors] = useState({})
  const [creatingTenant, setCreatingTenant] = useState(false)
  const [creatingProperty, setCreatingProperty] = useState(false)

  const adjustmentIndices = useMemo(() => [
    { value: 'ICL', label: t('indexICL') },
    { value: 'IPC', label: t('indexIPC') },
    { value: 'NONE', label: t('indexFixed') }
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
    setFormData(prev => ({
      ...prev,
      startDate: date,
      endDate: date ? addYears(date, 1) : prev.endDate
    }))
  }, [])

  const validateForm = useCallback(() => {
    const errors = {}

    if (!formData.propertyUnitId) {
      errors.propertyUnitId = t('propertyRequired') || 'Propiedad requerida'
    }

    if (!formData.tenantId) {
      errors.tenantId = t('tenantRequired') || 'Inquilino requerido'
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
        tenantId: parseInt(formData.tenantId),
        startDate: format(formData.startDate, 'yyyy-MM-dd'),
        endDate: format(formData.endDate, 'yyyy-MM-dd'),
        monthlyRent: parseFloat(formData.monthlyRent),
        adjustmentIndex: formData.adjustmentIndex,
        adjustmentFrequencyMonths: parseInt(formData.adjustmentFrequencyMonths)
      }

      const response = await axios.post(`${API_BASE_URL}/leases`, leaseData)

      if (response.status === 201) {
        setSuccess(t('leaseCreatedSuccess') || 'Contrato creado exitosamente')
        setLeases(prev => [response.data, ...prev])
        setFormData({
          propertyUnitId: '',
          tenantId: '',
          startDate: null,
          endDate: null,
          monthlyRent: '',
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

  const handleTerminateLease = async (leaseId) => {
    try {
      await axios.post(`${API_BASE_URL}/leases/${leaseId}/terminate`)
      setLeases(prev => prev.map(l =>
        l.id === leaseId ? { ...l, status: 'TERMINATED' } : l
      ))
      setDetailDialogOpen(false)
    } catch (err) {
      console.error('Error terminating lease:', err)
      setError(err.response?.data?.message || 'Error al terminar el contrato')
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
      setFormData(prev => ({ ...prev, tenantId: response.data.id }))
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

  const selectedTenant = useMemo(() =>
    tenants.find(tenant => tenant.id === parseInt(formData.tenantId))
  , [tenants, formData.tenantId])

  const handleTabChange = useCallback((e, newValue) => {
    setActiveTab(newValue)
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
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('deletedContractsMenu') || 'Eliminados'}
                  {deletedLeases.length > 0 && (
                    <Chip
                      label={deletedLeases.length}
                      size="small"
                      color="error"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              }
              sx={{ textTransform: 'none' }}
            />
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
                        <FormControl fullWidth required error={!!validationErrors.tenantId}>
                          <InputLabel>{t('selectTenant') || 'Seleccionar Inquilino'}</InputLabel>
                          <Select
                            value={formData.tenantId}
                            onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value }))}
                            label={t('selectTenant') || 'Seleccionar Inquilino'}
                          >
                            {tenants.map((tenant) => (
                              <MenuItem key={tenant.id} value={tenant.id}>
                                {tenant.fullName} - {formatNumber(tenant.nationalId)}
                              </MenuItem>
                            ))}
                          </Select>
                          {validationErrors.tenantId && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                              {validationErrors.tenantId}
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
                        onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
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
                      <TextField
                        label={t('monthlyRent') || 'Alquiler Mensual'}
                        type="number"
                        value={formData.monthlyRent}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                        fullWidth
                        required
                        error={!!validationErrors.monthlyRent}
                        helperText={validationErrors.monthlyRent}
                        inputProps={{ step: '0.01', min: '0.01' }}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>{currency}</Typography>
                        }}
                      />
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
                          <MenuItem value={3}>{t('quarterly') || 'Trimestral (3 meses)'}</MenuItem>
                          <MenuItem value={6}>{t('semiannual') || 'Semestral (6 meses)'}</MenuItem>
                          <MenuItem value={12}>{t('annual') || 'Anual (12 meses)'}</MenuItem>
                        </TextField>
                      </Grid>
                    )}

                    {(selectedPropertyUnit || selectedTenant) && (
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
                            {selectedTenant && (
                              <Typography variant="body2">
                                <strong>{t('tenant')}:</strong> {selectedTenant.fullName}
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
                              tenantId: '',
                              startDate: null,
                              endDate: null,
                              monthlyRent: '',
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
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('propertyInfo') || 'Propiedad'}</TableCell>
                            <TableCell>{t('tenant')}</TableCell>
                            <TableCell>{t('leasePeriod') || 'Período'}</TableCell>
                            <TableCell>{t('monthlyRent') || 'Alquiler'}</TableCell>
                            <TableCell>{t('status')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {leases.map((lease) => (
                            <TableRow
                              key={lease.id}
                              hover
                              onClick={() => { setSelectedLease(lease); setDetailDialogOpen(true) }}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell>{lease.propertyAddress}</TableCell>
                              <TableCell>{lease.tenantName}</TableCell>
                              <TableCell>{lease.startDate} - {lease.endDate}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(lease.monthlyRent)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={getStatusLabel(lease.status)}
                                  size="small"
                                  color={getStatusColor(lease.status)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                    {leases.map((lease) => (
                      <Paper
                        key={lease.id}
                        variant="outlined"
                        onClick={() => { setSelectedLease(lease); setDetailDialogOpen(true) }}
                        sx={{
                          p: 2,
                          mb: 2,
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 2 }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {lease.propertyAddress}
                          </Typography>
                          <Chip
                            label={getStatusLabel(lease.status)}
                            size="small"
                            color={getStatusColor(lease.status)}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {lease.tenantName}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {formatCurrency(lease.monthlyRent)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lease.startDate} - {lease.endDate}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Tab 2: Deleted Contracts */}
          {activeTab === 2 && (
            <Box>
              {initialLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : deletedLeases.length === 0 ? (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'background.default',
                    border: '2px dashed',
                    borderColor: 'divider'
                  }}
                >
                  <Delete sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('noDeletedContracts') || 'No hay contratos eliminados'}
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    {t('noDeletedContractsDesc') || 'Los contratos eliminados aparecerán aquí'}
                  </Typography>
                </Paper>
              ) : (
                <>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    {t('deletedContractsInfo') || 'Estos contratos han sido eliminados pero pueden ser restaurados o eliminados permanentemente.'}
                  </Alert>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('propertyInfo') || 'Propiedad'}</TableCell>
                            <TableCell>{t('tenant')}</TableCell>
                            <TableCell>{t('leasePeriod') || 'Período'}</TableCell>
                            <TableCell>{t('deletedAt') || 'Eliminado'}</TableCell>
                            <TableCell align="center">{t('actions')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {deletedLeases.map((lease) => (
                            <TableRow key={lease.id} sx={{ opacity: 0.8 }}>
                              <TableCell>{lease.propertyAddress}</TableCell>
                              <TableCell>{lease.tenantName}</TableCell>
                              <TableCell>{lease.startDate} - {lease.endDate}</TableCell>
                              <TableCell>
                                {lease.deletedAt ? new Date(lease.deletedAt).toLocaleDateString() : '-'}
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title={t('restoreLease') || 'Restaurar'}>
                                  <IconButton
                                    color="primary"
                                    onClick={() => openRestoreDialog(lease)}
                                    size="small"
                                  >
                                    <Restore />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('permanentlyDelete') || 'Eliminar permanentemente'}>
                                  <IconButton
                                    color="error"
                                    onClick={() => openPermanentDeleteDialog(lease)}
                                    size="small"
                                  >
                                    <DeleteForever />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                    {deletedLeases.map((lease) => (
                      <Paper
                        key={lease.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          mb: 2,
                          opacity: 0.9,
                          bgcolor: 'action.hover'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {lease.propertyAddress}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              color="primary"
                              onClick={() => openRestoreDialog(lease)}
                              size="small"
                            >
                              <Restore fontSize="small" />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => openPermanentDeleteDialog(lease)}
                              size="small"
                            >
                              <DeleteForever fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {lease.tenantName}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {lease.startDate} - {lease.endDate}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {t('deletedAt')}: {lease.deletedAt ? new Date(lease.deletedAt).toLocaleDateString() : '-'}
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
                    cursor: onNavigateToProperty ? 'pointer' : 'default',
                    '&:hover': onNavigateToProperty ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {}
                  }}
                  onClick={() => {
                    if (onNavigateToProperty && selectedLease.propertyUnit?.id) {
                      setDetailDialogOpen(false)
                      onNavigateToProperty(selectedLease.propertyUnit.id)
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Home sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                      {selectedLease.propertyAddress}
                    </Typography>
                    {onNavigateToProperty && <OpenInNew sx={{ fontSize: 16, color: 'text.secondary' }} />}
                  </Box>
                </Paper>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('tenant')}
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    cursor: onNavigateToTenant ? 'pointer' : 'default',
                    '&:hover': onNavigateToTenant ? { borderColor: 'primary.main', bgcolor: 'action.hover' } : {}
                  }}
                  onClick={() => {
                    if (onNavigateToTenant && selectedLease.tenant?.id) {
                      setDetailDialogOpen(false)
                      onNavigateToTenant(selectedLease.tenant.id)
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Person sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedLease.tenantName}
                      </Typography>
                      {selectedLease.tenantEmail && (
                        <Typography variant="caption" color="text.secondary">
                          {selectedLease.tenantEmail}
                        </Typography>
                      )}
                    </Box>
                    {onNavigateToTenant && <OpenInNew sx={{ fontSize: 16, color: 'text.secondary' }} />}
                  </Box>
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
                      onClick={() => handleTerminateLease(selectedLease.id)}
                    >
                      {t('terminateLease') || 'Terminar'}
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
              <TextField
                label={t('baseRent') || 'Alquiler Base'}
                type="number"
                value={newPropertyData.baseRentAmount}
                onChange={(e) => setNewPropertyData(prev => ({ ...prev, baseRentAmount: e.target.value }))}
                fullWidth
                required
                error={!!newPropertyErrors.baseRentAmount}
                helperText={newPropertyErrors.baseRentAmount}
                inputProps={{ step: '0.01', min: '0.01' }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>{currency}</Typography>
                }}
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
                      {leaseToDelete.tenantName} • {leaseToDelete.startDate} - {leaseToDelete.endDate}
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
                  {leaseToRestore.tenantName} • {leaseToRestore.startDate} - {leaseToRestore.endDate}
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
                  {leaseToPermDelete.tenantName} • {leaseToPermDelete.startDate} - {leaseToPermDelete.endDate}
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
      </Box>
    </LocalizationProvider>
  )
})

export default LeaseForm
