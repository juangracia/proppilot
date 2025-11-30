import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Home,
  CalendarToday,
  CheckCircle,
  Warning,
  People,
  Email,
  Phone,
  Person,
  Payment,
  Close,
  ContactPhone,
  Notes,
  OpenInNew
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'
import axios from 'axios'

// Helper to check if lease is ending soon (within 30 days)
const isLeaseEndingSoon = (dateStr) => {
  if (!dateStr) return false
  const leaseEnd = new Date(dateStr)
  const today = new Date()
  const diffTime = leaseEnd - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 30 && diffDays >= 0
}

const TenantsList = memo(function TenantsList({ onNavigateToProperty, onNavigateToPayment, initialTenantId, onTenantViewed }) {
  const { t, formatCurrency, formatNumber } = useLanguage()
  const isMobile = useMediaQuery('(max-width:600px)')
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState(null)
  const [deleteCheckResult, setDeleteCheckResult] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [allPayments, setAllPayments] = useState([])

  // Auto-open detail dialog when initialTenantId is provided
  useEffect(() => {
    if (initialTenantId) {
      const tenant = tenants.find(t => t.id === initialTenantId)
      if (tenant) {
        setSelectedTenant(tenant)
        setDetailDialogOpen(true)
        onTenantViewed?.()
      }
    }
  }, [initialTenantId, tenants, onTenantViewed])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success', action: null })
  const [pendingDelete, setPendingDelete] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    email: '',
    phone: ''
  })
  const [formErrors, setFormErrors] = useState({})

  // Load tenants on component mount
  useEffect(() => {
    loadTenants()
  }, [])

  const showSnackbar = useCallback((message, severity = 'success', action = null) => {
    setSnackbar({ open: true, message, severity, action })
  }, [])

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true)
      const [tenantsRes, paymentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/tenants`),
        axios.get(`${API_BASE_URL}/payments`)
      ])
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : [])
      setAllPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : [])
    } catch (error) {
      console.error('Error loading tenants:', error)
      showSnackbar(t('errorOccurred'), 'error')
    } finally {
      setLoading(false)
    }
  }, [t, showSnackbar])

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }, [])

  const openAddDialog = useCallback(() => {
    setEditingTenant(null)
    setFormData({ fullName: '', nationalId: '', email: '', phone: '' })
    setFormErrors({})
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((tenant) => {
    setEditingTenant(tenant)
    setFormData({
      fullName: tenant.fullName,
      nationalId: tenant.nationalId,
      email: tenant.email,
      phone: tenant.phone
    })
    setFormErrors({})
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
    setEditingTenant(null)
    setFormData({ fullName: '', nationalId: '', email: '', phone: '' })
    setFormErrors({})
  }, [])

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: '' }
      }
      return prev
    })
  }, [])

  const handleInput = useCallback((field, e) => {
    const value = e.target.value
    handleInputChange(field, value)
  }, [handleInputChange])

  const validateForm = useCallback(() => {
    const errors = {}

    if (!formData.fullName.trim()) {
      errors.fullName = t('fullNameRequired')
    }

    if (!formData.nationalId.trim()) {
      errors.nationalId = t('nationalIdRequired')
    }

    if (!formData.email.trim()) {
      errors.email = t('emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('emailInvalid')
    }

    if (!formData.phone.trim()) {
      errors.phone = t('phoneRequired')
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, t])

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      if (editingTenant) {
        await axios.put(`${API_BASE_URL}/tenants/${editingTenant.id}`, formData)
      } else {
        await axios.post(`${API_BASE_URL}/tenants`, formData)
      }
      await loadTenants()
      handleCloseDialog()
      showSnackbar(
        editingTenant ? t('tenantUpdatedSuccess') : t('tenantCreatedSuccess')
      )
    } catch (error) {
      console.error('Error saving tenant:', error)
      if (error.response?.status === 400) {
        const errorText = error.response?.data || ''
        if (typeof errorText === 'string' && errorText.includes('national ID')) {
          showSnackbar(t('duplicateNationalId'), 'error')
        } else if (typeof errorText === 'string' && errorText.includes('email')) {
          showSnackbar(t('duplicateEmail'), 'error')
        } else {
          showSnackbar(t('errorOccurred'), 'error')
        }
      } else {
        showSnackbar(
          editingTenant ? t('failedToUpdateTenant') : t('failedToCreateTenant'),
          'error'
        )
      }
    }
  }

  const openDeleteDialog = useCallback(async (tenant) => {
    setTenantToDelete(tenant)
    setDeleteLoading(true)
    setDeleteCheckResult(null)
    setDeleteDialogOpen(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/tenants/${tenant.id}/can-delete`)
      setDeleteCheckResult(response.data)
    } catch (err) {
      console.error('Error checking delete status:', err)
      setDeleteCheckResult({ canDelete: false, reason: t('errorOccurred') })
    } finally {
      setDeleteLoading(false)
    }
  }, [t])

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false)
    setTenantToDelete(null)
    setDeleteCheckResult(null)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!tenantToDelete) return

    const deletedTenant = tenantToDelete
    const originalTenants = [...tenants]

    // Optimistically remove from UI
    setTenants(tenants.filter(t => t.id !== deletedTenant.id))
    handleCloseDeleteDialog()

    // Set up pending delete with timeout
    const timeoutId = setTimeout(async () => {
      try {
        await axios.delete(`${API_BASE_URL}/tenants/${deletedTenant.id}`)
      } catch (error) {
        console.error('Error deleting tenant:', error)
        setTenants(originalTenants)
        const errorMessage = error.response?.data?.message || t('failedToDeleteTenant')
        showSnackbar(errorMessage, 'error')
      }
      setPendingDelete(null)
    }, 5000)

    setPendingDelete({ tenant: deletedTenant, originalTenants, timeoutId })

    // Show snackbar with undo action
    showSnackbar(
      `${deletedTenant.fullName} ${t('deleted')}`,
      'success',
      () => {
        clearTimeout(timeoutId)
        setTenants(originalTenants)
        setPendingDelete(null)
        showSnackbar(t('actionUndone'))
      }
    )
  }, [tenantToDelete, tenants, handleCloseDeleteDialog, showSnackbar, t])

  const totalTenantsText = useMemo(() => {
    const count = tenants.length
    const plural = count !== 1 ? 's' : ''
    return t('totalTenants').replace('{count}', count).replace('{plural}', plural)
  }, [tenants.length, t])

  const openDetailDialog = useCallback((tenant) => {
    setSelectedTenant(tenant)
    setDetailDialogOpen(true)
  }, [])

  const handleCloseDetailDialog = useCallback(() => {
    setDetailDialogOpen(false)
    setSelectedTenant(null)
  }, [])

  const tenantPayments = useMemo(() => {
    if (!selectedTenant || !selectedTenant.propertyId) return []
    return allPayments
      .filter(p => p.propertyUnitIdRef === selectedTenant.propertyId)
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
  }, [selectedTenant, allPayments])

  const computedPaymentStatus = useMemo(() => {
    if (tenantPayments.length === 0) return 'onTime'
    const hasPending = tenantPayments.some(p => p.status === 'PENDING')
    return hasPending ? 'late' : 'onTime'
  }, [tenantPayments])

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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
        >
          {totalTenantsText}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAddDialog}
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          {t('addTenant')}
        </Button>
      </Box>

      {/* Empty State */}
      {tenants.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'background.default',
            border: '2px dashed',
            borderColor: 'divider'
          }}
        >
          <People sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('noTenants')}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
            {t('noTenantsDesc')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openAddDialog}
          >
            {t('addTenant')}
          </Button>
        </Paper>
      )}

      {/* Desktop Table View */}
      {tenants.length > 0 && (
      <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
        <TableContainer component={Paper} elevation={2} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 160, whiteSpace: 'nowrap' }}>{t('fullName')}</TableCell>
                <TableCell sx={{ minWidth: 180, whiteSpace: 'nowrap' }}>{t('propertiesMenu')}</TableCell>
                <TableCell sx={{ minWidth: 120, whiteSpace: 'nowrap' }}>{t('leaseEnds')}</TableCell>
                <TableCell sx={{ minWidth: 100, whiteSpace: 'nowrap' }}>{t('status')}</TableCell>
                <TableCell sx={{ minWidth: 200, whiteSpace: 'nowrap' }}>{t('email')}</TableCell>
                <TableCell sx={{ minWidth: 140, whiteSpace: 'nowrap' }}>{t('phone')}</TableCell>
                <TableCell align="center" sx={{ minWidth: 100, whiteSpace: 'nowrap' }}>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  hover
                  onClick={() => openDetailDialog(tenant)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{tenant.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {t('nationalId')}: {formatNumber(tenant.nationalId)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {tenant.property ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Home sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography sx={{ whiteSpace: 'nowrap' }}>{tenant.property}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {tenant.leaseEndDate ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isLeaseEndingSoon(tenant.leaseEndDate) && (
                          <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
                        )}
                        <Typography
                          sx={{
                            color: isLeaseEndingSoon(tenant.leaseEndDate) ? 'warning.main' : 'text.primary',
                            fontWeight: isLeaseEndingSoon(tenant.leaseEndDate) ? 500 : 400
                          }}
                        >
                          {tenant.leaseEndDate}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.paymentStatus ? (
                      <Chip
                        icon={tenant.paymentStatus === 'onTime' ? <CheckCircle /> : <Warning />}
                        label={t(tenant.paymentStatus)}
                        size="small"
                        color={tenant.paymentStatus === 'onTime' ? 'success' : 'error'}
                        sx={{ '& .MuiChip-icon': { fontSize: 16 } }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{tenant.email}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{tenant.phone}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton
                      color="primary"
                      onClick={(e) => { e.stopPropagation(); openEditDialog(tenant) }}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={(e) => { e.stopPropagation(); openDeleteDialog(tenant) }}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      )}

      {/* Mobile/Tablet Card View */}
      {tenants.length > 0 && (
        <Box sx={{ display: { xs: 'block', xl: 'none' } }}>
        {tenants.map((tenant) => (
          <Card
            key={tenant.id}
            onClick={() => openDetailDialog(tenant)}
            sx={{
              mb: 2,
              p: 2,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: 3 }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1rem'
                    }}
                  >
                    {tenant.fullName}
                  </Typography>
                  {tenant.paymentStatus && (
                    <Chip
                      icon={tenant.paymentStatus === 'onTime' ? <CheckCircle /> : <Warning />}
                      label={t(tenant.paymentStatus)}
                      size="small"
                      color={tenant.paymentStatus === 'onTime' ? 'success' : 'error'}
                      sx={{ height: 22, '& .MuiChip-icon': { fontSize: 14 }, '& .MuiChip-label': { fontSize: '0.7rem' } }}
                    />
                  )}
                </Box>
                {tenant.property ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                    <Home sx={{ fontSize: 14 }} />
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '0.8125rem' }}
                    >
                      {tenant.property}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8125rem' }}>
                    {t('noPropertyAssigned')}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  color="primary"
                  onClick={(e) => { e.stopPropagation(); openEditDialog(tenant) }}
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={(e) => { e.stopPropagation(); openDeleteDialog(tenant) }}
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', display: 'block', mb: 0.25 }}
                >
                  {t('leaseEnds')}
                </Typography>
                {tenant.leaseEndDate ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isLeaseEndingSoon(tenant.leaseEndDate) && (
                      <Warning sx={{ fontSize: 14, color: 'warning.main' }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        color: isLeaseEndingSoon(tenant.leaseEndDate) ? 'warning.main' : 'text.primary',
                        fontWeight: isLeaseEndingSoon(tenant.leaseEndDate) ? 500 : 400
                      }}
                    >
                      {tenant.leaseEndDate}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>
                    —
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', display: 'block', mb: 0.25 }}
                >
                  {t('nationalId')}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {formatNumber(tenant.nationalId)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', display: 'block', mb: 0.25 }}
                >
                  {t('email')}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>
                  {tenant.email}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', display: 'block', mb: 0.25 }}
                >
                  {t('phone')}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {tenant.phone}
                </Typography>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' }
          }
        }}
      >
        <DialogTitle>
          {editingTenant ? t('editTenantTitle') : t('addNewTenant')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label={t('fullNameLabel')}
              placeholder={t('fullNamePlaceholder')}
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              inputProps={{
                onInput: (e) => handleInput('fullName', e)
              }}
              error={!!formErrors.fullName}
              helperText={formErrors.fullName}
              margin="normal"
            />
            <TextField
              fullWidth
              label={t('nationalIdLabel')}
              placeholder={t('nationalIdPlaceholder')}
              value={formData.nationalId}
              onChange={(e) => handleInputChange('nationalId', e.target.value)}
              inputProps={{
                onInput: (e) => handleInput('nationalId', e)
              }}
              error={!!formErrors.nationalId}
              helperText={formErrors.nationalId}
              margin="normal"
            />
            <TextField
              fullWidth
              label={t('emailLabel')}
              placeholder={t('emailPlaceholder')}
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              inputProps={{
                onInput: (e) => handleInput('email', e)
              }}
              error={!!formErrors.email}
              helperText={formErrors.email}
              margin="normal"
            />
            <TextField
              fullWidth
              label={t('phoneLabel')}
              placeholder={t('phonePlaceholder')}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              inputProps={{
                onInput: (e) => handleInput('phone', e)
              }}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: '90vh', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>
          {deleteCheckResult && !deleteCheckResult.canDelete
            ? t('cannotDeleteTenant')
            : t('confirmDelete')}
        </DialogTitle>
        <DialogContent>
          {deleteLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : deleteCheckResult && !deleteCheckResult.canDelete ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('tenantHasContracts').replace('{count}', deleteCheckResult.leaseCount || 0)}
            </Alert>
          ) : (
            <>
              <Typography>
                {t('confirmDeleteMessage')}
              </Typography>
              {tenantToDelete && (
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {tenantToDelete.fullName} ({formatNumber(tenantToDelete.nationalId)})
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            {deleteCheckResult && !deleteCheckResult.canDelete ? t('close') : t('cancel')}
          </Button>
          {deleteCheckResult?.canDelete && (
            <Button onClick={handleDelete} color="error" variant="contained">
              {t('delete')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Tenant Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' }
          }
        }}
      >
        {selectedTenant && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedTenant.fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('nationalId')}: {formatNumber(selectedTenant.nationalId)}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleCloseDetailDialog} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {/* Status Chip */}
              <Box sx={{ mb: 3 }}>
                <Chip
                  icon={computedPaymentStatus === 'onTime' ? <CheckCircle /> : <Warning />}
                  label={t(computedPaymentStatus)}
                  color={computedPaymentStatus === 'onTime' ? 'success' : 'error'}
                  sx={{ fontWeight: 500 }}
                />
              </Box>

              {/* Contact Info */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                {t('contactInfo')}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Email sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2">{selectedTenant.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Phone sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2">{selectedTenant.phone}</Typography>
                </Box>
                {selectedTenant.emergencyContact && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ContactPhone sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2">{selectedTenant.emergencyContact}</Typography>
                  </Box>
                )}
              </Paper>

              {/* Property Info */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                {t('propertyInfo')}
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  cursor: onNavigateToProperty && selectedTenant.propertyId ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  '&:hover': onNavigateToProperty && selectedTenant.propertyId ? {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  } : {}
                }}
                onClick={() => {
                  if (onNavigateToProperty && selectedTenant.propertyId) {
                    handleCloseDetailDialog()
                    onNavigateToProperty(selectedTenant.propertyId)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Home sx={{ fontSize: 20, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>{selectedTenant.property}</Typography>
                  {onNavigateToProperty && selectedTenant.propertyId && (
                    <OpenInNew sx={{ fontSize: 16, color: 'text.secondary' }} />
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('monthlyRent')}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(selectedTenant.monthlyRent)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('leaseStart')}</Typography>
                    <Typography variant="body2">{selectedTenant.leaseStart}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t('leaseEnds')}</Typography>
                    <Typography variant="body2" sx={{ color: isLeaseEndingSoon(selectedTenant.leaseEndDate) ? 'warning.main' : 'text.primary' }}>
                      {selectedTenant.leaseEndDate}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Notes */}
              {selectedTenant.notes && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    {t('notes')}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Notes sx={{ fontSize: 20, color: 'text.secondary' }} />
                      <Typography variant="body2">{selectedTenant.notes}</Typography>
                    </Box>
                  </Paper>
                </>
              )}

              {/* Payment History */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                {t('paymentHistory')}
              </Typography>
              <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                {tenantPayments.length > 0 ? (
                  <List disablePadding>
                    {tenantPayments.slice(0, 5).map((payment, index) => (
                      <ListItem
                        key={payment.id}
                        divider={index < tenantPayments.length - 1}
                        sx={{
                          px: 2,
                          py: 1.5,
                          cursor: onNavigateToPayment ? 'pointer' : 'default',
                          transition: 'background-color 0.2s',
                          '&:hover': onNavigateToPayment ? {
                            bgcolor: 'action.hover'
                          } : {}
                        }}
                        onClick={() => {
                          if (onNavigateToPayment) {
                            handleCloseDetailDialog()
                            onNavigateToPayment(payment.id)
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {formatCurrency(payment.amount)}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={t(payment.status === 'PAID' ? 'paid' : 'pending')}
                                  size="small"
                                  color={payment.status === 'PAID' ? 'success' : 'warning'}
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                                {onNavigateToPayment && (
                                  <OpenInNew sx={{ fontSize: 14, color: 'text.secondary' }} />
                                )}
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {payment.paymentDate} • {payment.paymentType}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Payment sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('noPaymentsYet')}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
              <Button
                color="error"
                startIcon={<Delete />}
                onClick={() => {
                  handleCloseDetailDialog()
                  openDeleteDialog(selectedTenant)
                }}
              >
                {t('delete')}
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={handleCloseDetailDialog}>
                  {t('close')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => {
                    handleCloseDetailDialog()
                    openEditDialog(selectedTenant)
                  }}
                >
                  {t('edit')}
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.action ? 5000 : 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          action={snackbar.action && (
            <Button color="inherit" size="small" onClick={snackbar.action}>
              {t('undo')}
            </Button>
          )}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
})

export default TenantsList
