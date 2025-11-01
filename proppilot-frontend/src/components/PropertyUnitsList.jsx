import React, { useState, useEffect, useCallback } from 'react'
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

const API_BASE_URL = '/api'

// Mock data for demonstration
const mockProperties = [
  {
    id: 1,
    address: '123 Oak Street, Apt 2B',
    type: 'Apartment',
    status: 'Occupied',
    tenant: 'Sarah Johnson',
    monthlyRent: 1200,
    leaseStart: '12/31/2023'
  },
  {
    id: 2,
    address: '456 Pine Avenue House',
    type: 'House',
    status: 'Occupied',
    tenant: 'Mike Chen',
    monthlyRent: 2100,
    leaseStart: '11/14/2023'
  },
  {
    id: 3,
    address: '789 Maple Court, Unit 5A',
    type: 'Apartment',
    status: 'Occupied',
    tenant: 'Emma Davis',
    monthlyRent: 950,
    leaseStart: '1/31/2024'
  },
  {
    id: 4,
    address: '321 Elm Street Loft',
    type: 'Commercial',
    status: 'Vacant',
    tenant: 'Vacant',
    monthlyRent: 1800,
    leaseStart: null
  }
]

function PropertyUnitsList() {
  const { t, formatCurrency, currency } = useLanguage()
  const [propertyUnits, setPropertyUnits] = useState(mockProperties)
  const [loading, setLoading] = useState(false)
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

  const filteredProperties = propertyUnits.filter(property =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'Occupied':
        return 'success'
      case 'Vacant':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getTypeIcon = (type) => {
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
  }

  const handleAddProperty = () => {
    setAddLoading(true)
    // Simulate API call
    setTimeout(() => {
      const newId = Math.max(...propertyUnits.map(p => p.id)) + 1
      const property = {
        id: newId,
        address: newProperty.address,
        type: newProperty.type,
        status: 'Vacant',
        tenant: 'Vacant',
        monthlyRent: parseFloat(newProperty.baseRentAmount),
        leaseStart: newProperty.leaseStartDate ? newProperty.leaseStartDate.toLocaleDateString() : null
      }
      setPropertyUnits([...propertyUnits, property])
      setOpenAddDialog(false)
      setNewProperty({
        address: '',
        type: '',
        baseRentAmount: '',
        leaseStartDate: null
      })
      setAddLoading(false)
    }, 1000)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            mb: { xs: 0.75, sm: 1 },
            fontSize: { xs: '1.5rem', sm: '2.125rem' }
          }}
        >
          Properties
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Manage your rental properties and units.
        </Typography>
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
          placeholder="Search properties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
          onClick={() => setOpenAddDialog(true)}
          sx={{ 
            textTransform: 'none',
            width: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Add Property
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Properties Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {filteredProperties.map((property) => (
          <Grid item xs={12} sm={6} md={4} key={property.id}>
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
                      {property.type}
                    </Typography>
                  </Box>
                  <Chip 
                    label={property.status} 
                    color={getStatusColor(property.status)}
                    size="small"
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      height: { xs: 20, sm: 24 }
                    }}
                  />
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
                    Tenant:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    {property.tenant}
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
                    Monthly Rent:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600, 
                      color: 'primary.main',
                      fontSize: { xs: '0.875rem', sm: '0.875rem' }
                    }}
                  >
                    ${property.monthlyRent.toLocaleString()}
                  </Typography>
                </Box>

                {/* Lease Start */}
                {property.leaseStart && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
                    <CalendarToday sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Lease Start:
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
                    sx={{ 
                      textTransform: 'none', 
                      flex: 1,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    sx={{ 
                      textTransform: 'none', 
                      flex: 1,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Edit
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
        onClose={() => setOpenAddDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: '95vh', sm: '90vh' }
          }
        }}
      >
        <DialogTitle>Add New Property</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Property Address"
              value={newProperty.address}
              onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
              fullWidth
              required
            />
            <TextField
              select
              label="Property Type"
              value={newProperty.type}
              onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value })}
              fullWidth
              required
            >
              <MenuItem value="Apartment">Apartment</MenuItem>
              <MenuItem value="House">House</MenuItem>
              <MenuItem value="Commercial">Commercial</MenuItem>
            </TextField>
            <TextField
              label="Base Rent Amount"
              type="number"
              value={newProperty.baseRentAmount}
              onChange={(e) => setNewProperty({ ...newProperty, baseRentAmount: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <DatePicker
              label="Lease Start Date"
              value={newProperty.leaseStartDate}
              onChange={(date) => setNewProperty({ ...newProperty, leaseStartDate: date })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddProperty} 
            variant="contained"
            disabled={addLoading || !newProperty.address || !newProperty.type || !newProperty.baseRentAmount}
          >
            {addLoading ? <CircularProgress size={20} /> : 'Add Property'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PropertyUnitsList
