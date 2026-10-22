import React, { useState, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { useLanguage } from '../contexts/LanguageContext'

// Whole amounts, no decimals (same symbol and locale as formatCurrency)
const useMoney = () => {
  const { t, language, currency } = useLanguage()
  return (amount) => {
    const formatted = new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
      maximumFractionDigits: 0
    }).format(amount)
    return `${t(`currencySymbol.${currency}`)} ${formatted}`
  }
}

export const DelinquencyCard = ({ state }) => {
  const { t } = useLanguage()
  const money = useMoney()
  const { loading, error, report } = state

  if (loading) {
    return (
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <Skeleton variant="rounded" height={96} />
      </Grid>
    )
  }

  const count = report?.delinquentCount ?? 0
  let subtitle
  if (error) subtitle = t('delinquencyLoadError')
  else if (count === 0) subtitle = t('delinquencyNone')
  else if (count === 1) subtitle = t('delinquentTenantsOne')
  else subtitle = t('delinquentTenantsMany', { count })

  return (
    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
      <Card
        data-testid="delinquency-card"
        sx={{
          height: '100%',
          bgcolor: 'rgba(237, 108, 2, 0.08)',
          border: '1px solid',
          borderColor: 'warning.light'
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {t('delinquencyTitle')}
            </Typography>
            <Chip label={t('delinquencyNew')} size="small" color="warning" sx={{ height: 18, fontSize: '0.625rem' }} />
          </Box>
          {!error && (
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main', whiteSpace: 'nowrap' }}>
              {money(report?.totalOwed ?? 0)}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {subtitle}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  )
}

const ReminderDialog = ({ item, onClose, onCopied, onFallback }) => {
  const { t } = useLanguage()
  const money = useMoney()
  const fieldRef = useRef(null)

  if (!item) return null

  const name = item.tenantNames
    .map((n) => n.split(' ')[0])
    .join(` ${t('reminderNameJoin')} `)
  const message = t(item.daysOverdue === 1 ? 'reminderMessageOne' : 'reminderMessage', {
    name,
    address: item.propertyAddress,
    amount: money(item.amountOwed),
    days: item.daysOverdue
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      onCopied()
    } catch (error) {
      console.error('Clipboard unavailable:', error)
      fieldRef.current?.select()
      onFallback()
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('reminderTitle')}</DialogTitle>
      <DialogContent>
        <TextField
          value={message}
          multiline
          fullWidth
          minRows={4}
          inputRef={fieldRef}
          slotProps={{ input: { readOnly: true } }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy} variant="contained">{t('copy')}</Button>
        <Button onClick={onClose}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export const DelinquencyTable = ({ state }) => {
  const { t } = useLanguage()
  const money = useMoney()
  const [selected, setSelected] = useState(null)
  const [copied, setCopied] = useState(false)
  const [fallback, setFallback] = useState(false)
  const items = state.report?.items ?? []

  if (state.loading || state.error || items.length === 0) return null

  return (
    <Paper sx={{ mb: 3 }}>
      <TableContainer>
        <Table size="small" data-testid="delinquency-table">
          <TableHead>
            <TableRow>
              <TableCell>{t('delinquencyColTenant')}</TableCell>
              <TableCell>{t('delinquencyColProperty')}</TableCell>
              <TableCell>{t('delinquencyColDelay')}</TableCell>
              <TableCell>{t('delinquencyColOwed')}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.leaseId}>
                <TableCell>{item.tenantNames.join(', ')}</TableCell>
                <TableCell>{item.propertyAddress}</TableCell>
                <TableCell>
                  <Chip
                    variant="outlined"
                    color="error"
                    size="small"
                    label={item.daysOverdue === 1
                      ? t('overdueDaysOne')
                      : t('overdueDaysMany', { days: item.daysOverdue })}
                  />
                </TableCell>
                <TableCell sx={{ color: 'error.main', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {money(item.amountOwed)}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setSelected(item)}
                    sx={{ textTransform: 'none', borderStyle: 'dashed' }}
                  >
                    {t('remind')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ReminderDialog
        item={selected}
        onClose={() => setSelected(null)}
        onCopied={() => setCopied(true)}
        onFallback={() => setFallback(true)}
      />
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        message={t('reminderCopied')}
      />
      <Snackbar
        open={fallback}
        autoHideDuration={4000}
        onClose={() => setFallback(false)}
        message={t('reminderCopyFallback')}
      />
    </Paper>
  )
}
