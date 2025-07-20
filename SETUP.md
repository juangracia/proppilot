# PropPilot Setup and Running Guide

This guide provides step-by-step instructions for setting up and running the PropPilot fullstack rental property management application locally.

## Prerequisites

### Required Software
- **Java 17 or higher** - For running the Spring Boot backend
- **Node.js 18 or higher** - For running the React frontend
- **Docker and Docker Compose** - For PostgreSQL database
- **Maven 3.6+** - For building the Java backend (or use the included Maven wrapper)

### Verify Installation
```bash
# Check Java version
java -version

# Check Node.js version
node --version
npm --version

# Check Docker
docker --version
docker-compose --version

# Check Maven (optional)
mvn --version
```

## Project Structure
```
windsurf-project/
├── backend/                 # Spring Boot application
│   ├── src/main/java/      # Java source code
│   ├── src/test/java/      # Test files
│   ├── pom.xml             # Maven dependencies
│   └── application.yml     # Configuration
├── frontend/               # React application
│   ├── src/                # React source code
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
├── docker-compose.yml      # PostgreSQL setup
├── API_TESTING.md         # API testing examples
└── README.md              # Project overview
```

## Setup Instructions

### 1. Clone and Navigate to Project
```bash
cd /Users/juangracia/proppilot/CascadeProjects/windsurf-project
```

### 2. Start PostgreSQL Database
```bash
# Start PostgreSQL using Docker Compose
docker-compose up -d

# Verify database is running
docker-compose ps
```

The database will be available at:
- **Host:** localhost
- **Port:** 5432
- **Database:** proppilot
- **Username:** proppilot
- **Password:** proppilot123

### 3. Setup Backend (Spring Boot)

#### Navigate to backend directory
```bash
cd backend
```

#### Install dependencies and run tests
```bash
# Using Maven wrapper (recommended)
./mvnw clean install

# Or using system Maven
mvn clean install
```

#### Run the backend server
```bash
# Using Maven wrapper
./mvnw spring-boot:run

# Or using system Maven
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

#### Verify backend is running
- API Documentation: http://localhost:8080/swagger-ui/index.html
- Health Check: http://localhost:8080/actuator/health
- API Base URL: http://localhost:8080/api

### 4. Setup Frontend (React)

#### Open a new terminal and navigate to frontend directory
```bash
cd frontend
```

#### Install dependencies
```bash
npm install
```

#### Start the development server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

#### Verify frontend is running
- Open browser to http://localhost:5173
- You should see the PropPilot application with navigation tabs

## Running the Complete Application

### 1. Start all services in order:

#### Terminal 1 - Database
```bash
cd /Users/juangracia/proppilot/CascadeProjects/windsurf-project
docker-compose up -d
```

#### Terminal 2 - Backend
```bash
cd /Users/juangracia/proppilot/CascadeProjects/windsurf-project/backend
./mvnw spring-boot:run
```

#### Terminal 3 - Frontend
```bash
cd /Users/juangracia/proppilot/CascadeProjects/windsurf-project/frontend
npm run dev
```

### 2. Access the application:
- **Frontend UI:** http://localhost:5173
- **Backend API:** http://localhost:8080/api
- **API Documentation:** http://localhost:8080/swagger-ui/index.html

## Testing the Application

### 1. Using the Web Interface
1. Open http://localhost:5173 in your browser
2. Navigate to "Property Units" tab to view and manage properties
3. Navigate to "Payment Registration" tab to register payments
4. Test form validation by submitting incomplete forms

### 2. Using API Endpoints
Refer to `API_TESTING.md` for detailed curl commands and Postman examples.

### 3. Running Backend Tests
```bash
cd backend
./mvnw test
```

## Configuration

### Backend Configuration (`backend/src/main/resources/application.yml`)
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/proppilot
    username: proppilot
    password: proppilot123
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

### Frontend Configuration (`frontend/vite.config.js`)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check if PostgreSQL container is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### 2. Backend Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process (replace PID)
kill -9 <PID>

# Or change port in application.yml
server:
  port: 8081
```

#### 3. Frontend Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. CORS Issues
The backend is configured to allow requests from `http://localhost:5173`. If you change the frontend port, update the CORS configuration in `backend/src/main/java/com/prop_pilot/config/CorsConfig.java`.

### Database Management

#### Reset Database
```bash
# Stop containers
docker-compose down

# Remove volumes (this will delete all data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

#### Connect to Database
```bash
# Using Docker
docker-compose exec postgres psql -U proppilot -d proppilot

# Using psql client
psql -h localhost -p 5432 -U proppilot -d proppilot
```

## Development Workflow

### 1. Making Backend Changes
- Modify Java files in `backend/src/main/java/`
- The Spring Boot dev tools will automatically restart the server
- Run tests: `./mvnw test`

### 2. Making Frontend Changes
- Modify React files in `frontend/src/`
- Vite will automatically reload the browser
- The frontend will proxy API calls to the backend

### 3. Database Schema Changes
- Modify JPA entities in `backend/src/main/java/com/prop_pilot/entity/`
- Hibernate will automatically update the database schema (ddl-auto: update)

## Production Considerations

For production deployment, consider:
- Use environment-specific configuration files
- Set up proper database migrations
- Configure production-grade database settings
- Set up proper logging and monitoring
- Use HTTPS for secure communication
- Implement proper authentication and authorization

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all services are running on correct ports
3. Ensure database connectivity
4. Review the API documentation at http://localhost:8080/swagger-ui/index.html
5. Check the `API_TESTING.md` file for example requests
