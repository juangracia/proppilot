import React, { useState, useMemo } from 'react'
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import PropertyUnitsList from './components/PropertyUnitsList'
import PaymentForm from './components/PaymentForm'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import LanguageCurrencySelector from './components/LanguageCurrencySelector'
import './App.css'

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function AppContent() {
  const [tabValue, setTabValue] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const { t } = useLanguage()

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const themeMode = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [darkMode]
  )

  return (
    <ThemeProvider theme={themeMode}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AppBar position="static" elevation={0} sx={{ mb: 3 }}>
          <Toolbar>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              {t('appTitle')}
            </Typography>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              {t('appSubtitle')}
            </Typography>
            <LanguageCurrencySelector />
            <IconButton onClick={toggleDarkMode} color="inherit">
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="PropPilot tabs">
              <Tab label={t('propertyUnits')} />
              <Tab label={t('registerPayment')} />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}>
            <PropertyUnitsList />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <PaymentForm />
          </TabPanel>
        </Container>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App
