#!/usr/bin/env bash
# ==============================================================================
# Script tự động cài đặt Infrastructure Stack (ArgoCD, Monitoring, Keycloak) lên Minikube
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SEALED_SECRET_DIR="$ROOT_DIR/k8s/sealed-secret"

echo "=== 1. Kiểm tra trạng thái cụm Minikube ==="
if ! minikube status > /dev/null 2>&1; then
  echo "Minikube chưa được khởi động. Đang tiến hành 'minikube start --driver=docker'..."
  minikube start --driver=docker
else
  echo "Minikube đã sẵn sàng."
fi

echo "Kích hoạt addon Ingress..."
minikube addons enable ingress

echo ""
echo "=== 2. Khởi tạo Namespaces trong Kubernetes ==="
for ns in argocd monitoring keycloak production cert-manager; do
  kubectl create namespace $ns --dry-run=client -o yaml | kubectl apply -f -
done

echo ""
echo "=== 3. Thêm và Cập nhật Helm Repositories ==="
helm repo add argo https://argoproj.github.io/argo-helm || true
helm repo add sealed-secrets https://bitnami.github.io/sealed-secrets || true
helm repo add jetstack https://charts.jetstack.io || true
echo "Đang cập nhật danh sách helm repositories..."
helm repo update

echo ""
echo "=== 4. Triển khai Sealed Secrets Operator ==="
helm upgrade --install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system \
  --set keyRenewPeriod=0
echo "Chờ Sealed Secrets ready..."
kubectl rollout status deployment/sealed-secrets -n kube-system --timeout=150s

echo ""
echo "=== 5. Apply SealedSecrets ==="
echo "Áp dụng các SealedSecret từ thư mục k8s/sealed-secret vào cluster..."
kubectl apply -f "$SEALED_SECRET_DIR/argocd-admin-sealed-secret.yaml"
kubectl apply -f "$SEALED_SECRET_DIR/grafana-sealed-secret.yaml"
kubectl apply -f "$SEALED_SECRET_DIR/keycloak-admin-sealed-secret.yaml"
kubectl apply -f "$SEALED_SECRET_DIR/postgres-sealed-secret.yaml"
kubectl apply -f "$SEALED_SECRET_DIR/ghcr-sealed-secret.yaml"
kubectl apply -f "$SEALED_SECRET_DIR/backend-prod-sealed-secret.yaml"
kubectl apply -f "$SEALED_SECRET_DIR/cloudflared-sealed-secret.yaml"

echo ""
echo "=== 6. Triển khai ArgoCD ==="
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd \
  -f "$SCRIPT_DIR/argocd/values.yaml"

echo "Chờ ArgoCD Server sẵn sàng..."
	kubectl rollout status deployment/argocd-server -n argocd --timeout=150s

echo ""
echo "=== 7. Áp dụng file bootstrap.yaml để kích hoạt GitOps ==="
kubectl apply -f "$SCRIPT_DIR/argocd/bootstrap.yaml"

echo ""
echo "=== 8. Triển khai Cloudflare Tunnel (cloudflared) ==="
kubectl apply -f "$SCRIPT_DIR/cloudflared/cloudflared.yaml"

echo ""
echo "=============================================================================="
echo " HOÀN TẤT SETUP BOOTSTRAP ARGO CỤM MINIKUBE!"
echo " ArgoCD GitOps đã bắt đầu đồng bộ hóa toàn bộ Stack Hạ tầng tự động."
echo " Bạn có thể truy cập ArgoCD UI để theo dõi trạng thái đồng bộ:"
echo "   kubectl port-forward service/argocd-server -n argocd 8080:443"
echo "=============================================================================="
