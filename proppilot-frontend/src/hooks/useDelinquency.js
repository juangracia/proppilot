import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'

// Fetches the delinquency report once; refetches when refreshKey changes.
export const useDelinquency = (refreshKey = 0) => {
  const [state, setState] = useState({ loading: true, error: false, report: null })

  useEffect(() => {
    let cancelled = false
    axios.get(`${API_BASE_URL}/delinquency`)
      .then((res) => {
        if (!cancelled) setState({ loading: false, error: false, report: res.data })
      })
      .catch((error) => {
        console.error('Error fetching delinquency:', error)
        if (!cancelled) setState({ loading: false, error: true, report: null })
      })
    return () => { cancelled = true }
  }, [refreshKey])

  return state
}
