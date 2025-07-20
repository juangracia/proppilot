# PropPilot - Rental Property Management System

A fullstack application for managing rental properties, tenants, and payments.

## Tech Stack

- Backend: Java with Spring Boot 3
- ORM: Spring Data JPA
- Database: PostgreSQL (Docker)
- Frontend: React (Vite)

## Prerequisites

- Java 17 or higher
- Maven 3.8 or higher
- Node.js 18 or higher
- Docker and Docker Compose

## Backend Setup

1. Build and run the backend:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

2. Access Swagger documentation:
```
http://localhost:8080/swagger-ui.html
```

## Frontend Setup

1. Install dependencies:
```bash
cd frontend
cd npm install
```

2. Run the development server:
```bash
npm run dev
```

## Database Setup

The application uses Docker Compose to manage PostgreSQL. Start the database with:
```bash
docker-compose up -d
```

## API Endpoints

- Property Units: `/api/property-units`
- Tenants: `/api/tenants`
- Payments: `/api/payments`
- Rent Calculation: `/api/rent/calculate`
- Outstanding Payments: `/api/property-units/outstanding-payments`
