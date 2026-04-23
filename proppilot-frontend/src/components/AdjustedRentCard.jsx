import { Box, Chip, Paper, Typography } from '@mui/material'
import { TrendingUp } from '@mui/icons-material'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLanguage } from '../contexts/LanguageContext'

const getFreqLabel = (months, t) => {
  if (months === 3) return t('freqQuarterly')
  if (months === 6) return t('freqBiannual')
  if (months === 12) return t('freqAnnual')
  return `${months} meses`
}

const formatShortDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy')
  } catch {
    return dateStr
  }
}

const AdjustedRentCard = ({ baseRent, adjusted }) => {
  const { t, formatCurrency } = useLanguage()

  if (!adjusted) return null

  if (adjusted.unavailableReason === 'INDEX_TYPE_NONE') return null

  if (!adjusted.hasAdjustment && adjusted.unavailableReason === 'NO_INDEX_DATA') {
    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp sx={{ fontSize: 20, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.disabled">
            {t('noIndexDataAvailable', { index: adjusted.adjustmentIndex })}
          </Typography>
        </Box>
      </Paper>
    )
  }

  const freqLabel = getFreqLabel(adjusted.adjustmentFrequencyMonths, t)
  const chipLabel = `${adjusted.adjustmentIndex} · ${freqLabel}`

  const effectiveDateFormatted = adjusted.indexReferenceDate
    ? formatShortDate(adjusted.indexReferenceDate)
    : '-'

  const todayFormatted = formatShortDate(new Date().toISOString().slice(0, 10))

  return (
    <Paper
      variant="outlined"
      sx={{ mb: 2, overflow: 'hidden', borderColor: 'divider' }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('adjustedToToday')}
          </Typography>
        </Box>
        <Chip
          label={chipLabel}
          size="small"
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 24
          }}
        />
      </Box>

      {/* 2x2 Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        {/* Cell 1: ALQUILER BASE */}
        <Box
          sx={{
            p: 1.5,
            borderRight: 1,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 0.5 }}>
            {t('baseRentUpper')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>
            {formatCurrency(baseRent)}
          </Typography>
        </Box>

        {/* Cell 2: INICIO DEL CONTRATO */}
        <Box
          sx={{
            p: 1.5,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 0.5 }}>
            {t('contractStartUpper')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>
            {formatShortDate(adjusted.leaseStartDate)}
          </Typography>
        </Box>

        {/* Cell 3: ÚLTIMA ACTUALIZACIÓN */}
        <Box sx={{ p: 1.5, borderRight: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 0.5 }}>
            {t('lastUpdateUpper')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>
            {effectiveDateFormatted}
          </Typography>
        </Box>

        {/* Cell 4: FECHA DE CÁLCULO */}
        <Box sx={{ p: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: 0.5 }}>
            {t('calculationDateUpper')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>
            {todayFormatted}
          </Typography>
        </Box>
      </Box>

      {/* Factor chip row */}
      {adjusted.hasAdjustment && (
        <Box
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'grey.50'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <TrendingUp sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {t('accumulatedFactor')}
            </Typography>
          </Box>
          <Chip
            label={`×${Number(adjusted.adjustmentFactor).toFixed(4)}`}
            size="small"
            sx={{
              bgcolor: 'rgba(33, 150, 243, 0.12)',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.8rem',
              height: 24,
              border: '1px solid rgba(33, 150, 243, 0.3)'
            }}
          />
        </Box>
      )}

      {/* Blue highlighted box — MONTO AJUSTADO */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: '0.7rem', letterSpacing: 0.5 }}
          >
            {t('adjustedAmountUpper')}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem' }}>
            {t('effectiveAsOf', { date: effectiveDateFormatted })}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          sx={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}
        >
          {formatCurrency(adjusted.adjustedRent)}
        </Typography>
      </Box>
    </Paper>
  )
}

export default AdjustedRentCard
