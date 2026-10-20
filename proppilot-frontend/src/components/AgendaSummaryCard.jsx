import { memo, useEffect, useState } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { ChevronRight, EventNote } from '@mui/icons-material'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'

const AGENDA_VIEW = 5

const AgendaSummaryCard = memo(({ onNavigate }) => {
  const { t } = useLanguage()
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    let cancelled = false
    axios.get(`${API_BASE_URL}/agenda`, { params: { days: 90 } })
      .then((res) => { if (!cancelled) setSummary(res.data.summary) })
      .catch((error) => console.error('Error fetching agenda summary:', error))
    return () => { cancelled = true }
  }, [])

  if (!summary) return null

  const plural = (n, one, many) => t(n === 1 ? one : many).replace('{n}', n)
  const text = [
    plural(summary.expiringWithin90, 'agendaSummaryExpiringOne', 'agendaSummaryExpiringMany'),
    plural(summary.adjustmentsThisMonth, 'agendaSummaryAdjustOne', 'agendaSummaryAdjustMany'),
    plural(summary.expiredNotRenewed, 'agendaSummaryExpiredOne', 'agendaSummaryExpiredMany')
  ].join(', ')

  return (
    <Paper
      data-testid="agenda-summary-card"
      sx={{
        p: 2,
        mb: 3,
        cursor: 'pointer',
        borderLeft: 4,
        borderColor: summary.expiredNotRenewed > 0 ? 'error.main' : 'primary.main',
        '&:hover': { boxShadow: 3 }
      }}
      onClick={() => onNavigate && onNavigate(AGENDA_VIEW)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <EventNote color="primary" sx={{ fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">{t('agendaTitle')}</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{text}</Typography>
        </Box>
        <ChevronRight />
      </Box>
    </Paper>
  )
})

AgendaSummaryCard.displayName = 'AgendaSummaryCard'

export default AgendaSummaryCard
