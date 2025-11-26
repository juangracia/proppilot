import React, { useState, useMemo, useCallback, memo } from 'react'
import {
  Typography,
  Box,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Container
} from '@mui/material'
import {
  Brightness4,
  Brightness7,
  Dashboard,
  Home,
  Payment,
  People,
  Menu
} from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import DashboardView from './components/DashboardView'
import PropertyUnitsList from './components/PropertyUnitsList'
import PaymentForm from './components/PaymentForm'
import TenantsList from './components/TenantsList'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import LanguageCurrencySelector from './components/LanguageCurrencySelector'
import './App.css'
import Logo from './assets/logo.svg'

const drawerWidth = 240

function AppContent() {
  const [selectedView, setSelectedView] = useState(0)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [propertyFilter, setPropertyFilter] = useState(null)
  const { t } = useLanguage()

  const menuItems = useMemo(() => [
    { text: t('dashboardMenu'), icon: <Dashboard />, value: 0 },
    { text: t('propertiesMenu'), icon: <Home />, value: 1 },
    { text: t('tenantsMenu'), icon: <People />, value: 2 },
    { text: t('paymentsMenu'), icon: <Payment />, value: 3 }
  ], [t])

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(prev => !prev)
  }, [])

  const handleMenuClick = useCallback((value) => {
    setSelectedView(value)
    setMobileOpen(false)
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#2196F3',
          },
          secondary: {
            main: '#FF9800',
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f5',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            lineHeight: 1.2,
            '@media (max-width:600px)': {
              fontSize: '2rem',
            },
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.2,
            '@media (max-width:600px)': {
              fontSize: '1.75rem',
            },
          },
          h4: {
            fontWeight: 600,
            fontSize: '1.75rem',
            lineHeight: 1.3,
            '@media (max-width:600px)': {
              fontSize: '1.5rem',
            },
          },
          h5: {
            fontWeight: 600,
            fontSize: '1.5rem',
            lineHeight: 1.3,
            '@media (max-width:600px)': {
              fontSize: '1.25rem',
            },
          },
          h6: {
            fontWeight: 500,
            fontSize: '1.25rem',
            lineHeight: 1.3,
            '@media (max-width:600px)': {
              fontSize: '1.125rem',
            },
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
            '@media (max-width:600px)': {
              fontSize: '0.9375rem',
            },
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
            '@media (max-width:600px)': {
              fontSize: '0.8125rem',
            },
          },
        },
        breakpoints: {
          values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
          },
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
                boxShadow: 'none',
                borderBottom: '1px solid',
                borderColor: theme.palette.divider,
                '@media (max-width:600px)': {
                  '& .MuiTypography-h6': {
                    fontSize: '0.875rem',
                  },
                },
              }),
            },
          },
          MuiContainer: {
            styleOverrides: {
              root: {
                '@media (max-width:600px)': {
                  paddingLeft: '16px',
                  paddingRight: '16px',
                },
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
              }),
            },
          },
          MuiListItemIcon: {
            styleOverrides: {
              root: {
                color: 'inherit',
                minWidth: 40,
              },
            },
          },
        },
      }),
    [darkMode]
  )

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 1, color: 'text.primary' }}>
          <Box
            component="svg"
            viewBox="0 0 300 80"
            sx={(theme) => ({
              height: 'auto',
              width: '160px',
              maxWidth: '90%',
              fill: 'none',
              color: 'text.primary',
              '& rect:first-of-type': {
                fill: theme.palette.mode === 'dark' ? 'currentColor' : 'white',
                stroke: theme.palette.mode === 'dark' ? 'currentColor' : '#45B8C1',
              },
              '& rect:last-of-type': {
                fill: theme.palette.mode === 'dark' ? 'currentColor' : 'white',
              },
              '& path': {
                fill: theme.palette.mode === 'dark' ? 'currentColor' : 'white',
              },
              '& text': {
                fill: 'currentColor',
              },
            })}
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
              strokeWidth="3.5"
            />
            <circle cx="40" cy="40" r="20" fill="url(#circleGrad)"/>
            <path d="M40 28 L50 36 L30 36 Z"/>
            <rect x="32" y="36" width="16" height="14"/>
            <path 
              d="M35 32 L35 50 L38 50 L38 42 L42 42 C44.2 42 46 40.2 46 38 C46 35.8 44.2 34 42 34 L35 32 Z M38 35 L42 35 C42.8 35 43.5 35.7 43.5 38 C43.5 40.3 42.8 41 42 41 L38 41 L38 35 Z" 
              fillRule="evenodd"
            />
            <text 
              x="85" 
              y="50" 
              style={{
                fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Roboto', sans-serif",
                fontSize: '34px',
                fontWeight: 700,
                fill: 'currentColor',
                letterSpacing: '-1px'
              }}
            >
              PropPilot
            </text>
          </Box>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'divider' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem
            component="button"
            key={item.text}
            onClick={() => handleMenuClick(item.value)}
            selected={selectedView === item.value}
            sx={{
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              bgcolor: 'transparent',
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '& .MuiListItemText-primary': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
              '&:not(.Mui-selected)': {
                color: 'text.primary',
                '& .MuiListItemIcon-root': {
                  color: 'text.secondary',
                },
                '& .MuiListItemText-primary': {
                  color: 'text.primary',
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'text.primary',
                  '& .MuiListItemIcon-root': {
                    color: 'text.primary',
                  },
                  '& .MuiListItemText-primary': {
                    color: 'text.primary',
                  },
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: selectedView === item.value ? 'white' : 'text.secondary',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                '& .MuiListItemText-primary': {
                  color: 'inherit',
                  fontWeight: selectedView === item.value ? 600 : 400
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )

  const handleNavigate = useCallback((viewIndex, filter = null) => {
    setPropertyFilter(filter)
    setSelectedView(viewIndex)
  }, [])

  const currentViewTitle = useMemo(() => {
    switch (selectedView) {
      case 0:
        return t('dashboardTitle')
      case 1:
        return t('propertyUnitsTitle')
      case 2:
        return t('tenantsTitle')
      case 3:
        return t('registerPaymentTitle')
      default:
        return t('dashboardTitle')
    }
  }, [selectedView, t])

  const currentViewSubtitle = useMemo(() => {
    switch (selectedView) {
      case 0:
        return t('dashboardSubtitle')
      case 1:
        return ''
      case 2:
        return ''
      case 3:
        return ''
      default:
        return t('dashboardSubtitle')
    }
  }, [selectedView, t])

  const content = useMemo(() => {
    switch (selectedView) {
      case 0:
        return <DashboardView onNavigate={handleNavigate} />
      case 1:
        return <PropertyUnitsList />
      case 2:
        return <TenantsList />
      case 3:
        return <PaymentForm />
      default:
        return <DashboardView onNavigate={handleNavigate} />
    }
  }, [selectedView, handleNavigate])

  // Update body theme attribute for CSS-based styling and persist preference
  React.useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ display: 'flex' }}>
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
              zIndex: (theme) => theme.zIndex.drawer + 1,
              backgroundColor: 'background.default',
              color: 'text.primary',
            }}
          >
            <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' }, px: { xs: 1, sm: 2 } }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ 
                  mr: 2, 
                  display: { sm: 'none' },
                  color: 'text.primary'
                }}
              >
                <Menu />
              </IconButton>
              <Box
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant="h4"
                  noWrap
                  component="div"
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    fontFamily: 'inherit',
                    color: 'text.primary',
                    lineHeight: 1.2
                  }}
                >
                  {currentViewTitle}
                </Typography>
                {currentViewSubtitle && (
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 400,
                      fontFamily: 'inherit',
                      color: 'text.secondary',
                      mt: 0.25,
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    {currentViewSubtitle}
                  </Typography>
                )}
              </Box>
              <LanguageCurrencySelector />
              <IconButton
                color="inherit"
                onClick={() => setDarkMode(!darkMode)}
                sx={{ 
                  ml: 1,
                  color: 'text.primary'
                }}
              >
                {darkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Toolbar>
          </AppBar>

          <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          >
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': { 
                  boxSizing: 'border-box', 
                  width: drawerWidth,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                },
              }}
            >
              {drawer}
            </Drawer>
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', sm: 'block' },
                '& .MuiDrawer-paper': { 
                  boxSizing: 'border-box', 
                  width: drawerWidth,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  borderRight: '1px solid',
                  borderColor: 'divider',
                },
              }}
              open
            >
              {drawer}
            </Drawer>
          </Box>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3 },
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              mt: { xs: '56px', sm: '64px' },
              backgroundColor: 'background.default',
              minHeight: '100vh',
              pb: { xs: 3, sm: 4 },
            }}
          >
            <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
              {content}
            </Container>
          </Box>
        </Box>
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
