import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

const LoginPage = () => {
  const { loginWithGoogle } = useAuth()
  const { t, language } = useLanguage()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#2196F3',
      },
      background: {
        default: '#f5f5f5',
      },
    },
  })

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true)
    setError(null)
    const success = await loginWithGoogle(credentialResponse.credential)
    if (!success) {
      setError(language === 'es' ? 'Error al iniciar sesion. Por favor intente de nuevo.' : 'Login failed. Please try again.')
    }
    setIsLoading(false)
  }

  const handleGoogleError = () => {
    setError(language === 'es' ? 'Error con Google. Por favor intente de nuevo.' : 'Google sign-in error. Please try again.')
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 2
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            maxWidth: 400,
            width: '100%',
            textAlign: 'center',
            borderRadius: 3
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Box
              component="svg"
              viewBox="0 0 300 80"
              sx={{
                height: 'auto',
                width: '180px',
                maxWidth: '90%',
                fill: 'none',
                mx: 'auto',
                display: 'block',
                mb: 2
              }}
            >
              <defs>
                <linearGradient id="circleGrad" x1="20%" y1="20%" x2="80%" y2="80%">
                  <stop offset="0%" style={{ stopColor: '#45B8C1', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#1B7A8C', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <rect
                x="10"
                y="10"
                width="60"
                height="60"
                rx="14"
                fill="white"
                stroke="#45B8C1"
                strokeWidth="3.5"
              />
              <circle cx="40" cy="40" r="20" fill="url(#circleGrad)"/>
              <path d="M40 28 L50 36 L30 36 Z" fill="white"/>
              <rect x="32" y="36" width="16" height="14" fill="white"/>
              <text
                x="85"
                y="50"
                style={{
                  fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Roboto', sans-serif",
                  fontSize: '34px',
                  fontWeight: 700,
                  fill: '#333',
                  letterSpacing: '-1px'
                }}
              >
                MiRent
              </text>
            </Box>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              {language === 'es' ? 'Bienvenido' : 'Welcome'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {language === 'es'
                ? 'Inicia sesion para gestionar tus propiedades'
                : 'Sign in to manage your properties'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                locale={language}
              />
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
            {language === 'es'
              ? 'Al iniciar sesion, aceptas nuestros terminos de servicio'
              : 'By signing in, you agree to our terms of service'}
          </Typography>
        </Paper>
      </Box>
    </ThemeProvider>
  )
}

export default LoginPage
