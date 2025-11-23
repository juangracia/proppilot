import React, { useState, useEffect } from 'react'
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
  MenuItem
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format } from 'date-fns'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'

const API_BASE_URL = '/api'

function PaymentForm() {
  const { t } = useLanguage()

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
    { value: 'RENT', label: t('rentPayment') },
    { value: 'DEPOSIT', label: t('depositPayment') },
    { value: 'MAINTENANCE', label: t('maintenancePayment') },
    { value: 'UTILITY', label: t('utilityPayment') },
    { value: 'OTHER', label: t('otherPayment') }
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
      setError(t('failedToLoadProperties'))
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    // Property unit validation
    if (!formData.propertyUnitId) {
      errors.propertyUnitId = t('propertyUnitRequired')
    }

    // Amount validation
    if (!formData.amount) {
      errors.amount = t('amountRequired')
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        errors.amount = t('amountPositive')
      } else if (amount > 999999.99) {
        errors.amount = t('amountExceeded')
      }
    }

    // Date validation
    if (!formData.paymentDate) {
      errors.paymentDate = t('dateRequired')
    } else if (formData.paymentDate > new Date()) {
      errors.paymentDate = t('dateFuture')
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      errors.description = t('descriptionLength')
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

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
      const paymentData = {
        propertyUnit: { id: parseInt(formData.propertyUnitId) },
        amount: parseFloat(formData.amount),
        paymentDate: format(formData.paymentDate, 'yyyy-MM-dd'),
        paymentType: formData.paymentType,
        description: formData.description || null
      }

      const response = await axios.post(`${API_BASE_URL}/payments`, paymentData)

      if (response.status === 201) {
        setSuccess(t('paymentRegisteredSuccess'))
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
        setError(t('fixValidationErrors'))
      } else {
        setError(err.response?.data?.message || t('failedToRegisterPayment'))
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
      <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mx: 0 }}>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              mb: { xs: 2, sm: 2.5 }
            }}
          >
            {t('registerPaymentTitle')}
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
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required error={!!validationErrors.propertyUnitId}>
                    <InputLabel>{t('propertyUnitLabel')}</InputLabel>
                    <Select
                      value={formData.propertyUnitId}
                      onChange={(e) => setFormData(prev => ({ ...prev, propertyUnitId: e.target.value }))}
                      label={t('propertyUnitLabel')}
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
                  <TextField
                    label={t('paymentAmountLabel')}
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
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

                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label={t('paymentDateLabel')}
                    value={formData.paymentDate}
                    onChange={(date) => setFormData(prev => ({ ...prev, paymentDate: date }))}
                    maxDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!validationErrors.paymentDate,
                        helperText: validationErrors.paymentDate
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label={t('paymentTypeLabel')}
                    value={formData.paymentType}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
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

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label={t('descriptionLabel')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                    error={!!validationErrors.description}
                    helperText={validationErrors.description || t('charactersCount', { count: formData.description.length })}
                    inputProps={{ maxLength: 500 }}
                  />
                </Grid>

                {selectedPropertyUnit && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{
                      p: { xs: 1.5, sm: 2 },
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.default'
                    }}>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        color="primary"
                        sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
                      >
                        {t('selectedPropertyDetails')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          <strong>{t('addressLabel')}:</strong> {selectedPropertyUnit.address}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          <strong>{t('type')}:</strong> {t(selectedPropertyUnit.type.toLowerCase())}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                        >
                          <strong>{t('baseRentLabel')}:</strong> ${selectedPropertyUnit.baseRentAmount?.toFixed(2)}
                        </Typography>
                        {selectedPropertyUnit.tenant && (
                          <Typography
                            variant="body2"
                            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                          >
                            <strong>{t('tenant')}:</strong> {selectedPropertyUnit.tenant.firstName} {selectedPropertyUnit.tenant.lastName}
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
                          amount: '',
                          paymentDate: null,
                          paymentType: 'RENT',
                          description: ''
                        })
                        setError('')
                        setSuccess('')
                        setValidationErrors({})
                      }}
                      sx={{
                        minWidth: { xs: '100%', sm: 100 },
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      {t('clearForm')}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        minWidth: { xs: '100%', sm: 140 },
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : t('registerPaymentAction')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  )
}

export default PaymentForm
