import React, { useState, useEffect } from 'react'
import { Card, CardActionArea, CardContent, Typography, Box } from '@mui/material'
import Grid from '@mui/material/Grid'
import { ErrorOutline } from '@mui/icons-material'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'
import DelinquencyDialog from './DelinquencyDialog'

// Renders as an item of the dashboard KPI grid, so it must be mounted inside that Grid container.
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
    <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
      <Card data-testid="delinquency-card" sx={{ height: '100%', border: 1, borderColor: 'error.main' }}>
        <CardActionArea onClick={() => setOpen(true)} sx={{ height: '100%' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <ErrorOutline sx={{ fontSize: 24, color: 'error.main' }} />
              <Typography variant="subtitle2" color="error">{t('delinquencyTitle')}</Typography>
            </Box>
            <Typography
              variant="h5"
              data-testid="delinquency-total"
              sx={{ fontWeight: 700, color: 'error.main', fontSize: { xs: '1.1rem', sm: '1.4rem' } }}
            >
              {formatCurrency(data.totalOwed)}
            </Typography>
            <Typography variant="caption" data-testid="delinquency-count" sx={{ display: 'block' }}>
              {data.tenantCount === 1
                ? t('delinquencyTenantsOne')
                : t('delinquencyTenantsMany', { count: data.tenantCount })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('delinquencyOwedTotal')} · {t('delinquencyBaseRentNote')}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
      <DelinquencyDialog open={open} onClose={() => setOpen(false)} items={data.items} />
    </Grid>
  )
}

export default DelinquencyCard
