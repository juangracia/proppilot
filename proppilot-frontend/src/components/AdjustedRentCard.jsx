import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Skeleton,
  Divider
} from '@mui/material'
import { TrendingUp, AttachMoney } from '@mui/icons-material'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { API_BASE_URL } from '../config/api'

const AdjustedRentCard = ({ leaseId }) => {
  const { t, formatCurrency } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!leaseId) return

    let cancelled = false
    const fetchAdjustedRent = async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await axios.get(`${API_BASE_URL}/leases/${leaseId}/adjusted-rent`)
        if (!cancelled) {
          setData(response.data)
        }
      } catch (err) {
        console.error('Error fetching adjusted rent:', err)
        if (!cancelled) {
          setError(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchAdjustedRent()
    return () => { cancelled = true }
  }, [leaseId])

  const noIndexData =
    !data ||
    error ||
    !data.adjustmentFactor ||
    data.adjustmentFactor === 1

  return (
    <>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 1, mt: 3, textTransform: 'uppercase', fontSize: '0.75rem' }}
      >
        {t('adjustedRentCalc') || 'Alquiler Ajustado'}
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="50%" height={20} />
          </Box>
        ) : noIndexData ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TrendingUp sx={{ fontSize: 20, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              Sin datos de indice disponibles
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <AttachMoney sx={{ fontSize: 20, color: 'primary.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('adjustedRent') || 'Monto Ajustado'}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>
                  {formatCurrency(data.adjustedRent)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('baseRent') || 'Alquiler Base'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatCurrency(data.baseRent)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('adjustmentIndex') || 'Indice de Ajuste'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {data.adjustmentIndex}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('adjustmentFactor') || 'Factor de Ajuste'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {data.adjustmentFactor != null ? `${Number(data.adjustmentFactor).toFixed(4)}x` : '-'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('leasePeriod') || 'Periodo'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {data.leaseStartDate} - {data.paymentDate}
                </Typography>
              </Box>

              <Divider sx={{ my: 0.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('indexInfo') || 'Indice al inicio'} ({data.indexDateAtLeaseStart})
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {data.indexAtLeaseStart != null ? Number(data.indexAtLeaseStart).toLocaleString() : '-'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('indexAtPayment') || 'Indice al pago'} ({data.indexDateAtPaymentDate})
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {data.indexAtPaymentDate != null ? Number(data.indexAtPaymentDate).toLocaleString() : '-'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </>
  )
}

export default AdjustedRentCard
