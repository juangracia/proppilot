import React, { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Typography, Box,
  TextField, Snackbar
} from '@mui/material'
import { useLanguage } from '../contexts/LanguageContext'

const DelinquencyDialog = ({ open, onClose, items }) => {
  const { t, formatCurrency } = useLanguage()
  const [reminderItem, setReminderItem] = useState(null)
  const [notice, setNotice] = useState('')

  // a partly paid month still counts as a month behind
  const monthsBehind = (item) => item.monthsOwed + (Number(item.partialAmount) > 0 ? 1 : 0)

  const monthsLabel = (item) => {
    const n = monthsBehind(item)
    return n === 1 ? t('delinquencyMonthsOne') : t('delinquencyMonthsMany', { count: n })
  }

  const buildMessage = (item) => t('delinquencyReminderTemplate', {
    name: item.tenantName,
    address: item.propertyAddress,
    months: monthsLabel(item),
    amount: formatCurrency(item.amountOwed)
  })

  const phoneDigits = (item) => (item.tenantPhone || '').replace(/\D/g, '')

  const handleCopy = async (message) => {
    try {
      await navigator.clipboard.writeText(message)
      setNotice(t('delinquencyCopied'))
    } catch (err) {
      console.error('Clipboard write failed:', err)
      setNotice(t('delinquencyCopyFailed'))
    }
  }

  const message = reminderItem ? buildMessage(reminderItem) : ''
  const digits = reminderItem ? phoneDigits(reminderItem) : ''

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{t('delinquencyTitle')} ({t('delinquencyBaseRentNote')})</DialogTitle>
        <DialogContent>
          <Box data-testid="delinquency-table" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
            {items.map(item => (
              <Box
                key={item.leaseId}
                data-testid="delinquency-row"
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}
              >
                <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{item.tenantName}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.propertyAddress}</Typography>
                  <Typography variant="body2">
                    {t('delinquencyLate', { months: monthsLabel(item), days: item.daysLate })}
                  </Typography>
                </Box>
                <Box sx={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Typography sx={{ fontWeight: 700 }}>{formatCurrency(item.amountOwed)}</Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={t('delinquencyOverdueDays', { days: item.daysLate })}
                    sx={{ color: '#d32f2f', bgcolor: '#fdecea', borderColor: '#d32f2f' }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => setReminderItem(item)}
                  sx={{ minHeight: 44, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
                >
                  {t('delinquencyRemind')}
                </Button>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button sx={{ minHeight: 44 }} onClick={onClose}>{t('delinquencyClose')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!reminderItem} onClose={() => setReminderItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('delinquencyReminderTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            value={message}
            slotProps={{ htmlInput: { readOnly: true, 'data-testid': 'delinquency-message' } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button sx={{ minHeight: 44 }} onClick={() => handleCopy(message)}>{t('delinquencyCopy')}</Button>
          <Button
            component="a"
            variant="contained"
            sx={{ minHeight: 44 }}
            disabled={!digits}
            href={digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('delinquencyOpenWhatsapp')}
          </Button>
          <Button sx={{ minHeight: 44 }} onClick={() => setReminderItem(null)}>{t('delinquencyClose')}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!notice} autoHideDuration={2500} onClose={() => setNotice('')} message={notice} />
    </>
  )
}

export default DelinquencyDialog
