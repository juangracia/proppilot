import React, { useState, useEffect } from 'react'
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
  Divider
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

const API_BASE_URL = '/api'

const TenantsList = () => {
  const { t } = useLanguage()
  const isMobile = useMediaQuery('(max-width:600px)')
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
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

  const loadTenants = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/tenants`)
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      } else {
        showSnackbar(t('errorOccurred'), 'error')
      }
    } catch (error) {
      console.error('Error loading tenants:', error)
      showSnackbar(t('errorOccurred'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const openAddDialog = () => {
    setEditingTenant(null)
    setFormData({ fullName: '', nationalId: '', email: '', phone: '' })
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEditDialog = (tenant) => {
    setEditingTenant(tenant)
    setFormData({
      fullName: tenant.fullName,
      nationalId: tenant.nationalId,
      email: tenant.email,
      phone: tenant.phone
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTenant(null)
    setFormData({ fullName: '', nationalId: '', email: '', phone: '' })
    setFormErrors({})
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    setFormErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: '' }
      }
      return prev
    })
  }

  // Handle input events for better browser automation support
  const handleInput = (field, e) => {
    // This handles both onChange and onInput events
    const value = e.target.value
    handleInputChange(field, value)
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'El nombre completo es requerido'
    }
    
    if (!formData.nationalId.trim()) {
      errors.nationalId = 'El DNI/CUIT es requerido'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El formato del email no es válido'
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono es requerido'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const url = editingTenant 
        ? `${API_BASE_URL}/tenants/${editingTenant.id}`
        : `${API_BASE_URL}/tenants`
      
      const method = editingTenant ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadTenants()
        handleCloseDialog()
        showSnackbar(
          editingTenant ? t('tenantUpdatedSuccess') : t('tenantCreatedSuccess')
        )
      } else if (response.status === 400) {
        // Handle validation errors from backend
        const errorText = await response.text()
        if (errorText.includes('national ID')) {
          showSnackbar(t('duplicateNationalId'), 'error')
        } else if (errorText.includes('email')) {
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
    } catch (error) {
      console.error('Error saving tenant:', error)
      showSnackbar(
        editingTenant ? t('failedToUpdateTenant') : t('failedToCreateTenant'), 
        'error'
      )
    }
  }

  const openDeleteDialog = (tenant) => {
    setTenantToDelete(tenant)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setTenantToDelete(null)
  }

  const handleDelete = async () => {
    if (!tenantToDelete) return

    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${tenantToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTenants()
        showSnackbar(t('tenantDeletedSuccess'))
      } else {
        showSnackbar(t('failedToDeleteTenant'), 'error')
      }
    } catch (error) {
      console.error('Error deleting tenant:', error)
      showSnackbar(t('failedToDeleteTenant'), 'error')
    } finally {
      handleCloseDeleteDialog()
    }
  }

  const getTotalTenantsText = () => {
    const count = tenants.length
    const plural = count !== 1 ? 's' : ''
    return t('totalTenants').replace('{count}', count).replace('{plural}', plural)
  }

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
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 2, sm: 0 }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2.125rem' },
            mb: { xs: 0, sm: 1 }
          }}
        >
          {t('tenantsTitle')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAddDialog}
          sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          {t('addTenant')}
        </Button>
      </Box>

      <Typography 
        variant="body2" 
        color="text.secondary" 
        gutterBottom
        sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, mb: 2 }}
      >
        {getTotalTenantsText()}
      </Typography>

      {/* Desktop Table View */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t('id')}</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t('fullName')}</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t('nationalId')}</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t('email')}</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t('phone')}</TableCell>
                <TableCell align="center" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} hover>
                  <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{tenant.id}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{tenant.fullName}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{tenant.nationalId}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{tenant.email}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{tenant.phone}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => openEditDialog(tenant)}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => openDeleteDialog(tenant)}
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

      {/* Mobile Card View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {tenants.map((tenant) => (
          <Card key={tenant.id} sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1rem',
                    mb: 0.5
                  }}
                >
                  {tenant.fullName}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: '0.8125rem' }}
                >
                  ID: {tenant.id}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  color="primary"
                  onClick={() => openEditDialog(tenant)}
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => openDeleteDialog(tenant)}
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
                  {t('nationalId')}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {tenant.nationalId}
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
        <DialogTitle>{t('confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('confirmDeleteMessage')}
          </Typography>
          {tenantToDelete && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              {tenantToDelete.fullName} ({tenantToDelete.nationalId})
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            {t('cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default TenantsList
