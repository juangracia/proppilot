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
  IconButton
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
  OpenInNew
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format, addYears } from 'date-fns'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'

const LeaseForm = memo(function LeaseForm({ onNavigateToProperty, onNavigateToTenant }) {
  const { t, formatCurrency, currency } = useLanguage()
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
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedLease, setSelectedLease] = useState(null)

  const adjustmentIndices = useMemo(() => [
    { value: 'ICL', label: 'ICL (Índice Contratos de Locación)' },
    { value: 'IPC', label: 'IPC (Índice Precios al Consumidor)' },
    { value: 'FIXED', label: t('fixedRent') || 'Monto Fijo (sin ajuste)' },
    { value: 'CUSTOM', label: t('customAdjustment') || 'Ajuste Personalizado' }
  ], [t])

  const fetchData = useCallback(async () => {
    try {
      const [propertiesRes, tenantsRes, leasesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/property-units`),
        axios.get(`${API_BASE_URL}/tenants`),
        axios.get(`${API_BASE_URL}/leases`)
      ])
      setPropertyUnits(Array.isArray(propertiesRes.data) ? propertiesRes.data : [])
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : [])
      setLeases(Array.isArray(leasesRes.data) ? leasesRes.data : [])
    } catch (error) {
      console.error('Error fetching data:', error)
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
    }

    if (!formData.monthlyRent) {
      errors.monthlyRent = t('rentRequired') || 'Alquiler mensual requerido'
    } else {
      const rent = parseFloat(formData.monthlyRent)
      if (isNaN(rent) || rent <= 0) {
        errors.monthlyRent = t('rentPositive') || 'El alquiler debe ser mayor a 0'
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
      case 'ACTIVE': return t('active') || 'Activo'
      case 'EXPIRED': return t('expired') || 'Vencido'
      case 'TERMINATED': return t('terminated') || 'Terminado'
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
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth required error={!!validationErrors.tenantId}>
                        <InputLabel>{t('selectTenant') || 'Seleccionar Inquilino'}</InputLabel>
                        <Select
                          value={formData.tenantId}
                          onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value }))}
                          label={t('selectTenant') || 'Seleccionar Inquilino'}
                        >
                          {tenants.map((tenant) => (
                            <MenuItem key={tenant.id} value={tenant.id}>
                              {tenant.fullName} - {tenant.nationalId}
                            </MenuItem>
                          ))}
                        </Select>
                        {validationErrors.tenantId && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                            {validationErrors.tenantId}
                          </Typography>
                        )}
                      </FormControl>
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

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        select
                        label={t('adjustmentFrequency') || 'Frecuencia de Ajuste'}
                        value={formData.adjustmentFrequencyMonths}
                        onChange={(e) => setFormData(prev => ({ ...prev, adjustmentFrequencyMonths: e.target.value }))}
                        fullWidth
                      >
                        <MenuItem value={3}>Trimestral (3 meses)</MenuItem>
                        <MenuItem value={6}>Semestral (6 meses)</MenuItem>
                        <MenuItem value={12}>Anual (12 meses)</MenuItem>
                      </TextField>
                    </Grid>

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
              {leases.length === 0 && (
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
                    {t('noLeases') || 'No hay contratos'}
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    {t('noLeasesDesc') || 'Los contratos aparecerán aquí una vez creados'}
                  </Typography>
                </Paper>
              )}

              {leases.length > 0 && (
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
                {selectedLease.status === 'ACTIVE' && (
                  <Button
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => handleTerminateLease(selectedLease.id)}
                  >
                    {t('terminateLease') || 'Terminar Contrato'}
                  </Button>
                )}
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

export default LeaseForm
