import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'

const ALERT_COLORS = { D30: 'error', D60: 'warning', D90: 'info', ENDED: 'error' }

// 'YYYY-MM-DD' -> 'dd/mm/yyyy' by string split, so the browser time zone cannot shift the day.
const formatDate = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const monthOf = (iso) => iso.slice(0, 7)

const ContractAgenda = () => {
  const { t, language } = useLanguage()
  const [agenda, setAgenda] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    axios.get(`${API_BASE_URL}/agenda`)
      .then(({ data }) => { if (!cancelled) setAgenda(data) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const money = (n) =>
    '$' + new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', { maximumFractionDigits: 0 }).format(n)

  const monthLabel = (ym) => t('monthsShort')[parseInt(ym.slice(5, 7), 10) - 1]

  const alertLabel = (item) => {
    const n = Math.abs(item.daysToEnd)
    if (item.alertLevel === 'ENDED') {
      return n === 1 ? t('agendaEndedOneDayAgo') : t('agendaEndedDaysAgo', { n })
    }
    if (item.daysToEnd === 0) return t('agendaEndsToday')
    return n === 1 ? t('agendaEndsInOneDay') : t('agendaEndsInDays', { n })
  }

  const adjustmentLabel = (item) => {
    if (item.adjustmentIndex === 'NONE') return t('agendaFixedRent')
    if (!item.nextAdjustmentDate) return t('agendaNoPendingAdjustments')
    const base = t('agendaNextAdjustmentOn', { date: formatDate(item.nextAdjustmentDate) })
    const estimate = item.estimateAvailable
      ? t('agendaEstimated', {
        amount: money(item.estimatedAmount),
        index: item.adjustmentIndex,
        date: formatDate(item.indexDate)
      })
      : t('agendaNoEstimate')
    return `${base} · ${estimate}`
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  }
  if (error) return <Alert severity="error">{t('agendaLoadError')}</Alert>
  if (!agenda.items.length) return <Typography>{t('agendaEmpty')}</Typography>

  const cell = (ym, children, key) => <TableCell key={key || ym} sx={{ whiteSpace: 'nowrap' }}>{children}</TableCell>

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>{t('agendaTitle')}</Typography>
      <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
        <Table size="small" data-testid="agenda-table">
          <TableHead>
            <TableRow>
              <TableCell>{t('agendaContract')}</TableCell>
              {agenda.months.map((ym) => <TableCell key={ym}>{monthLabel(ym)}</TableCell>)}
            </TableRow>
          </TableHead>
          {agenda.items.map((item) => (
            <TableBody key={item.leaseId} data-testid={`agenda-lease-${item.leaseId}`}>
              <TableRow>
                <TableCell sx={{ minWidth: 220 }}>
                  <Typography variant="body2" fontWeight={700}>{item.propertyAddress}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('agendaBase')} {money(item.baseRent)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {item.tenantNames.join(', ')}
                  </Typography>
                </TableCell>
                {agenda.months.map((ym) => cell(ym,
                  monthOf(item.endDate) === ym && (
                    <Chip
                      size="small"
                      variant="outlined"
                      color={ALERT_COLORS[item.alertLevel] || 'default'}
                      label={`${t('agendaEndMarker')} ${formatDate(item.endDate)}`}
                    />
                  )
                ))}
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary' }}>{t('agendaNextAdjustment')}</TableCell>
                {agenda.months.map((ym) => cell(ym,
                  item.adjustmentDatesInWindow.filter((d) => monthOf(d) === ym).map((d) => (
                    <Box key={d} component="span" data-testid="adjustment-marker" sx={{ display: 'block' }}>
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {formatDate(d)}
                      </Typography>
                      {d === item.nextAdjustmentDate && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {item.estimateAvailable ? money(item.estimatedAmount) : t('agendaNoEstimate')}
                        </Typography>
                      )}
                    </Box>
                  ))
                ))}
              </TableRow>
              <TableRow>
                <TableCell colSpan={agenda.months.length + 1} sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {item.alertLevel !== 'NONE' && (
                      <Chip size="small" color={ALERT_COLORS[item.alertLevel]} label={alertLabel(item)} />
                    )}
                    <Chip size="small" variant="outlined" color="success" label={adjustmentLabel(item)} />
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          ))}
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        {t('agendaFooter')}
      </Typography>
    </Box>
  )
}

export default ContractAgenda
