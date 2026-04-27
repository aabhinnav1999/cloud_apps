# Inventory Service

### Create Inventory

```
curl -X POST http://localhost:8084/api/inventory/  -H "Content-Type: application/json"  -d '{
    "product_id": 1,
    "total_quantity": 100
  }'
```
### Get inventory

```
curl http://localhost:8084/api/inventory/1
```
