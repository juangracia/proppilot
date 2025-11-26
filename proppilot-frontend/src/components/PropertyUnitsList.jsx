import React, { useState, useMemo, useCallback, memo } from 'react'
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Home,
  Business,
  Person,
  AttachMoney,
  CalendarToday,
  Edit,
  Visibility,
  Warning,
  Receipt,
  Close,
  LocationOn,
  Bed,
  Bathtub,
  SquareFoot,
  Garage,
  Description,
  Payment
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useLanguage } from '../contexts/LanguageContext'
import { mockProperties as sharedMockProperties, getPaymentsByPropertyId, getTenantById } from '../data/mockData'

const API_BASE_URL = '/api'

const PropertyUnitsList = memo(function PropertyUnitsList({ initialFilter = null, onFilterClear }) {
  const { t, formatCurrency, currency } = useLanguage()
  const [propertyUnits, setPropertyUnits] = useState(sharedMockProperties)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [newProperty, setNewProperty] = useState({
    address: '',
    type: '',
    baseRentAmount: '',
    leaseStartDate: null
  })
  const [addLoading, setAddLoading] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editFormData, setEditFormData] = useState({
    address: '',
    type: '',
    baseRentAmount: '',
    leaseStartDate: null
  })
  const [editLoading, setEditLoading] = useState(false)

  // Memoize filtered properties
  const filteredProperties = useMemo(() => {
    const filteredByStatus = propertyUnits.filter(property => {
      if (activeFilter === 'occupied') return property.status === 'Occupied'
      if (activeFilter === 'vacant') return property.status === 'Vacant'
      if (activeFilter === 'overdue') return property.hasPendingPayment
      return true
    })

    return filteredByStatus.filter(property =>
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.type.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [propertyUnits, activeFilter, searchTerm])

  // Count of overdue properties for badge
  const overdueCount = useMemo(() =>
    propertyUnits.filter(p => p.hasPendingPayment).length
  , [propertyUnits])

  const handleFilterChange = useCallback((event, newValue) => {
    setActiveFilter(newValue === 'all' ? null : newValue)
  }, [])

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value)
  }, [])

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'Occupied':
        return 'success'
      case 'Vacant':
        return 'warning'
      default:
        return 'default'
    }
  }, [])

  const getTypeIcon = useCallback((type) => {
    switch (type) {
      case 'House':
        return <Home />
      case 'Apartment':
        return <Home />
      case 'Commercial':
        return <Business />
      default:
        return <Home />
    }
  }, [])

  const handleOpenAddDialog = useCallback(() => {
    setOpenAddDialog(true)
  }, [])

  const handleCloseAddDialog = useCallback(() => {
    setOpenAddDialog(false)
  }, [])

  const handleAddProperty = useCallback(() => {
    setAddLoading(true)
    setTimeout(() => {
      setPropertyUnits(prev => {
        const newId = Math.max(...prev.map(p => p.id)) + 1
        return [...prev, {
          id: newId,
          address: newProperty.address,
          type: newProperty.type,
          status: 'Vacant',
          tenant: 'Vacant',
          monthlyRent: parseFloat(newProperty.baseRentAmount),
          leaseStart: newProperty.leaseStartDate ? newProperty.leaseStartDate.toLocaleDateString() : null
        }]
      })
      setOpenAddDialog(false)
      setNewProperty({
        address: '',
        type: '',
        baseRentAmount: '',
        leaseStartDate: null
      })
      setAddLoading(false)
    }, 1000)
  }, [newProperty])

  const handleViewDetails = useCallback((property) => {
    setSelectedProperty(property)
    setOpenViewDialog(true)
  }, [])

  const handleCloseViewDialog = useCallback(() => {
    setOpenViewDialog(false)
    setSelectedProperty(null)
  }, [])

  const handleEdit = useCallback((property) => {
    setEditingProperty(property)
    setEditFormData({
      address: property.address,
      type: property.type,
      baseRentAmount: property.monthlyRent.toString(),
      leaseStartDate: property.leaseStart ? new Date(property.leaseStart) : null
    })
    setOpenEditDialog(true)
  }, [])

  const handleCloseEditDialog = useCallback(() => {
    setOpenEditDialog(false)
    setEditingProperty(null)
    setEditFormData({
      address: '',
      type: '',
      baseRentAmount: '',
      leaseStartDate: null
    })
  }, [])

  const handleUpdateProperty = useCallback(() => {
    if (!editFormData.address || !editFormData.type || !editFormData.baseRentAmount) {
      return
    }

    setEditLoading(true)
    setTimeout(() => {
      setPropertyUnits(prev => prev.map(p =>
        p.id === editingProperty.id
          ? {
            ...p,
            address: editFormData.address,
            type: editFormData.type,
            monthlyRent: parseFloat(editFormData.baseRentAmount),
            leaseStart: editFormData.leaseStartDate ? editFormData.leaseStartDate.toLocaleDateString() : p.leaseStart
          }
          : p
      ))
      handleCloseEditDialog()
      setEditLoading(false)
    }, 1000)
  }, [editFormData, editingProperty, handleCloseEditDialog])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Filter Tabs */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Tabs
            value={activeFilter || 'all'}
            onChange={handleFilterChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 500,
                py: 1
              }
            }}
          >
            <Tab label={t('filterAll')} value="all" />
            <Tab label={t('filterOccupied')} value="occupied" />
            <Tab label={t('filterVacant')} value="vacant" />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {t('filterOverdue')}
                  <Chip
                    label={overdueCount}
                    size="small"
                    color="error"
                    sx={{ height: 18, fontSize: '0.7rem', ml: 0.5 }}
                  />
                </Box>
              }
              value="overdue"
            />
          </Tabs>
        </Box>

        {/* Search and Add Button */}
        <Box sx={{
          display: 'flex',
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 2, sm: 3 },
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <TextField
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              flexGrow: 1,
              maxWidth: { xs: '100%', sm: 400 },
              width: '100%'
            }}
            size="small"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{
              textTransform: 'none',
              width: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {t('addProperty')}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {filteredProperties.length === 0 && (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: 'background.default',
              border: '2px dashed',
              borderColor: 'divider'
            }}
          >
            <Home sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('noProperties')}
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
              {t('noPropertiesDesc')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              {t('addProperty')}
            </Button>
          </Paper>
        )}

        {/* Properties Grid */}
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {filteredProperties.map((property) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={property.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    boxShadow: { xs: 2, sm: 4 }
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  {/* Property Type and Status */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{
                        bgcolor: 'primary.main',
                        width: { xs: 28, sm: 32 },
                        height: { xs: 28, sm: 32 }
                      }}>
                        {React.cloneElement(getTypeIcon(property.type), {
                          sx: { fontSize: { xs: 16, sm: 20 } }
                        })}
                      </Avatar>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        {t(property.type.toLowerCase())}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {property.hasPendingPayment && (
                        <Chip
                          icon={<Warning sx={{ fontSize: 14 }} />}
                          label={t('paymentOverdue')}
                          size="small"
                          color="error"
                          sx={{
                            fontSize: { xs: '0.65rem', sm: '0.7rem' },
                            height: { xs: 20, sm: 24 },
                            '& .MuiChip-icon': { fontSize: 14 }
                          }}
                        />
                      )}
                      <Chip
                        label={t(property.status.toLowerCase())}
                        color={getStatusColor(property.status)}
                        size="small"
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          height: { xs: 20, sm: 24 }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Address */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: { xs: 1.5, sm: 2 },
                      lineHeight: 1.3,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    {property.address}
                  </Typography>

                  {/* Tenant Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
                    <Person sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {t('tenant')}:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        fontStyle: property.tenant === 'Vacant' ? 'italic' : 'normal',
                        color: property.tenant === 'Vacant' ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {property.tenant === 'Vacant' ? t('vacant') : property.tenant}
                    </Typography>
                  </Box>

                  {/* Monthly Rent */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
                    <AttachMoney sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {t('monthlyRent')}:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: 'primary.main',
                        fontSize: { xs: '0.875rem', sm: '0.875rem' }
                      }}
                    >
                      {formatCurrency(property.monthlyRent)}
                    </Typography>
                  </Box>

                  {/* Last Payment */}
                  {property.lastPaymentDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
                      <Receipt sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        {t('lastPayment')}:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          color: property.hasPendingPayment ? 'error.main' : 'success.main',
                          fontWeight: 500
                        }}
                      >
                        {property.lastPaymentDate}
                      </Typography>
                    </Box>
                  )}

                  {/* Lease Start */}
                  {property.leaseStart && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                      <CalendarToday sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        {t('leaseStart')}:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        {property.leaseStart}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(property)}
                      sx={{
                        textTransform: 'none',
                        flex: 1,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {t('viewDetails')}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEdit(property)}
                      sx={{
                        textTransform: 'none',
                        flex: 1,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {t('edit')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Add Property Dialog */}
        <Dialog
          open={openAddDialog}
          onClose={handleCloseAddDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              maxHeight: { xs: '95vh', sm: '90vh' }
            }
          }}
        >
          <DialogTitle>{t('addNewProperty')}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label={t('addressLabel')}
                value={newProperty.address}
                onChange={(e) => setNewProperty(prev => ({ ...prev, address: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                select
                label={t('propertyTypeLabel')}
                value={newProperty.type}
                onChange={(e) => setNewProperty(prev => ({ ...prev, type: e.target.value }))}
                fullWidth
                required
              >
                <MenuItem value="Apartment">{t('apartment')}</MenuItem>
                <MenuItem value="House">{t('house')}</MenuItem>
                <MenuItem value="Commercial">{t('commercial')}</MenuItem>
              </TextField>
              <TextField
                label={t('baseRentLabel')}
                type="number"
                value={newProperty.baseRentAmount}
                onChange={(e) => setNewProperty(prev => ({ ...prev, baseRentAmount: e.target.value }))}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">{t(`currencySymbol.${currency}`)}</InputAdornment>,
                }}
              />
              <DatePicker
                label={t('leaseStartLabel')}
                value={newProperty.leaseStartDate}
                onChange={(date) => setNewProperty(prev => ({ ...prev, leaseStartDate: date }))}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddDialog}>{t('cancel')}</Button>
            <Button
              onClick={handleAddProperty}
              variant="contained"
              disabled={addLoading || !newProperty.address || !newProperty.type || !newProperty.baseRentAmount}
            >
              {addLoading ? <CircularProgress size={20} /> : t('addPropertyAction')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={handleCloseViewDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              maxHeight: { xs: '95vh', sm: '90vh' }
            }
          }}
        >
          {selectedProperty && (
            <>
              <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: selectedProperty.type === 'Commercial' ? 'secondary.main' : 'primary.main', width: 48, height: 48 }}>
                    {selectedProperty.type === 'Commercial' ? <Business /> : <Home />}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      {selectedProperty.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(selectedProperty.type.toLowerCase())}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={handleCloseViewDialog} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                  <Close />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                {/* Status and Rent */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Chip
                    label={t(selectedProperty.status.toLowerCase())}
                    color={getStatusColor(selectedProperty.status)}
                    sx={{ fontWeight: 500 }}
                  />
                  {selectedProperty.hasPendingPayment && (
                    <Chip
                      icon={<Warning />}
                      label={t('pendingPayment') || 'Pago Pendiente'}
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Property Details */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('propertyDetails')}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t('monthlyRent')}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {formatCurrency(selectedProperty.monthlyRent)}
                      </Typography>
                    </Box>
                    {selectedProperty.sqMeters && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">{t('area') || 'Superficie'}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedProperty.sqMeters} m²
                        </Typography>
                      </Box>
                    )}
                    {selectedProperty.bedrooms && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Bed sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body1">{selectedProperty.bedrooms}</Typography>
                      </Box>
                    )}
                    {selectedProperty.bathrooms && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Bathtub sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body1">{selectedProperty.bathrooms}</Typography>
                      </Box>
                    )}
                    {selectedProperty.garage && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Garage sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body1">{t('yes') || 'Sí'}</Typography>
                      </Box>
                    )}
                  </Box>
                  {selectedProperty.description && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Description sx={{ fontSize: 20, color: 'text.secondary', mt: 0.25 }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedProperty.description}
                      </Typography>
                    </Box>
                  )}
                  {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {t('amenities') || 'Amenities'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedProperty.amenities.map((amenity, i) => (
                          <Chip key={i} label={amenity} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Paper>

                {/* Tenant Info */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('tenant')}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  {selectedProperty.tenant ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Person sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedProperty.tenant}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {selectedProperty.leaseStart && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t('leaseStart') || 'Inicio Contrato'}</Typography>
                            <Typography variant="body2">{selectedProperty.leaseStart}</Typography>
                          </Box>
                        )}
                        {selectedProperty.leaseEnd && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t('leaseEnds')}</Typography>
                            <Typography variant="body2">{selectedProperty.leaseEnd}</Typography>
                          </Box>
                        )}
                        {selectedProperty.lastPaymentDate && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t('lastPayment') || 'Último Pago'}</Typography>
                            <Typography variant="body2">{selectedProperty.lastPaymentDate}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Person sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {t('noTenantAssigned') || 'Sin inquilino asignado'}
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* Payment History */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('paymentHistory') || 'Historial de Pagos'}
                </Typography>
                <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                  {(() => {
                    const payments = getPaymentsByPropertyId(selectedProperty.id)
                    return payments.length > 0 ? (
                      <List disablePadding>
                        {payments.slice(0, 5).map((payment, index) => (
                          <ListItem
                            key={payment.id}
                            divider={index < payments.length - 1}
                            sx={{ px: 2, py: 1.5 }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {formatCurrency(payment.amount)}
                                  </Typography>
                                  <Chip
                                    label={t(payment.status) || payment.status}
                                    size="small"
                                    color={payment.status === 'completed' ? 'success' : 'warning'}
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {payment.date} • {payment.tenant}
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
                          {t('noPaymentsYet') || 'Sin pagos registrados'}
                        </Typography>
                      </Box>
                    )
                  })()}
                </Paper>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleCloseViewDialog}>{t('close')}</Button>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => {
                    handleCloseViewDialog()
                    handleOpenEditDialog(selectedProperty)
                  }}
                >
                  {t('edit') || 'Editar'}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Edit Property Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={handleCloseEditDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 2 },
              maxHeight: { xs: '95vh', sm: '90vh' }
            }
          }}
        >
          <DialogTitle>{t('editProperty')}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label={t('addressLabel')}
                value={editFormData.address}
                onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                select
                label={t('propertyTypeLabel')}
                value={editFormData.type}
                onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value }))}
                fullWidth
                required
              >
                <MenuItem value="Apartment">{t('apartment')}</MenuItem>
                <MenuItem value="House">{t('house')}</MenuItem>
                <MenuItem value="Commercial">{t('commercial')}</MenuItem>
              </TextField>
              <TextField
                label={t('baseRentLabel')}
                type="number"
                value={editFormData.baseRentAmount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, baseRentAmount: e.target.value }))}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">{t(`currencySymbol.${currency}`)}</InputAdornment>,
                }}
              />
              <DatePicker
                label={t('leaseStartLabel')}
                value={editFormData.leaseStartDate}
                onChange={(date) => setEditFormData(prev => ({ ...prev, leaseStartDate: date }))}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>{t('cancel')}</Button>
            <Button
              onClick={handleUpdateProperty}
              variant="contained"
              disabled={editLoading || !editFormData.address || !editFormData.type || !editFormData.baseRentAmount}
            >
              {editLoading ? <CircularProgress size={20} /> : t('saveChanges')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
})

export default PropertyUnitsList
