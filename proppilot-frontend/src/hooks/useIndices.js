import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'

export const useIndices = (countryCode = 'AR') => {
  const [indices, setIndices] = useState([])
  const [annualChanges, setAnnualChanges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchIndices = useCallback(async () => {
    if (!countryCode) {
      setIndices([])
      setAnnualChanges([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch both latest values and annual changes in parallel
      const [latestResponse, annualResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/indices/${countryCode}/all/latest`),
        axios.get(`${API_BASE_URL}/indices/${countryCode}/all/annual-changes`).catch(() => ({ data: [] }))
      ])

      setIndices(Array.isArray(latestResponse.data) ? latestResponse.data : [])
      setAnnualChanges(Array.isArray(annualResponse.data) ? annualResponse.data : [])
    } catch (err) {
      console.error('Error fetching indices:', err)
      setError(err.message || 'Failed to fetch indices')
      setIndices([])
      setAnnualChanges([])
    } finally {
      setLoading(false)
    }
  }, [countryCode])

  useEffect(() => {
    fetchIndices()
  }, [fetchIndices])

  const getIndexValue = useCallback((indexType) => {
    return indices.find(i => i.indexType === indexType) || null
  }, [indices])

  const getAnnualChange = useCallback((indexType) => {
    const change = annualChanges.find(c => c.indexType === indexType)
    return change?.annualChangePercent || 0
  }, [annualChanges])

  const refreshIndices = useCallback(async () => {
    try {
      await axios.post(`${API_BASE_URL}/indices/refresh/${countryCode}`)
      await fetchIndices()
    } catch (err) {
      console.error('Error refreshing indices:', err)
      throw err
    }
  }, [countryCode, fetchIndices])

  return {
    indices,
    annualChanges,
    loading,
    error,
    refetch: fetchIndices,
    refresh: refreshIndices,
    getIndexValue,
    getAnnualChange
  }
}

export const useIndexHistory = (countryCode, indexType, fromDate, toDate) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchHistory = useCallback(async () => {
    if (!countryCode || !indexType || !fromDate || !toDate) {
      setHistory([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(
        `${API_BASE_URL}/indices/${countryCode}/${indexType}/history`,
        { params: { from: fromDate, to: toDate } }
      )
      setHistory(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Error fetching index history:', err)
      setError(err.message || 'Failed to fetch index history')
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [countryCode, indexType, fromDate, toDate])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return { history, loading, error, refetch: fetchHistory }
}

export const useAdjustmentCalculation = () => {
  const [calculation, setCalculation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const calculateAdjustment = useCallback(async (countryCode, indexType, fromDate, toDate) => {
    if (!countryCode || !indexType || !fromDate || !toDate) {
      return null
    }

    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(
        `${API_BASE_URL}/indices/calculate-adjustment`,
        { params: { country: countryCode, type: indexType, from: fromDate, to: toDate } }
      )
      setCalculation(response.data)
      return response.data
    } catch (err) {
      console.error('Error calculating adjustment:', err)
      setError(err.message || 'Failed to calculate adjustment')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { calculation, loading, error, calculateAdjustment }
}

export default useIndices
