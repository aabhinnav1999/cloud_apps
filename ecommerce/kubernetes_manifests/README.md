# Kubernetes Manifests

Deploys the full e-commerce stack — 4 PostgreSQL databases, Redis, MongoDB, six
microservices, the API gateway, and the React frontend — into an `ecommerce` namespace,
fronted by an AWS ALB Ingress.

---

## Layout

```
kubernetes_manifests/
├── 00-namespace.yaml       namespace: ecommerce
├── 01-secrets.yaml         DB credentials + JWT secret
├── 02-configmap.yaml       in-cluster service URLs
├── 03-databases/           StatefulSets + Services (with PVCs)
│   ├── user-db.yaml        postgres:16  → userdb
│   ├── product-db.yaml     postgres:16  → productdb
│   ├── inventory-db.yaml   postgres:16  → inventorydb
│   ├── order-db.yaml       postgres:16  → orderdb
│   ├── cart-db-redis.yaml  redis:7
│   └── mongodb.yaml        mongo:7
├── 04-services/            Deployments + ClusterIP Services
│   ├── user-service.yaml         :8081
│   ├── product-service.yaml      :8082
│   ├── cart-service.yaml         :8083
│   ├── inventory-service.yaml    :8084
│   ├── order-service.yaml        :8085
│   ├── notification-service.yaml :8086
│   ├── api-gateway.yaml          :8080
│   └── frontend.yaml             :80
└── 05-ingress.yaml         ALB, path-based routing
```

Only the **frontend** and **api-gateway** are reachable from outside. The six services are
`ClusterIP` and resolve by DNS name, exactly as they did over the compose network.

---

## Prerequisites

1. **An EKS cluster** with the **AWS Load Balancer Controller** installed
   (the `alb` IngressClass comes from it).
2. **EBS CSI driver** + a default StorageClass — the StatefulSets request `ReadWriteOnce`
   PVCs (`gp2`/`gp3`). Check with `kubectl get sc`.
3. Public subnets tagged `kubernetes.io/role/elb=1` for an internet-facing ALB.
4. **Images pushed** to Docker Hub as `aabhinnavdocker/ecommerce-<service>:v1`
   for your cluster's architecture (amd64 for standard nodes, arm64 for Graviton).

Images referenced:

```
aabhinnavdocker/ecommerce-user-service:v1
aabhinnavdocker/ecommerce-product-service:v1
aabhinnavdocker/ecommerce-cart-service:v1
aabhinnavdocker/ecommerce-inventory-service:v1
aabhinnavdocker/ecommerce-order-service:v1
aabhinnavdocker/ecommerce-notification-service:v1
aabhinnavdocker/ecommerce-api-gateway:v1
aabhinnavdocker/ecommerce-frontend:v1
```

---

## Deploy

```bash
kubectl apply -R -f kubernetes_manifests/
```

The numeric prefixes make `-R` apply things in a sane order (namespace → secrets →
config → databases → services → ingress).

Watch it come up:

```bash
kubectl get pods -n ecommerce -w
```

Databases become ready first; the Java services take the longest (their `startupProbe`
allows up to 5 minutes). Then get the ALB address:

```bash
kubectl get ingress -n ecommerce
```

Open the `ADDRESS` in a browser. It can take 2–3 minutes after creation for the ALB to
finish provisioning and its target groups to pass health checks.

---

## First-run data

Same as with compose — the databases start empty. Products need a category, and orders
need an inventory record:

1. Register a user in the UI.
2. Promote them to admin:
   ```bash
   kubectl exec -it -n ecommerce user-db-0 -- psql -U postgres -d userdb -c "UPDATE users SET role='ADMIN' WHERE email='you@example.com';"
   ```
3. Log out and back in, then use the **Admin** page to create a category, a product, and
   set its stock.

---

## Configuration notes

**Secrets.** `01-secrets.yaml` contains the same demo credentials as compose, in plain
`stringData`. Fine for a course project; for anything real use AWS Secrets Manager with
the External Secrets Operator, and never commit the file.

**`JAVA_TOOL_OPTIONS: -XX:MaxRAMPercentage=75`** on the three JVM services keeps the heap
inside the container limit. Without it the JVM can size its heap past the cgroup limit and
get OOMKilled.

**Probes.** product/cart/notification expose `/health`, inventory exposes `/`, and the
frontend `/`. The three Java services have **no Actuator dependency**, so they use TCP
probes — these prove the port is listening, not that the app is truly healthy. Adding
`spring-boot-starter-actuator` to those poms would let you use real `/actuator/health`
probes and drop the `success-codes: "200-404"` workaround in the Ingress.

**Resource requests** total roughly **3.5 GiB** and **1.5 vCPU**. Two `t3.medium` nodes are
about the minimum; if pods sit in `Pending`, check `kubectl describe pod` for
`Insufficient memory`.

**`imagePullPolicy: Always`** means re-pushing `:v1` and restarting picks up the change.
Better practice is immutable tags (`:v2`, `:git-sha`) with `IfNotPresent`.

---

## Path-based vs host-based routing

The Ingress uses **path-based** routing on a single host, which keeps the browser
same-origin — no CORS, one DNS record, one certificate.

For **host-based** instead (`app.example.com` → frontend, `api.example.com` → gateway),
replace the single rule with two `host:`-scoped rules. Two consequences:

- The API becomes genuinely cross-origin, so the gateway's CORS config becomes
  load-bearing. Pin `allowedOriginPatterns` to your real frontend host rather than `"*"`.
- You need DNS records for both names and a certificate covering both (wildcard or SAN),
  plus an HTTPS listener and `alb.ingress.kubernetes.io/certificate-arn`.

Reach for it when you want the API independently addressable — separate WAF/rate-limit
policies, or a public API surface.

---

## Teardown

```bash
kubectl delete -R -f kubernetes_manifests/
```

PVCs created by `volumeClaimTemplates` are **not** removed with the StatefulSet — delete
them explicitly (this destroys all data, and the backing EBS volumes):

```bash
kubectl delete pvc --all -n ecommerce
```

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Pod `Pending` | `kubectl describe pod` — usually insufficient memory or no StorageClass |
| Pod `CrashLoopBackOff` | `kubectl logs <pod> -n ecommerce --previous` |
| `ImagePullBackOff` | image not pushed, or wrong architecture for your nodes |
| No ALB `ADDRESS` | Load Balancer Controller not installed, or subnets untagged |
| 503 from the ALB | target group unhealthy — `kubectl get endpoints -n ecommerce` |
| Checkout fails on stock | no inventory record for that product (see First-run data) |
