import React, { useState, useCallback, useEffect } from 'react'
import { TextField, InputAdornment, Typography } from '@mui/material'
import { useLanguage } from '../contexts/LanguageContext'

const MoneyInput = ({
  value,
  onChange,
  label,
  error,
  helperText,
  required,
  placeholder,
  fullWidth = true,
  disabled,
  ...props
}) => {
  const { language, currency } = useLanguage()
  const [displayValue, setDisplayValue] = useState('')

  const locale = language === 'es' ? 'es-AR' : 'en-US'
  const thousandSeparator = language === 'es' ? '.' : ','
  const decimalSeparator = language === 'es' ? ',' : '.'

  const formatForDisplay = useCallback((numericValue) => {
    if (!numericValue && numericValue !== 0) return ''
    const num = parseFloat(numericValue)
    if (isNaN(num)) return ''

    const parts = num.toFixed(2).split('.')
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator)
    return `${integerPart}${decimalSeparator}${parts[1]}`
  }, [thousandSeparator, decimalSeparator])

  const parseFromDisplay = useCallback((formattedValue) => {
    if (!formattedValue) return ''
    let cleaned = formattedValue.replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
    cleaned = cleaned.replace(decimalSeparator, '.')
    cleaned = cleaned.replace(/[^\d.]/g, '')
    const dotCount = (cleaned.match(/\./g) || []).length
    if (dotCount > 1) {
      const firstDot = cleaned.indexOf('.')
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
    }
    return cleaned
  }, [thousandSeparator, decimalSeparator])

  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      setDisplayValue(formatForDisplay(value))
    } else {
      setDisplayValue('')
    }
  }, [value, formatForDisplay])

  const handleChange = (e) => {
    const inputValue = e.target.value
    const numericValue = parseFromDisplay(inputValue)
    const parts = numericValue.split('.')
    if (parts[1] && parts[1].length > 2) {
      return
    }
    setDisplayValue(inputValue)
    if (onChange) {
      onChange(numericValue)
    }
  }

  const handleBlur = () => {
    if (displayValue) {
      const numericValue = parseFromDisplay(displayValue)
      if (numericValue && !isNaN(parseFloat(numericValue))) {
        setDisplayValue(formatForDisplay(numericValue))
      }
    }
  }

  return (
    <TextField
      {...props}
      label={label}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      fullWidth={fullWidth}
      required={required}
      disabled={disabled}
      error={error}
      helperText={helperText}
      placeholder={placeholder || '0,00'}
      inputProps={{
        inputMode: 'decimal',
        autoComplete: 'off',
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Typography sx={{ color: 'text.secondary' }}>{currency}</Typography>
          </InputAdornment>
        ),
      }}
    />
  )
}

export default MoneyInput
