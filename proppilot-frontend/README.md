# PropPilot Frontend

Modern React application for the PropPilot property management system.

## Overview

This is the frontend application for PropPilot, providing a modern, responsive web interface for property management, tenant management, and payment processing. Built with React and Material-UI for a clean, intuitive user experience.

## Tech Stack

- **React 18+** - UI library
- **Vite** - Build tool and dev server
- **Material-UI (MUI) v7** - Component library and design system
- **Axios** - HTTP client for API calls
- **date-fns** - Date manipulation utilities
- **React Context API** - State management (i18n)
- **JavaScript/JSX** - Programming language

## Prerequisites

- Node.js 18+ and npm
- Git
- PropPilot Backend running (see backend repository)

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://gitlab.com/juan.gracia2/proppilot-frontend.git
   cd proppilot-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   ./start-frontend.sh
   ```
   
   Or manually:
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to http://localhost:3000
   
   **Note:** The frontend runs on port 3000 and proxies API requests to the backend at `http://localhost:8080/api`

## Manual Setup

### Development Server

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The application will be available at: http://localhost:3000

## Scripts

- **`npm run dev`** - Start development server
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Run ESLint

## Project Structure

```
src/
├── components/          # React components
│   ├── DashboardView.jsx      # Dashboard with statistics cards
│   ├── PropertyUnitsList.jsx  # Property management component
│   ├── TenantsList.jsx        # Tenant management component
│   ├── PaymentForm.jsx        # Payment registration form
│   └── LanguageCurrencySelector.jsx  # i18n selector
├── contexts/           # React contexts
│   └── LanguageContext.jsx    # Internationalization context
├── App.jsx             # Main App component with routing
├── App.css             # Global styles
├── main.jsx            # Application entry point
└── index.css           # Base styles
```

## Features

- **Dashboard** - Overview with statistics cards (properties, tenants, revenue, outstanding payments)
- **Property Management** - View, add, edit, and delete property units with details
- **Tenant Management** - Manage tenant information, DNI/CUIT, contact details, and lease assignments
- **Payment Processing** - Register payments with date, amount, type, and descriptions
- **View Details** - Detailed property information dialogs
- **Edit Functionality** - Inline editing for property units
- **Search & Filter** - Search properties by address
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI** - Clean Material-UI design with intuitive navigation
- **Internationalization** - Multi-language support (Spanish/English)

## Backend Integration

This frontend connects to the PropPilot backend API:
- **API Base URL:** http://localhost:8080
- **API Proxy:** `/api` routes to `http://localhost:8080/api` (configured in `vite.config.js`)
- **CORS:** Backend configured to accept requests from `http://localhost:3000`
- **Required:** Backend must be running for full functionality

### Configuration

The API proxy is configured in `vite.config.js`:
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

## Development

### Useful Commands

- **Start frontend:** `./start-frontend.sh`
- **Stop frontend:** `./stop-frontend.sh`
- **View logs:** `tail -f frontend.log`
- **Install dependencies:** `npm install`
- **Build for production:** `npm run build`

### Environment Configuration

The application uses the Vite proxy configured in `vite.config.js` to route `/api` requests to `http://localhost:8080/api`. This means:
- Frontend code uses relative paths: `/api/property-units`
- Vite proxy automatically forwards to: `http://localhost:8080/api/property-units`

To change the backend URL, update the `target` in `vite.config.js`.

## Production Build

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Preview the build:**
   ```bash
   npm run preview
   ```

The built files will be in the `dist/` directory.

## Troubleshooting

1. **Port 3000 already in use:**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```
   
   Or change the port in `vite.config.js`:
   ```javascript
   server: {
     port: 3001, // Change to available port
   }
   ```

2. **Backend connection issues:**
   - Ensure the backend is running at http://localhost:8080
   - Check backend health: http://localhost:8080/actuator/health

3. **Dependencies issues:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **View application logs:**
   ```bash
   tail -f frontend.log
   ```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test the application
4. Run linting: `npm run lint`
5. Submit a merge request
