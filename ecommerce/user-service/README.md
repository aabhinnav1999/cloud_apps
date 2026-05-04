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
