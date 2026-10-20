import React, { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Typography, Box,
  Table, TableHead, TableRow, TableCell, TableBody, TextField, Snackbar
} from '@mui/material'
import { useLanguage } from '../contexts/LanguageContext'

const DelinquencyDialog = ({ open, onClose, items }) => {
  const { t, formatCurrency } = useLanguage()
  const [reminderItem, setReminderItem] = useState(null)
  const [notice, setNotice] = useState('')

  // a partly paid month still counts as a month behind
  const monthsBehind = (item) => item.monthsOwed + (Number(item.partialAmount) > 0 ? 1 : 0)

  const buildMessage = (item) => t('delinquencyReminderTemplate', {
    name: item.tenantName,
    address: item.propertyAddress,
    months: monthsBehind(item),
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
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" data-testid="delinquency-table">
              <TableHead>
                <TableRow>
                  <TableCell>{t('delinquencyColTenant')}</TableCell>
                  <TableCell>{t('delinquencyColProperty')}</TableCell>
                  <TableCell>{t('delinquencyColLate')}</TableCell>
                  <TableCell align="right">{t('delinquencyColAmount')}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.leaseId} data-testid="delinquency-row">
                    <TableCell>{item.tenantName}</TableCell>
                    <TableCell>{item.propertyAddress}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {t('delinquencyLate', { months: monthsBehind(item), days: item.daysLate })}
                      </Typography>
                      <Chip size="small" color="error" label={t('delinquencyOverdueChip')} />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.amountOwed)}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => setReminderItem(item)}>
                        {t('delinquencyRemind')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('delinquencyClose')}</Button>
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
          <Button onClick={() => handleCopy(message)}>{t('delinquencyCopy')}</Button>
          <Button
            component="a"
            variant="contained"
            disabled={!digits}
            href={digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('delinquencyOpenWhatsapp')}
          </Button>
          <Button onClick={() => setReminderItem(null)}>{t('delinquencyClose')}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!notice} autoHideDuration={2500} onClose={() => setNotice('')} message={notice} />
    </>
  )
}

export default DelinquencyDialog
