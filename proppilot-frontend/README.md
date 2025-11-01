# PropPilot Frontend

React application for the PropPilot property management system.

## Overview

This is the frontend application for PropPilot, providing a modern web interface for property management, tenant management, and payment processing.

## Tech Stack

- **React 18+**
- **Vite** - Build tool and dev server
- **JavaScript/JSX**
- **CSS3** - Styling
- **Axios** - HTTP client for API calls

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
   Navigate to http://localhost:5173

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

3. The application will be available at: http://localhost:5173

## Scripts

- **`npm run dev`** - Start development server
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable React components
├── pages/              # Page components
├── services/           # API service functions
├── utils/              # Utility functions
├── styles/             # CSS files
├── App.jsx             # Main App component
└── main.jsx            # Application entry point
```

## Features

- **Property Management** - View, add, edit, and delete properties
- **Tenant Management** - Manage tenant information and leases
- **Payment Processing** - Handle rent payments and financial records
- **Responsive Design** - Works on desktop and mobile devices
- **Modern UI** - Clean and intuitive user interface

## Backend Integration

This frontend connects to the PropPilot backend API:
- **Backend Repository:** https://gitlab.com/juan.gracia2/proppilot-backend
- **API Base URL:** http://localhost:8080
- **Required:** Backend must be running for full functionality

## Development

### Useful Commands

- **Start frontend:** `./start-frontend.sh`
- **Stop frontend:** `./stop-frontend.sh`
- **View logs:** `tail -f frontend.log`
- **Install dependencies:** `npm install`
- **Build for production:** `npm run build`

### Environment Configuration

The application is configured to connect to the backend at `http://localhost:8080`. If you need to change this, update the API base URL in your service files.

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

1. **Port 5173 already in use:**
   ```bash
   lsof -ti:5173 | xargs kill -9
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
