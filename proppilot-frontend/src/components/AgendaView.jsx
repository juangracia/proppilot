import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Chip, CircularProgress, Paper, Typography } from '@mui/material'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'

// Same filled style for every chip: light background, no border.
const CHIP_STYLES = {
  EXPIRED: { bgcolor: 'error.main', color: 'error.contrastText' },
  D30: { bgcolor: '#ffe0b2', color: '#a04a00' },
  D60: { bgcolor: '#fff3cd', color: '#8a6100' },
  D90: { bgcolor: '#eceff1', color: '#455a64' }
}
const ADJUSTMENT_CHIP_STYLE = { bgcolor: '#e1f0fb', color: 'primary.dark' }

// 'YYYY-MM-DD' to a local Date (new Date(string) would parse it as UTC and can show the previous day)
const parseDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const AgendaView = ({ onNavigateToLease }) => {
  const { t, language, formatCurrency } = useLanguage()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    axios.get(`${API_BASE_URL}/agenda`, { params: { days: 365 } })
      .then((res) => { if (!cancelled) setEvents(res.data.events || []) })
      .catch((err) => {
        console.error('Error fetching agenda:', err)
        if (!cancelled) setError(true)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const locale = language === 'es' ? 'es-AR' : 'en-US'
  const formatDate = (iso) => parseDate(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })

  const chipFor = (e) => {
    if (e.type === 'ADJUSTMENT') {
      return { label: t('agendaNextAdjustment').replace('{date}', formatDate(e.date)), sx: ADJUSTMENT_CHIP_STYLE }
    }
    const sx = CHIP_STYLES[e.alertLevel]
    if (!sx) return null
    if (e.alertLevel === 'EXPIRED') return { label: t('agendaExpiredNotRenewed'), sx }
    const label = e.daysUntil === 0 ? t('agendaEndsToday') : t('agendaEndsIn').replace('{days}', e.daysUntil)
    return { label, sx }
  }

  // The API already sorts expired first, then by date. Expired rows sit in their own group on top.
  const groups = useMemo(() => {
    const byKey = new Map()
    events.forEach((e) => {
      const key = e.alertLevel === 'EXPIRED' ? 'EXPIRED' : e.date.slice(0, 7)
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key).push(e)
    })
    return [...byKey.entries()]
  }, [events])

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
  }
  if (error) return <Alert severity="error">{t('agendaLoadError')}</Alert>
  if (events.length === 0) return <Alert severity="info">{t('agendaEmpty')}</Alert>

  const groupTitle = (key) => {
    if (key === 'EXPIRED') return t('agendaExpiredNotRenewed')
    const [y, m] = key.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  }

  return (
    <Box data-testid="agenda-view">
      {groups.map(([key, rows]) => (
        <Box key={key} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, textTransform: 'capitalize' }}>
            {groupTitle(key)}
          </Typography>
          {rows.map((e) => {
            const chip = chipFor(e)
            const isExpired = e.alertLevel === 'EXPIRED'
            return (
              <Paper
                key={`${e.leaseId}-${e.type}-${e.date}`}
                data-testid={isExpired ? 'agenda-row-expired' : 'agenda-row'}
                data-type={e.type}
                data-lease-id={e.leaseId}
                sx={{
                  p: 2, mb: 1, cursor: 'pointer',
                  borderLeft: 4, borderColor: isExpired ? 'error.main' : 'divider',
                  bgcolor: isExpired ? 'error.light' : undefined,
                  '&:hover': { boxShadow: 3 }
                }}
                onClick={() => onNavigateToLease && onNavigateToLease(e.leaseId)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{e.propertyAddress}</Typography>
                    {e.type === 'ADJUSTMENT' && (
                      <Typography variant="body2" color="text.secondary" data-testid="agenda-base">
                        {t('agendaBaseShort').replace('{amount}', formatCurrency(e.baseRent))}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">{e.tenantName}</Typography>
                    <Typography variant="body2">
                      {e.type === 'END' ? t('agendaEventEnd') : t('agendaEventAdjustment')}
                      {' - '}
                      <span data-testid="agenda-date">{formatDate(e.date)}</span>
                    </Typography>
                    {e.type === 'ADJUSTMENT' && e.estimatedRent != null && (
                      <Typography variant="body2" color="text.secondary">
                        {t('agendaEstimatedRent')}: {formatCurrency(e.estimatedRent)} ({t('agendaEstimatedNote')})
                      </Typography>
                    )}
                  </Box>
                  {chip && (
                    <Chip size="small" label={chip.label} sx={{ ...chip.sx, fontWeight: 600 }} />
                  )}
                </Box>
              </Paper>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}

export default AgendaView
