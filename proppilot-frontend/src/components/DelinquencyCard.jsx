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
    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
      <Card data-testid="delinquency-card" sx={{ height: '100%', border: 1, borderColor: 'error.main' }}>
        <CardActionArea onClick={() => setOpen(true)} sx={{ height: '100%' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <ErrorOutline sx={{ fontSize: 24, color: 'error.main' }} />
              <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>{t('delinquencyTitle')}</Typography>
            </Box>
            <Typography
              variant="h5"
              data-testid="delinquency-total"
              sx={{ fontWeight: 700, color: 'error.main', fontSize: { xs: '1rem', sm: '1rem', md: '0.8rem', lg: '1rem' }, whiteSpace: 'nowrap' }}
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
