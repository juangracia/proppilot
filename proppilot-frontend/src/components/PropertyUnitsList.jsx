import React, { useState, useMemo, useCallback, memo, useEffect } from 'react'
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
  Payment,
  OpenInNew
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'
import axios from 'axios'

const PropertyUnitsList = memo(function PropertyUnitsList({ initialFilter = null, onFilterClear, onNavigateToTenant, onNavigateToPayment, initialPropertyId, onPropertyViewed }) {
  const { t, formatCurrency, currency } = useLanguage()
  const [propertyUnits, setPropertyUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [newProperty, setNewProperty] = useState({
    street: '',
    streetNumber: '',
    floor: '',
    apartment: '',
    city: '',
    province: 'Buenos Aires',
    postalCode: '',
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
    street: '',
    streetNumber: '',
    floor: '',
    apartment: '',
    city: '',
    province: '',
    postalCode: '',
    type: '',
    baseRentAmount: '',
    leaseStartDate: null
  })
  const [editLoading, setEditLoading] = useState(false)

  // Fetch property units from API
  const fetchPropertyUnits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_BASE_URL}/property-units`)
      // Transform API response to match expected format
      const dataArray = Array.isArray(response.data) ? response.data : []
      const transformedData = dataArray.map(property => {
        const lastPayment = property.payments && property.payments.length > 0
          ? property.payments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0]
          : null
        const hasPendingPayment = property.payments?.some(p => p.status === 'PENDING' || p.status === 'OVERDUE') || false

        return {
          id: property.id,
          address: property.address,
          type: property.type,
          status: property.tenant ? 'Occupied' : 'Vacant',
          tenant: property.tenant?.fullName || '',
          tenantId: property.tenant?.id || null,
          monthlyRent: parseFloat(property.baseRentAmount) || 0,
          leaseStart: property.leaseStartDate,
          lastPaymentDate: lastPayment?.paymentDate || null,
          hasPendingPayment,
          payments: property.payments || []
        }
      })
      setPropertyUnits(transformedData)
    } catch (err) {
      console.error('Error fetching property units:', err)
      setError('Failed to load properties. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPropertyUnits()
  }, [fetchPropertyUnits])

  // Auto-open detail dialog when initialPropertyId is provided
  useEffect(() => {
    if (initialPropertyId) {
      const property = propertyUnits.find(p => p.id === initialPropertyId)
      if (property) {
        setSelectedProperty(property)
        setOpenViewDialog(true)
        onPropertyViewed?.()
      }
    }
  }, [initialPropertyId, propertyUnits, onPropertyViewed])

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
      (property.tenant && property.tenant.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const handleAddProperty = useCallback(async () => {
    setAddLoading(true)
    try {
      const payload = {
        street: newProperty.street,
        streetNumber: newProperty.streetNumber,
        floor: newProperty.floor || null,
        apartment: newProperty.apartment || null,
        city: newProperty.city,
        province: newProperty.province,
        postalCode: newProperty.postalCode || null,
        type: newProperty.type,
        baseRentAmount: parseFloat(newProperty.baseRentAmount),
        leaseStartDate: newProperty.leaseStartDate
          ? newProperty.leaseStartDate.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      }
      await axios.post(`${API_BASE_URL}/property-units`, payload)
      setOpenAddDialog(false)
      setNewProperty({
        street: '',
        streetNumber: '',
        floor: '',
        apartment: '',
        city: '',
        province: 'Buenos Aires',
        postalCode: '',
        type: '',
        baseRentAmount: '',
        leaseStartDate: null
      })
      // Refresh the list
      fetchPropertyUnits()
    } catch (err) {
      console.error('Error adding property:', err)
      setError('Failed to add property. Please try again.')
    } finally {
      setAddLoading(false)
    }
  }, [newProperty, fetchPropertyUnits])

  const handleViewDetails = useCallback((property) => {
    setSelectedProperty(property)
    setOpenViewDialog(true)
  }, [])

  const handleCloseViewDialog = useCallback(() => {
    setOpenViewDialog(false)
    setSelectedProperty(null)
  }, [])

  const handleEdit = useCallback(async (property) => {
    setEditingProperty(property)
    // Fetch full property data to get structured fields
    try {
      const response = await axios.get(`${API_BASE_URL}/property-units/${property.id}`)
      const fullProperty = response.data
      setEditFormData({
        street: fullProperty.street || '',
        streetNumber: fullProperty.streetNumber || '',
        floor: fullProperty.floor || '',
        apartment: fullProperty.apartment || '',
        city: fullProperty.city || '',
        province: fullProperty.province || 'Buenos Aires',
        postalCode: fullProperty.postalCode || '',
        type: fullProperty.type || property.type,
        baseRentAmount: (fullProperty.baseRentAmount || property.monthlyRent).toString(),
        leaseStartDate: fullProperty.leaseStartDate ? new Date(fullProperty.leaseStartDate + 'T00:00:00') : (property.leaseStart ? new Date(property.leaseStart + 'T00:00:00') : null)
      })
    } catch (err) {
      // Fallback to using legacy address if structured fields not available
      setEditFormData({
        street: '',
        streetNumber: '',
        floor: '',
        apartment: '',
        city: '',
        province: 'Buenos Aires',
        postalCode: '',
        type: property.type,
        baseRentAmount: property.monthlyRent.toString(),
        leaseStartDate: property.leaseStart ? new Date(property.leaseStart + 'T00:00:00') : null
      })
    }
    setOpenEditDialog(true)
  }, [])

  const handleCloseEditDialog = useCallback(() => {
    setOpenEditDialog(false)
    setEditingProperty(null)
    setEditFormData({
      street: '',
      streetNumber: '',
      floor: '',
      apartment: '',
      city: '',
      province: '',
      postalCode: '',
      type: '',
      baseRentAmount: '',
      leaseStartDate: null
    })
  }, [])

  const handleUpdateProperty = useCallback(async () => {
    if (!editFormData.street || !editFormData.streetNumber || !editFormData.city || !editFormData.province || !editFormData.type || !editFormData.baseRentAmount) {
      return
    }

    setEditLoading(true)
    try {
      const payload = {
        street: editFormData.street,
        streetNumber: editFormData.streetNumber,
        floor: editFormData.floor || null,
        apartment: editFormData.apartment || null,
        city: editFormData.city,
        province: editFormData.province,
        postalCode: editFormData.postalCode || null,
        type: editFormData.type,
        baseRentAmount: parseFloat(editFormData.baseRentAmount),
        leaseStartDate: editFormData.leaseStartDate
          ? editFormData.leaseStartDate.toISOString().split('T')[0]
          : editingProperty.leaseStart
      }
      await axios.put(`${API_BASE_URL}/property-units/${editingProperty.id}`, payload)
      handleCloseEditDialog()
      // Refresh the list
      fetchPropertyUnits()
    } catch (err) {
      console.error('Error updating property:', err)
      setError('Failed to update property. Please try again.')
    } finally {
      setEditLoading(false)
    }
  }, [editFormData, editingProperty, handleCloseEditDialog, fetchPropertyUnits])

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
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    boxShadow: { xs: 2, sm: 4 }
                  }
                }}
                onClick={() => handleViewDetails(property)}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 }, pr: { xs: 2.5, sm: 3 } }}>
                  {/* Property Type and Status */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.5, sm: 2 }, gap: 1, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: '0 1 auto' }}>
                      <Avatar sx={{
                        bgcolor: 'primary.main',
                        width: { xs: 28, sm: 32 },
                        height: { xs: 28, sm: 32 },
                        flexShrink: 0
                      }}>
                        {React.cloneElement(getTypeIcon(property.type), {
                          sx: { fontSize: { xs: 16, sm: 20 } }
                        })}
                      </Avatar>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
                      >
                        {t(property.type.toLowerCase())}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      {property.hasPendingPayment && (
                        <Chip
                          icon={<Warning sx={{ fontSize: 12 }} />}
                          label={t('paymentOverdue')}
                          size="small"
                          color="error"
                          sx={{
                            fontSize: { xs: '0.6rem', sm: '0.7rem' },
                            height: { xs: 18, sm: 24 },
                            '& .MuiChip-icon': { fontSize: 12 },
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      )}
                      <Chip
                        label={t(property.status.toLowerCase())}
                        color={getStatusColor(property.status)}
                        size="small"
                        sx={{
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          height: { xs: 18, sm: 24 },
                          '& .MuiChip-label': { px: { xs: 0.75, sm: 1 } }
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
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewDetails(property)
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(property)
                      }}
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
              {/* Address Fields */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                {t('addressSection')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label={t('streetLabel')}
                  value={newProperty.street}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, street: e.target.value }))}
                  required
                  fullWidth
                  sx={{ flex: { sm: 2 } }}
                />
                <TextField
                  label={t('streetNumberLabel')}
                  value={newProperty.streetNumber}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, streetNumber: e.target.value }))}
                  required
                  fullWidth
                  sx={{ flex: { sm: 1 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label={t('floorLabel')}
                  value={newProperty.floor}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, floor: e.target.value }))}
                  fullWidth
                  sx={{ flex: { sm: 1 } }}
                />
                <TextField
                  label={t('apartmentLabel')}
                  value={newProperty.apartment}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, apartment: e.target.value }))}
                  fullWidth
                  sx={{ flex: { sm: 1 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label={t('cityLabel')}
                  value={newProperty.city}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, city: e.target.value }))}
                  required
                  fullWidth
                  sx={{ flex: { sm: 1 } }}
                />
                <TextField
                  label={t('postalCodeLabel')}
                  value={newProperty.postalCode}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, postalCode: e.target.value }))}
                  fullWidth
                  sx={{ flex: { sm: 1 } }}
                />
              </Box>
              <TextField
                select
                label={t('provinceLabel')}
                value={newProperty.province}
                onChange={(e) => setNewProperty(prev => ({ ...prev, province: e.target.value }))}
                fullWidth
                required
              >
                <MenuItem value="Buenos Aires">Buenos Aires</MenuItem>
                <MenuItem value="CABA">CABA</MenuItem>
                <MenuItem value="Córdoba">Córdoba</MenuItem>
                <MenuItem value="Santa Fe">Santa Fe</MenuItem>
                <MenuItem value="Mendoza">Mendoza</MenuItem>
                <MenuItem value="Tucumán">Tucumán</MenuItem>
                <MenuItem value="Entre Ríos">Entre Ríos</MenuItem>
                <MenuItem value="Salta">Salta</MenuItem>
                <MenuItem value="Misiones">Misiones</MenuItem>
                <MenuItem value="Chaco">Chaco</MenuItem>
                <MenuItem value="Corrientes">Corrientes</MenuItem>
                <MenuItem value="Santiago del Estero">Santiago del Estero</MenuItem>
                <MenuItem value="San Juan">San Juan</MenuItem>
                <MenuItem value="Jujuy">Jujuy</MenuItem>
                <MenuItem value="Río Negro">Río Negro</MenuItem>
                <MenuItem value="Neuquén">Neuquén</MenuItem>
                <MenuItem value="Formosa">Formosa</MenuItem>
                <MenuItem value="Chubut">Chubut</MenuItem>
                <MenuItem value="San Luis">San Luis</MenuItem>
                <MenuItem value="Catamarca">Catamarca</MenuItem>
                <MenuItem value="La Rioja">La Rioja</MenuItem>
                <MenuItem value="La Pampa">La Pampa</MenuItem>
                <MenuItem value="Santa Cruz">Santa Cruz</MenuItem>
                <MenuItem value="Tierra del Fuego">Tierra del Fuego</MenuItem>
              </TextField>

              {/* Property Details */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                {t('propertyDetails')}
              </Typography>
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
                placeholder={t('baseRentPlaceholder')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
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
              disabled={addLoading || !newProperty.street || !newProperty.streetNumber || !newProperty.city || !newProperty.province || !newProperty.type || !newProperty.baseRentAmount}
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
                      label={t('pendingPayment')}
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
                        <Typography variant="caption" color="text.secondary">{t('area')}</Typography>
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
                        <Typography variant="body1">{t('yes')}</Typography>
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
                        {t('amenities')}
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
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 3,
                    cursor: onNavigateToTenant && selectedProperty.tenantId ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': onNavigateToTenant && selectedProperty.tenantId ? {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    } : {}
                  }}
                  onClick={() => {
                    if (onNavigateToTenant && selectedProperty.tenantId) {
                      handleCloseViewDialog()
                      onNavigateToTenant(selectedProperty.tenantId)
                    }
                  }}
                >
                  {selectedProperty.tenant ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Person sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body1" sx={{ fontWeight: 500, flex: 1 }}>{selectedProperty.tenant}</Typography>
                        {onNavigateToTenant && selectedProperty.tenantId && (
                          <OpenInNew sx={{ fontSize: 16, color: 'text.secondary' }} />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {selectedProperty.leaseStart && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">{t('leaseStart')}</Typography>
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
                            <Typography variant="caption" color="text.secondary">{t('lastPayment')}</Typography>
                            <Typography variant="body2">{selectedProperty.lastPaymentDate}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Person sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {t('noTenantAssigned')}
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* Payment History */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {t('paymentHistory')}
                </Typography>
                <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                  {(() => {
                    const payments = selectedProperty.payments || []
                    return payments.length > 0 ? (
                      <List disablePadding>
                        {payments.slice(0, 5).map((payment, index) => (
                          <ListItem
                            key={payment.id}
                            divider={index < payments.length - 1}
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
                                handleCloseViewDialog()
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
                                      label={payment.status === 'PAID' ? t('paid') : t('pending')}
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
                                  {payment.paymentDate} {payment.description && `• ${payment.description}`}
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
                    handleEdit(selectedProperty)
                  }}
                >
                  {t('edit')}
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
              {/* Address Fields */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                {t('addressSection')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label={t('streetLabel')}
                  value={editFormData.street}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, street: e.target.value }))}
                  required
                  fullWidth
                  sx={{ flex: { sm: 2 } }}
                />
                <TextField
                  label={t('streetNumberLabel')}
                  value={editFormData.streetNumber}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, streetNumber: e.target.value }))}
                  required
                  fullWidth
                  sx={{ flex: { sm: 1 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label={t('floorLabel')}
                  value={editFormData.floor}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, floor: e.target.value }))}
                  fullWidth
                  sx={{ flex: { sm: 1 } }}
                />
                <TextField
                  label={t('apartmentLabel')}
                  value={editFormData.apartment}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, apartment: e.target.value }))}
                  fullWidth
                  sx={{ flex: { sm: 1 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label={t('cityLabel')}
                  value={editFormData.city}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                  fullWidth
                  sx={{ flex: { sm: 1 } }}
                />
                <TextField
                  label={t('postalCodeLabel')}
                  value={editFormData.postalCode}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                  fullWidth
                  sx={{ flex: { sm: 1 } }}
                />
              </Box>
              <TextField
                select
                label={t('provinceLabel')}
                value={editFormData.province}
                onChange={(e) => setEditFormData(prev => ({ ...prev, province: e.target.value }))}
                fullWidth
                required
              >
                <MenuItem value="Buenos Aires">Buenos Aires</MenuItem>
                <MenuItem value="CABA">CABA</MenuItem>
                <MenuItem value="Córdoba">Córdoba</MenuItem>
                <MenuItem value="Santa Fe">Santa Fe</MenuItem>
                <MenuItem value="Mendoza">Mendoza</MenuItem>
                <MenuItem value="Tucumán">Tucumán</MenuItem>
                <MenuItem value="Entre Ríos">Entre Ríos</MenuItem>
                <MenuItem value="Salta">Salta</MenuItem>
                <MenuItem value="Misiones">Misiones</MenuItem>
                <MenuItem value="Chaco">Chaco</MenuItem>
                <MenuItem value="Corrientes">Corrientes</MenuItem>
                <MenuItem value="Santiago del Estero">Santiago del Estero</MenuItem>
                <MenuItem value="San Juan">San Juan</MenuItem>
                <MenuItem value="Jujuy">Jujuy</MenuItem>
                <MenuItem value="Río Negro">Río Negro</MenuItem>
                <MenuItem value="Neuquén">Neuquén</MenuItem>
                <MenuItem value="Formosa">Formosa</MenuItem>
                <MenuItem value="Chubut">Chubut</MenuItem>
                <MenuItem value="San Luis">San Luis</MenuItem>
                <MenuItem value="Catamarca">Catamarca</MenuItem>
                <MenuItem value="La Rioja">La Rioja</MenuItem>
                <MenuItem value="La Pampa">La Pampa</MenuItem>
                <MenuItem value="Santa Cruz">Santa Cruz</MenuItem>
                <MenuItem value="Tierra del Fuego">Tierra del Fuego</MenuItem>
              </TextField>

              {/* Property Details */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                {t('propertyDetails')}
              </Typography>
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
                placeholder={t('baseRentPlaceholder')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
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
              disabled={editLoading || !editFormData.street || !editFormData.streetNumber || !editFormData.city || !editFormData.province || !editFormData.type || !editFormData.baseRentAmount}
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
