# User Service is created using Java ➕ Spring Boot

### Run PostgreSQL container
```
docker run -d \
  --name user-db \
  -e POSTGRES_DB=userdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16
```
Note: Replace username and password with your credentials

### Run Spring Boot app (optional; just for testing)
```
mvn spring-boot:run
```

### Docker Commands
```
docker build -t user-service .
```
```
docker run -d \
  --name user-service \
  -p 8081:8081 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_NAME=userdb \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e JWT_SECRET=mySuperSecretKeyForJwtTokenGeneration1234567890 \
  user-service
```
Note: Replace JWT_SECRET for security, Credentials are from PostgreSQL container

### Docker Compose commands
```
docker compose up -d
```

```
docker compose down
```

### API Usage

#### User Registration
```
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "test userone",
    "email": "testuser1@example.com",
    "password": "password123",
    "phoneNumber": "9876543210"
  }'
```
#### Login
```
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser1@example.com",
    "password": "password123"
  }'
```

#### Get current user
```
curl http://localhost:8081/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Current User
```
curl -X PUT http://localhost:8081/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fullName": "test user",
    "phoneNumber": "9999999999"
  }'
```

#### Add address
```
curl -X POST http://localhost:8081/api/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "line1": "12 Main Street",
    "line2": "Apartment 1B",
    "city": "Dublin",
    "state": "Leinster",
    "country": "Ireland",
    "postalCode": "D02XY12",
    "isDefault": true
  }'
```

#### Get Address
```
curl http://localhost:8081/api/addresses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```