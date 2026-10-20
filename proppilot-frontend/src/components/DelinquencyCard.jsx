import React, { useState, useEffect } from 'react'
import { Card, CardActionArea, CardContent, Typography, Box } from '@mui/material'
import { ErrorOutline } from '@mui/icons-material'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'
import DelinquencyDialog from './DelinquencyDialog'

const DelinquencyCard = () => {
  const { t, formatCurrency } = useLanguage()
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    axios.get(`${API_BASE_URL}/delinquency`)
      .then(res => { if (!cancelled) setData(res.data) })
      .catch(err => console.error('Error loading delinquency:', err))
    return () => { cancelled = true }
  }, [])

  if (!data || data.tenantCount === 0) return null

  return (
    <>
      <Card
        data-testid="delinquency-card"
        sx={{ mb: 3, border: 1, borderColor: 'error.main', bgcolor: 'error.50' }}
      >
        <CardActionArea onClick={() => setOpen(true)}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ErrorOutline color="error" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="subtitle2" color="error">{t('delinquencyTitle')}</Typography>
              <Typography variant="h5" data-testid="delinquency-total" sx={{ fontWeight: 700 }}>
                {formatCurrency(data.totalOwed)} {t('delinquencyOwedTotal')}
              </Typography>
              <Typography variant="body2" data-testid="delinquency-count">
                {t('delinquencyTenants', { count: data.tenantCount })}
              </Typography>
              <Typography variant="caption" color="text.secondary">{t('delinquencyBaseRentNote')}</Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
      <DelinquencyDialog open={open} onClose={() => setOpen(false)} items={data.items} />
    </>
  )
}

export default DelinquencyCard
