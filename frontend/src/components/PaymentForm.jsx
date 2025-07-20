import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format } from 'date-fns'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

function PaymentForm() {
  const [formData, setFormData] = useState({
    propertyUnitId: '',
    amount: '',
    paymentDate: null,
    paymentType: 'RENT',
    description: ''
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [propertyUnits, setPropertyUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const paymentTypes = [
    { value: 'RENT', label: 'Rent Payment' },
    { value: 'DEPOSIT', label: 'Security Deposit' },
    { value: 'MAINTENANCE', label: 'Maintenance Fee' },
    { value: 'UTILITY', label: 'Utility Payment' },
    { value: 'OTHER', label: 'Other' }
  ]

  useEffect(() => {
    fetchPropertyUnits()
  }, [])

  const fetchPropertyUnits = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/property-units`)
      setPropertyUnits(response.data)
    } catch (err) {
      console.error('Error fetching property units:', err)
      setError('Failed to load property units. Please make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    // Property unit validation
    if (!formData.propertyUnitId) {
      errors.propertyUnitId = 'Property unit is required'
    }
    
    // Amount validation
    if (!formData.amount) {
      errors.amount = 'Payment amount is required'
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Payment amount must be greater than 0'
      } else if (amount > 999999.99) {
        errors.amount = 'Payment amount cannot exceed 999,999.99'
      }
    }
    
    // Date validation
    if (!formData.paymentDate) {
      errors.paymentDate = 'Payment date is required'
    } else if (formData.paymentDate > new Date()) {
      errors.paymentDate = 'Payment date cannot be in the future'
    }
    
    // Description validation
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setError('Please fix the validation errors below')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    setValidationErrors({})
    
    try {
      const paymentData = {
        propertyUnit: { id: parseInt(formData.propertyUnitId) },
        amount: parseFloat(formData.amount),
        paymentDate: format(formData.paymentDate, 'yyyy-MM-dd'),
        paymentType: formData.paymentType,
        description: formData.description || null
      }
      
      const response = await axios.post(`${API_BASE_URL}/payments`, paymentData)
      
      if (response.status === 201) {
        setSuccess('Payment registered successfully!')
        setFormData({
          propertyUnitId: '',
          amount: '',
          paymentDate: null,
          paymentType: 'RENT',
          description: ''
        })
        setValidationErrors({})
      }
    } catch (err) {
      console.error('Error creating payment:', err)
      
      // Handle validation errors from backend
      if (err.response?.status === 400 && err.response?.data?.validationErrors) {
        setValidationErrors(err.response.data.validationErrors)
        setError('Please fix the validation errors below')
      } else {
        setError(err.response?.data?.message || 'Failed to register payment')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    // Clear messages when user starts typing
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      paymentDate: newDate
    }))
  }

  const selectedPropertyUnit = propertyUnits.find(unit => unit.id === parseInt(formData.propertyUnitId))

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Register Payment
        </Typography>
        
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
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Property Unit</InputLabel>
                  <Select
                    value={formData.propertyUnitId}
                    onChange={(e) => setFormData({ ...formData, propertyUnitId: e.target.value })}
                    label="Property Unit"
                    error={!!validationErrors.propertyUnitId}
                    helperText={validationErrors.propertyUnitId}
                  >
                    {propertyUnits.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.address} ({unit.type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Payment Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  fullWidth
                  required
                  error={!!validationErrors.amount}
                  helperText={validationErrors.amount}
                  inputProps={{ step: '0.01', min: '0.01', max: '999999.99' }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Payment Date"
                  value={formData.paymentDate}
                  onChange={(date) => setFormData({ ...formData, paymentDate: date })}
                  maxDate={new Date()}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required 
                      error={!!validationErrors.paymentDate}
                      helperText={validationErrors.paymentDate}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Payment Type"
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
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

              <Grid item xs={12}>
                <TextField
                  label="Description (Optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  error={!!validationErrors.description}
                  helperText={validationErrors.description || `${formData.description.length}/500 characters`}
                  inputProps={{ maxLength: 500 }}
                />
              </Grid>

              {selectedPropertyUnit && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Property Details:
                    </Typography>
                    <Typography variant="body2">
                      <strong>Address:</strong> {selectedPropertyUnit.address}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type:</strong> {selectedPropertyUnit.type}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Base Rent:</strong> ${selectedPropertyUnit.baseRentAmount?.toFixed(2)}
                    </Typography>
                    {selectedPropertyUnit.tenant && (
                      <Typography variant="body2">
                        <strong>Tenant:</strong> {selectedPropertyUnit.tenant.firstName} {selectedPropertyUnit.tenant.lastName}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => {
                      setFormData({
                        propertyUnitId: '',
                        amount: '',
                        paymentDate: new Date(),
                        paymentType: 'RENT',
                        description: ''
                      })
                      setError(null)
                      setSuccess(null)
                    }}
                  >
                    Clear Form
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Register Payment'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </LocalizationProvider>
  )
}

export default PaymentForm
