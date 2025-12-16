import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'

const MobileBottomNav = ({ selectedView, onNavigate, menuItems }) => {
  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        paddingBottom: 'env(safe-area-inset-bottom)',
        borderTop: 1,
        borderColor: 'divider',
      }}
      elevation={3}
    >
      <BottomNavigation
        value={selectedView}
        onChange={(event, newValue) => onNavigate(newValue)}
        showLabels
        sx={{
          height: 56,
          bgcolor: 'background.paper',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px',
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
        }}
      >
        {menuItems.map((item) => (
          <BottomNavigationAction
            key={item.value}
            value={item.value}
            label={item.text}
            icon={item.icon}
            sx={{
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.6875rem',
                '&.Mui-selected': {
                  fontSize: '0.6875rem',
                },
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}

export default MobileBottomNav
