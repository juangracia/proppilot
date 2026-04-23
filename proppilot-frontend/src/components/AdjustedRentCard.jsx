import { Box, Paper, Typography } from '@mui/material'
import { TrendingUp } from '@mui/icons-material'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLanguage } from '../contexts/LanguageContext'

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

  const formattedMonth = adjusted.indexReferenceDate
    ? format(parseISO(adjusted.indexReferenceDate), 'MMMM yyyy', { locale: es })
    : null

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <TrendingUp sx={{ fontSize: 20, color: 'success.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">{t('adjustedRent')}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatCurrency(adjusted.adjustedRent)}
          </Typography>
        </Box>
      </Box>

      {adjusted.hasAdjustment && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 4 }}>
          {t('adjustedRentBase')}: {formatCurrency(baseRent)} × {adjusted.adjustmentIndex} {Number(adjusted.adjustmentFactor).toFixed(4)}
        </Typography>
      )}

      {formattedMonth && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, ml: 4 }}>
          {t('adjustedAsOf', { month: formattedMonth })}
        </Typography>
      )}
    </Paper>
  )
}

export default AdjustedRentCard
