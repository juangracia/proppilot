import { useState, useEffect, useCallback } from 'react'
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride'
import { useTheme } from '@mui/material/styles'
import { useLanguage } from '../contexts/LanguageContext'

const TOUR_STORAGE_KEY = 'proppilot_tour_completed'

const ProductTour = ({ onNavigate, currentView }) => {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const theme = useTheme()
  const { t } = useLanguage()

  const steps = [
    {
      target: 'body',
      placement: 'center',
      disableBeacon: true,
      content: t('tourWelcome'),
      title: t('tourWelcomeTitle'),
    },
    {
      target: '[data-tour="dashboard-stats"]',
      placement: 'bottom',
      content: t('tourDashboardStats'),
      title: t('tourDashboardStatsTitle'),
      disableBeacon: true,
    },
    {
      target: '[data-tour="sidebar-nav"]',
      placement: 'right',
      content: t('tourSidebarNav'),
      title: t('tourSidebarNavTitle'),
      disableBeacon: true,
    },
    {
      target: '[data-tour="nav-properties"]',
      placement: 'right',
      content: t('tourNavProperties'),
      title: t('tourNavPropertiesTitle'),
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: '[data-tour="nav-tenants"]',
      placement: 'right',
      content: t('tourNavTenants'),
      title: t('tourNavTenantsTitle'),
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: '[data-tour="nav-payments"]',
      placement: 'right',
      content: t('tourNavPayments'),
      title: t('tourNavPaymentsTitle'),
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: '[data-tour="language-selector"]',
      placement: 'bottom',
      content: t('tourLanguageSelector'),
      title: t('tourLanguageSelectorTitle'),
      disableBeacon: true,
    },
    {
      target: '[data-tour="dark-mode-toggle"]',
      placement: 'bottom',
      content: t('tourDarkMode'),
      title: t('tourDarkModeTitle'),
      disableBeacon: true,
    },
    {
      target: '[data-tour="user-menu"]',
      placement: 'bottom-end',
      content: t('tourUserMenu'),
      title: t('tourUserMenuTitle'),
      disableBeacon: true,
    },
    {
      target: 'body',
      placement: 'center',
      content: t('tourComplete'),
      title: t('tourCompleteTitle'),
      disableBeacon: true,
    },
  ]

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!hasCompletedTour) {
      const timer = setTimeout(() => {
        setRun(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleJoyrideCallback = useCallback((data) => {
    const { status, type, index, action } = data

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false)
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT || action === ACTIONS.PREV) {
        setStepIndex(index + (action === ACTIONS.NEXT ? 1 : -1))
      }
    }

    if (type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + 1)
    }
  }, [])

  const startTour = useCallback(() => {
    if (currentView !== 0 && onNavigate) {
      onNavigate(0)
    }
    setStepIndex(0)
    setRun(true)
  }, [currentView, onNavigate])

  const tooltipStyles = {
    options: {
      arrowColor: theme.palette.background.paper,
      backgroundColor: theme.palette.background.paper,
      primaryColor: theme.palette.primary.main,
      textColor: theme.palette.text.primary,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipTitle: {
      fontSize: 18,
      fontWeight: 600,
      marginBottom: 8,
      color: theme.palette.text.primary,
    },
    tooltipContent: {
      fontSize: 14,
      lineHeight: 1.6,
      color: theme.palette.text.secondary,
    },
    buttonNext: {
      backgroundColor: theme.palette.primary.main,
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      padding: '10px 20px',
    },
    buttonBack: {
      color: theme.palette.text.secondary,
      fontSize: 14,
      fontWeight: 500,
      marginRight: 8,
    },
    buttonSkip: {
      color: theme.palette.text.secondary,
      fontSize: 14,
    },
    buttonClose: {
      color: theme.palette.text.secondary,
    },
    spotlight: {
      borderRadius: 8,
    },
    beacon: {
      inner: theme.palette.primary.main,
      outer: theme.palette.primary.light,
    },
  }

  const locale = {
    back: t('tourBack'),
    close: t('tourClose'),
    last: t('tourFinish'),
    next: t('tourNext'),
    skip: t('tourSkip'),
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={tooltipStyles}
      locale={locale}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  )
}

export const useTour = () => {
  const startTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY)
    window.location.reload()
  }

  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY)
  }

  const isTourCompleted = () => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true'
  }

  return { startTour, resetTour, isTourCompleted }
}

export default ProductTour
