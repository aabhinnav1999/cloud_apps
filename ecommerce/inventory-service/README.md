# Inventory Service

### Create Inventory

```
curl -X POST http://localhost:8084/api/inventory/  -H "Content-Type: application/json"  -d '{
    "product_id": 1,
    "total_quantity": 100
  }'
```
### Get Inventory

```
curl http://localhost:8084/api/inventory/1
```

### Update Inventory
```
curl -X PUT http://localhost:8084/api/inventory/1 \
  -H "Content-Type: application/json" \
  -d '{
    "total_quantity": 150
  }'
```
