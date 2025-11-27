import { useState, useEffect, useCallback } from 'react'
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
  Grid,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Home,
  Business,
  Person,
  AttachMoney,
  CalendarToday,
  Edit,
  Visibility
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'

function PropertyUnitsList() {
  const { t, formatCurrency, currency } = useLanguage()
  const [propertyUnits, setPropertyUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [newProperty, setNewProperty] = useState({
    address: '',
    type: '',
    baseRentAmount: '',
    leaseStartDate: null
  })
  const [addLoading, setAddLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [propertyToDelete, setPropertyToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const columns = [
    { 
      field: 'address', 
      headerName: t('address'), 
      flex: 2,
      minWidth: 200,
      maxWidth: 400
    },
    { 
      field: 'type', 
      headerName: t('type'), 
      flex: 0.8,
      minWidth: 100,
      maxWidth: 150
    },
    { 
      field: 'baseRentAmount', 
      headerName: t('baseRent'), 
      flex: 1,
      minWidth: 120,
      maxWidth: 180,
      valueFormatter: (value) => formatCurrency(value || 0)
    },
    { 
      field: 'leaseStartDate', 
      headerName: t('leaseStart'), 
      flex: 1,
      minWidth: 120,
      maxWidth: 160,
      valueFormatter: (value) => {
        if (!value) return 'N/A'
        return new Date(value).toLocaleDateString()
      }
    },
    { 
      field: 'tenant', 
      headerName: t('tenant'), 
      flex: 1.5,
      minWidth: 150,
      maxWidth: 250,
      valueGetter: (value, row) => {
        const tenant = row.tenant
        return tenant ? `${tenant.firstName} ${tenant.lastName}` : t('noTenant')
      }
    },
    {
      field: 'actions',
      headerName: t('actions'),
      flex: 0.5,
      minWidth: 80,
      maxWidth: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title={t('deleteProperty')}>
          <IconButton
            color="error"
            onClick={() => handleDeleteClick(params.row)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ]

  const fetchPropertyUnits = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_BASE_URL}/property-units`)
      setPropertyUnits(response.data)
    } catch (err) {
      console.error('Error fetching property units:', err)
      setError('Failed to load property units. Please make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  const searchPropertyUnits = useCallback(async (address) => {
    if (!address.trim()) {
      fetchPropertyUnits()
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_BASE_URL}/property-units/search`, {
        params: { address }
      })
      setPropertyUnits(response.data)
    } catch (err) {
      console.error('Error searching property units:', err)
      setError('Failed to search property units.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPropertyUnits()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPropertyUnits(searchTerm)
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchPropertyUnits])

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleAddProperty = () => {
    setOpenAddDialog(true)
  }

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false)
    setNewProperty({
      address: '',
      type: '',
      baseRentAmount: '',
      leaseStartDate: null
    })
  }

  const handleNewPropertyChange = (field, value) => {
    setNewProperty(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitNewProperty = async () => {
    try {
      setAddLoading(true)
      setError(null)
      
      const propertyData = {
        address: newProperty.address,
        type: newProperty.type,
        baseRentAmount: parseFloat(newProperty.baseRentAmount),
        leaseStartDate: newProperty.leaseStartDate ? newProperty.leaseStartDate.toISOString().split('T')[0] : null
      }
      
      const response = await axios.post(`${API_BASE_URL}/property-units`, propertyData)
      
      // Refresh the property list
      await fetchPropertyUnits()
      
      // Close dialog and reset form
      handleCloseAddDialog()
      
      // Show success message (you could add a success state if needed)
      console.log('Property added successfully:', response.data)
      
    } catch (err) {
      console.error('Error adding property:', err)
      setError('Error al agregar la propiedad. Por favor, verifique los datos e intente nuevamente.')
    } finally {
      setAddLoading(false)
    }
  }

  const handleDeleteClick = (property) => {
    setPropertyToDelete(property)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setPropertyToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return

    try {
      setDeleteLoading(true)
      setError(null)
      
      await axios.delete(`${API_BASE_URL}/property-units/${propertyToDelete.id}`)
      
      // Refresh the property list
      await fetchPropertyUnits()
      
      // Close dialog
      handleCloseDeleteDialog()
      
      console.log('Property deleted successfully')
      
    } catch (err) {
      console.error('Error deleting property:', err)
      setError(t('failedToDeleteProperty'))
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          {t('propertyUnitsTitle')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProperty}
          sx={{ ml: 2 }}
        >
          {t('addProperty')}
        </Button>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
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
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%', minWidth: 0 }}>
        <DataGrid
          rows={propertyUnits}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 20]}
          paginationMode="client"
          disableRowSelectionOnClick
          autoHeight={false}
          sx={{
            height: 650, // Fixed height to show exactly 10 rows + header + pagination
            '& .MuiDataGrid-cell:hover': {
              color: 'primary.main',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              fontWeight: 600,
            },
            '& .MuiDataGrid-root': {
              border: 'none',
            },
          }}
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('totalUnits', { count: propertyUnits.length, plural: propertyUnits.length !== 1 ? 's' : '' })}
      </Typography>

      {/* Add Property Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>{t('addNewProperty')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('addressLabel')}
                placeholder={t('addressPlaceholder')}
                value={newProperty.address}
                onChange={(e) => handleNewPropertyChange('address', e.target.value)}
                required
                helperText={t('addressHelper')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label={t('propertyTypeLabel')}
                value={newProperty.type}
                onChange={(e) => handleNewPropertyChange('type', e.target.value)}
                required
              >
                <MenuItem value="Apartment">{t('apartment')}</MenuItem>
                <MenuItem value="House">{t('house')}</MenuItem>
                <MenuItem value="Duplex">{t('duplex')}</MenuItem>
                <MenuItem value="Townhouse">{t('ph')}</MenuItem>
                <MenuItem value="Studio">{t('studio')}</MenuItem>
                <MenuItem value="Loft">{t('loft')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('baseRentLabel')}
                type="number"
                placeholder={t('baseRentPlaceholder')}
                value={newProperty.baseRentAmount}
                onChange={(e) => handleNewPropertyChange('baseRentAmount', e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">{t(`currencySymbol.${currency}`)}</InputAdornment>,
                }}
                helperText={t('baseRentHelper')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label={t('leaseStartLabel')}
                value={newProperty.leaseStartDate}
                onChange={(newValue) => handleNewPropertyChange('leaseStartDate', newValue)}
                maxDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    helperText: t('leaseStartHelper')
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>{t('cancel')}</Button>
          <Button 
            onClick={handleSubmitNewProperty} 
            variant="contained"
            disabled={addLoading || !newProperty.address || !newProperty.type || !newProperty.baseRentAmount || !newProperty.leaseStartDate}
          >
            {addLoading ? <CircularProgress size={20} /> : t('addPropertyAction')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>{t('confirmDeleteProperty')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('confirmDeletePropertyMessage')}
          </Typography>
          {propertyToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('address')}:</strong> {propertyToDelete.address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('type')}:</strong> {propertyToDelete.type}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>{t('cancel')}</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={20} /> : t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default PropertyUnitsList
