import { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box
} from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'
import { useLanguage } from '../contexts/LanguageContext'

const LanguageCurrencySelector = () => {
  const { 
    language, 
    setLanguage, 
    currency, 
    setCurrency, 
    availableLanguages, 
    availableCurrencies
  } = useLanguage()
  
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode)
    handleClose()
  }

  const handleCurrencyChange = (currencyCode) => {
    setCurrency(currencyCode)
    handleClose()
  }



  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <LanguageIcon />
      </IconButton>
      
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Language
          </Typography>
        </Box>
        
        {availableLanguages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={language === lang.code}
          >
            <ListItemText primary={lang.name} />
          </MenuItem>
        ))}
        
        <Divider />
        
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Currency
          </Typography>
        </Box>
        
        {availableCurrencies.map((curr) => (
          <MenuItem
            key={curr.code}
            onClick={() => handleCurrencyChange(curr.code)}
            selected={currency === curr.code}
          >
            <ListItemText 
              primary={curr.code}
              secondary={curr.name}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default LanguageCurrencySelector
