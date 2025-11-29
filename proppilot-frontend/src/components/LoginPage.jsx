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
  CssBaseline,
  TextField,
  Button,
  Divider
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

const LoginPage = () => {
  const { loginWithGoogle, loginWithGoogleNative, loginWithLocalUser, isLocalDev, isNative } = useAuth()
  const { t, language } = useLanguage()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [localEmail, setLocalEmail] = useState('')
  const [localName, setLocalName] = useState('')

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

  // Handle native Google Sign-In for mobile apps
  const handleNativeGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await loginWithGoogleNative()
      // Handle both old boolean return and new object return
      if (result === false || (result && result.success === false)) {
        const errorMsg = result?.error || (language === 'es' ? 'Error al iniciar sesion. Por favor intente de nuevo.' : 'Login failed. Please try again.')
        setError(errorMsg)
      }
    } catch (err) {
      console.error('Native Google Sign-In error:', err)
      setError(language === 'es' ? 'Error con Google. Por favor intente de nuevo.' : 'Google sign-in error. Please try again.')
    }
    setIsLoading(false)
  }

  const handleLocalLogin = async (e) => {
    e.preventDefault()
    if (!localEmail.trim()) {
      setError('Email is required')
      return
    }
    setIsLoading(true)
    setError(null)
    const success = await loginWithLocalUser(localEmail, localName || localEmail.split('@')[0])
    if (!success) {
      setError('Local login failed. Make sure backend is running with local profile.')
    }
    setIsLoading(false)
  }

  const quickLoginUsers = [
    { email: 'alice@test.local', name: 'Alice Test' },
    { email: 'bob@test.local', name: 'Bob Test' },
    { email: 'charlie@test.local', name: 'Charlie Test' }
  ]

  // Render the appropriate login UI based on platform
  const renderLoginUI = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress />
        </Box>
      )
    }

    // Local development mode (web only, not native)
    if (isLocalDev) {
      return (
        <Box>
          <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
            Local Dev Mode - No Google OAuth required
          </Alert>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Quick Login (Test Users):
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 2 }}>
            {quickLoginUsers.map((user) => (
              <Button
                key={user.email}
                variant="outlined"
                size="small"
                onClick={() => loginWithLocalUser(user.email, user.name)}
              >
                {user.name}
              </Button>
            ))}
          </Box>

          <Divider sx={{ my: 2 }}>or</Divider>

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Custom User:
          </Typography>
          <Box component="form" onSubmit={handleLocalLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              size="small"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              placeholder="user@test.local"
              required
            />
            <TextField
              label="Name (optional)"
              size="small"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Test User"
            />
            <Button type="submit" variant="contained" fullWidth>
              Login as Local User
            </Button>
          </Box>
        </Box>
      )
    }

    // Native mobile app - use native Google Auth button
    if (isNative) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleNativeGoogleSignIn}
            sx={{
              py: 1.5,
              px: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              borderColor: '#dadce0',
              color: '#3c4043',
              backgroundColor: '#fff',
              '&:hover': {
                backgroundColor: '#f8f9fa',
                borderColor: '#dadce0',
              },
            }}
          >
            {language === 'es' ? 'Iniciar sesion con Google' : 'Sign in with Google'}
          </Button>
        </Box>
      )
    }

    // Web production - use standard Google OAuth component
    return (
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
    )
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
                PropPilot
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

          {renderLoginUI()}

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
