# ritual-ledger

A Helm chart for [Ritual Ledger](https://github.com/raquelaroots/grimoire-of-strength) — deploys
the app (single replica, embedded SQLite) plus a CronJob that runs its Playwright test suite and
regenerates its Allure report on a schedule.

This chart packages the same resources as the repo's raw `k8s/` manifests, templated. If you want
to read literal, unrendered YAML first, start there; come here once you want values-driven
configuration.

## Prerequisites

- Kubernetes 1.24+ (developed and tested against kind, Kubernetes 1.36)
- Helm 3+ (developed against Helm 4.2.3)
- No registry is used yet — build and load both images locally:

```bash
docker build --target runtime -t ritual-ledger:local .
docker build --target test-runner -t ritual-ledger-test-runner:local .
kind load docker-image ritual-ledger:local ritual-ledger-test-runner:local --name <your-cluster>
# or: minikube image load ritual-ledger:local ritual-ledger-test-runner:local
```

## Installing

```bash
helm install ritual-ledger . --create-namespace --namespace ritual-ledger
kubectl -n ritual-ledger port-forward svc/ritual-ledger 8080:80
curl http://localhost:8080/api/health
```

## Uninstalling

```bash
helm uninstall ritual-ledger --namespace ritual-ledger
# The two PVCs (SQLite DB + Allure history, generated report) are deliberately kept —
# they carry `helm.sh/resource-policy: keep`, since a Helm chart's PVCs are deleted on
# uninstall by default otherwise (a common misconception; confirmed against a real
# cluster while building this chart). Delete them explicitly if you actually want the
# data gone:
kubectl delete pvc -n ritual-ledger ritual-ledger-data ritual-ledger-allure-report
kubectl delete namespace ritual-ledger
```

## Values

| Key | Default | Description |
|---|---|---|
| `image.repository` / `image.tag` | `ritual-ledger` / `local` | App image, built locally |
| `replicaCount` | `1` | **Must stay 1** — embedded single-writer SQLite. The chart `fail`s the render above 1. |
| `service.type` / `service.port` | `ClusterIP` / `80` | Service in front of the app |
| `resources` | see `values.yaml` | App container requests/limits |
| `podSecurityContext.runAsUser/runAsGroup/fsGroup` | `1001` | Must match the app image's actual UID/GID (see `Dockerfile`) — `runAsNonRoot: true` needs a numeric UID to verify against, confirmed against a real cluster while building this chart |
| `testRunner.image.*` | `ritual-ledger-test-runner` / `local` | CronJob image, built locally |
| `testRunner.schedule` | `"0 6 * * *"` | Cron schedule for the test-runner Job |
| `testRunner.concurrencyPolicy` | `Forbid` | Prevents overlapping runs from fighting over shared PVC state |
| `persistence.data.size` / `.accessMode` | `1Gi` / `ReadWriteOnce` | SQLite DB + Allure history |
| `persistence.allureReport.size` / `.accessMode` | `512Mi` / `ReadWriteOnce` | Generated Allure report |
| `ingress.enabled` | `false` | Set `true` and configure `ingress.host`/`ingress.className` to expose externally |
| `serviceAccount.create` | `true` | Dedicated, token-unmounted ServiceAccounts for both workloads |

## Known tradeoffs (deliberate, not oversights)

- **`ReadWriteOnce`, not `ReadWriteMany`.** This chart assumes a single-node dev/demo cluster
  (kind, minikube, Docker Desktop Kubernetes, k3s) where the app Deployment and the CronJob's
  pods land on the same node. A genuine multi-node production deployment needs an RWX-capable
  StorageClass (NFS, EFS, Longhorn, etc.) instead.
- **`readOnlyRootFilesystem` is not set.** `POST /api/plan/regenerate` (exercised by
  `tests/api.spec.js`) writes `public/grimoire-of-strength.html` at runtime, inside the image's
  own filesystem. Setting this would break a real, tested code path.
- **No HPA.** `replicaCount` is fixed at 1 for the same embedded-SQLite reason above — horizontal
  scaling isn't a thing this app can safely do without changing the storage layer.
- **`files/custom-workout-plan.md` is a maintained copy**, not a live reference to the repo
  root's `custom-workout-plan.md`. Helm's `.Files.Get` can only read inside the chart's own
  directory tree. Re-copy it here whenever the root file changes.
- **No container registry yet.** `image.pullPolicy: IfNotPresent` assumes locally-built images
  loaded via `kind load docker-image` / `minikube image load`, not a real pull.
