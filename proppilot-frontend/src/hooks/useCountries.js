import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'

export const useCountries = () => {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_BASE_URL}/countries`)
      setCountries(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Error fetching countries:', err)
      setError(err.message || 'Failed to fetch countries')
      setCountries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])

  const getCountryByCode = useCallback((code) => {
    return countries.find(c => c.code === code) || null
  }, [countries])

  const getAvailableIndices = useCallback((countryCode) => {
    const country = getCountryByCode(countryCode)
    return country?.availableIndices || ['NONE']
  }, [getCountryByCode])

  const countriesWithIndices = countries.filter(c => c.hasIndices)

  return {
    countries,
    countriesWithIndices,
    loading,
    error,
    refetch: fetchCountries,
    getCountryByCode,
    getAvailableIndices
  }
}

export default useCountries
