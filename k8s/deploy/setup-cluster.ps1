# PowerShell Script tu dong cai dat Infrastructure Stack (ArgoCD, Monitoring, Keycloak) len Minikube
$ErrorActionPreference = "Continue"

$scriptDir = $PSScriptRoot
$rootDir = (Resolve-Path "$scriptDir\..\..").Path
$sealedSecretDir = "$rootDir\k8s\sealed-secret"

Write-Host "=== 1. Kiem tra trang thai cum Minikube ===" -ForegroundColor Cyan
& minikube status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Minikube chua duoc khoi dong. Dang tien hanh 'minikube start --driver=docker'..." -ForegroundColor Yellow
    & minikube start --driver=docker
} else {
    Write-Host "Minikube da san sang." -ForegroundColor Green
}

Write-Host "`n=== 2. Khoi tao Namespaces ===" -ForegroundColor Cyan
foreach ($ns in @("argocd", "monitoring", "keycloak", "production")) {
    kubectl create namespace $ns --dry-run=client -o yaml | kubectl apply -f -
}

Write-Host "`n=== 3. Them va Cap nhat Helm Repositories ===" -ForegroundColor Cyan
helm repo add argo https://argoproj.github.io/argo-helm
helm repo add sealed-secrets https://bitnami.github.io/sealed-secrets
helm repo update

Write-Host "`n=== 4. Kiem tra trang thai Sealed Secrets Operator ===" -ForegroundColor Cyan
kubectl rollout status deployment/sealed-secrets -n kube-system --timeout=60s


Write-Host "`n=== 5. Apply SealedSecrets ===" -ForegroundColor Cyan
kubectl apply -f "$sealedSecretDir\argocd-admin-sealed-secret.yaml"
kubectl apply -f "$sealedSecretDir\grafana-sealed-secret.yaml"
kubectl apply -f "$sealedSecretDir\keycloak-admin-sealed-secret.yaml"
kubectl apply -f "$sealedSecretDir\postgres-sealed-secret.yaml"
kubectl apply -f "$sealedSecretDir\ghcr-sealed-secret.yaml"
kubectl apply -f "$sealedSecretDir\backend-prod-sealed-secret.yaml"

Write-Host "`n=== 6. Trien khai ArgoCD ===" -ForegroundColor Cyan
helm upgrade --install argocd argo/argo-cd --namespace argocd -f "$scriptDir\argocd\values.yaml"
Write-Host "Cho ArgoCD Server san sang..." -ForegroundColor Yellow
kubectl rollout status deployment/argocd-server -n argocd --timeout=150s

Write-Host "`n=== 7. Ap dung file bootstrap.yaml de kich hoat GitOps ===" -ForegroundColor Cyan
kubectl apply -f "$scriptDir\argocd\bootstrap.yaml"

Write-Host "`n==============================================================================" -ForegroundColor Green
Write-Host " HOAN TAT SETUP BOOTSTRAP ARGO CUM MINIKUBE!" -ForegroundColor Green
Write-Host " ArgoCD GitOps da bat dau dong bo hoa toan bo Stack Ha tang tu dong." -ForegroundColor Green
Write-Host " Ban co the truy cap ArgoCD UI de theo doi trang thai dong bo:" -ForegroundColor Yellow
Write-Host "   kubectl port-forward service/argocd-server -n argocd 8080:443" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Green
