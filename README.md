# MiRent 🏠

A comprehensive property rental management system built with Spring Boot and React.

## Overview

MiRent is a full-stack application designed to help property managers efficiently manage rental properties, tenants, and payments. The system provides a modern web interface for tracking property units, managing tenant information, and processing rental payments.

## Features

- 🏘️ **Property Management** - Manage multiple property units with detailed information
- 👥 **Tenant Management** - Track tenant information, leases, and occupancy status
- 💰 **Payment Processing** - Record and track rental payments with detailed history
- 📊 **Dashboard** - Visual overview of properties, tenants, and revenue
- 🌐 **Multi-language Support** - Internationalization support (i18n)
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

### Backend
- **Java 17+** - Programming language
- **Spring Boot 3.x** - Application framework
- **PostgreSQL** - Relational database
- **Maven** - Build tool and dependency management
- **Docker** - Database containerization
- **Swagger/OpenAPI** - API documentation

### Frontend
- **React 18+** - UI library
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **date-fns** - Date manipulation

## Project Structure

```
mirent/
├── mirent-backend/        # Spring Boot backend API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/      # Java source code
│   │   │   └── resources/ # Configuration files
│   │   └── test/          # Unit and integration tests
│   ├── docker-compose.yml  # PostgreSQL database setup
│   └── pom.xml            # Maven dependencies
│
└── mirent-frontend/       # React frontend application
    ├── src/
    │   ├── components/    # React components
    │   ├── contexts/     # React contexts (i18n)
    │   └── main.jsx      # Application entry point
    ├── package.json       # npm dependencies
    └── vite.config.js    # Vite configuration
```

## Quick Start

### Prerequisites

- **Java 17+** (for backend)
- **Node.js 18+** and **npm** (for frontend)
- **Docker** and **Docker Compose** (for database)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mirent
   ```

2. **Start the database:**
   ```bash
   cd mirent-backend
   docker-compose up -d
   ```

3. **Start the backend:**
   ```bash
   cd mirent-backend
   ./start-backend.sh
   ```
   The backend API will be available at: http://localhost:8080

4. **Start the frontend:**
   ```bash
   cd mirent-frontend
   npm install
   ./start-frontend.sh
   ```
   The frontend will be available at: http://localhost:3000

5. **Populate with sample data (optional):**
   ```bash
   cd mirent-backend
   ./populate_database.sh
   ```

## API Documentation

Once the backend is running, you can access:
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **API Docs:** http://localhost:8080/api-docs

## Default Configuration

### Database
- **Host:** localhost
- **Port:** 5433
- **Database:** mirent
- **Username:** mirent
- **Password:** mirent123

### Backend
- **Port:** 8080
- **Base URL:** http://localhost:8080

### Frontend
- **Port:** 3000
- **URL:** http://localhost:3000
- **API Proxy:** `/api` → `http://localhost:8080/api`

## Development

### Backend Development

```bash
cd mirent-backend

# Run tests
mvn test

# Build JAR
mvn clean package

# Run application
mvn spring-boot:run

# View logs
tail -f backend.log
```

### Frontend Development

```bash
cd mirent-frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Scripts

### Backend Scripts
- `./start-backend.sh` - Start the backend server
- `./stop-backend.sh` - Stop the backend server
- `./populate_database.sh` - Populate database with sample data

### Frontend Scripts
- `./start-frontend.sh` - Start the frontend dev server
- `./stop-frontend.sh` - Stop the frontend dev server

## Troubleshooting

### Port Conflicts

**Backend port 8080 in use:**
```bash
lsof -ti:8080 | xargs kill -9
```

**Frontend port 3000 in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

### Database Issues

**Check if PostgreSQL is running:**
```bash
docker ps
```

**View database logs:**
```bash
cd mirent-backend
docker-compose logs postgres
```

**Restart database:**
```bash
cd mirent-backend
docker-compose restart
```

### Build Issues

**Backend:**
```bash
cd mirent-backend
mvn clean install
```

**Frontend:**
```bash
cd mirent-frontend
rm -rf node_modules package-lock.json
npm install
```

## API Endpoints

### Properties
- `GET /api/property-units` - List all properties
- `GET /api/property-units/{id}` - Get property by ID
- `POST /api/property-units` - Create new property
- `PUT /api/property-units/{id}` - Update property
- `DELETE /api/property-units/{id}` - Delete property

### Tenants
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/{id}` - Get tenant by ID
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/{id}` - Update tenant
- `DELETE /api/tenants/{id}` - Delete tenant

### Payments
- `GET /api/payments` - List all payments
- `GET /api/payments/{id}` - Get payment by ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/{id}` - Update payment
- `DELETE /api/payments/{id}` - Delete payment
- `GET /api/payments/property-unit/{id}/outstanding` - Get outstanding payments

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions, please open an issue in the repository or contact the development team.

---

**Note:** Make sure both the backend and database are running before starting the frontend application.

