#!/bin/bash
set -e

# Check if .env file exists and is properly formatted
if [ ! -f .env ]; then
  echo "❌ .env file not found. Creating default .env file..."
  cat > .env << EOL
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql

# JWT Configuration - REPLACE THESE WITH STRONG SECRETS
# Generate using: openssl rand -base64 64
JWT_ACCESS_SECRET=REPLACE-WITH-STRONG-SECRET-MINIMUM-32-CHARS
JWT_REFRESH_SECRET=REPLACE-WITH-DIFFERENT-STRONG-SECRET-MINIMUM-32-CHARS
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Server Configuration
SERVER_SSH_KEY=your-ssh-key-here
SERVER_HOST_DEV=localhost
SERVER_HOST_PROD=localhost
SERVER_USER_DEV=dev-user
SERVER_USER_PROD=prod-user
GITHUB_TOKEN=your-github-token
EOL
fi

# Validate .env file format
if grep ".*[[:space:]].*=\|.*=.*[[:space:]].*=" .env > /dev/null 2>&1; then
  echo "❌ Error: .env file contains invalid format. Fixing..."
  # Create a temporary file with corrected format
  awk -F'[[:space:]]*=[[:space:]]*|[[:space:]]+' '{print $1"="$2}' .env > .env.tmp
  mv .env.tmp .env
fi

echo "🔧 Building Docker images..."
docker compose -f docker-compose.dev.yml build

echo "🔄 Tagging images for local use..."
docker tag scalable-microservices-dashboard-with-ai-frontend:latest frontend:local
docker tag scalable-microservices-dashboard-with-ai-api-gateway:latest api-gateway:local
docker tag scalable-microservices-dashboard-with-ai-ai-service:latest ai-service:local
docker tag scalable-microservices-dashboard-with-ai-worker-service:latest worker-service:local

echo "🚀 Creating kind cluster..."
kind create cluster --name dashboard-cluster --config=- <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30000
    hostPort: 3000
    protocol: TCP
EOF

echo "📦 Loading images into kind cluster..."
kind load docker-image frontend:local --name dashboard-cluster
kind load docker-image api-gateway:local --name dashboard-cluster
kind load docker-image ai-service:local --name dashboard-cluster
kind load docker-image worker-service:local --name dashboard-cluster

echo "🔧 Creating temporary manifests with local image tags..."
mkdir -p k8s/local
for file in k8s/*.yaml; do
  filename=$(basename "$file")
  servicename="${filename%.yaml}"
  if [ "$servicename" != "config" ]; then
    # Replace image line with a safely quoted value to avoid YAML parse errors from the colon
    sed -E "s|^(\s*image:)\s*.*$|\1 \"${servicename}:local\"|" "$file" > "k8s/local/$filename"
  else
    cp "$file" "k8s/local/$filename"
  fi
done

echo "🌐 Creating namespace..."
kubectl create namespace dashboard-app

echo "📄 Applying Kubernetes manifests..."
kubectl apply -f k8s/local/ -n dashboard-app

echo "⏳ Waiting for deployments to be ready..."
for deployment in frontend api-gateway ai-service worker-service; do
  echo "Waiting for $deployment..."
  kubectl wait --for=condition=available --timeout=300s deployment/$deployment -n dashboard-app || {
    echo "❌ $deployment deployment failed. Checking logs..."
    kubectl describe pod -l app=$deployment -n dashboard-app
    kubectl logs -l app=$deployment -n dashboard-app
    exit 1
  }
done

# Clean up temporary manifests
rm -rf k8s/local

echo "✅ All deployments are ready!"
echo "📊 Deployment Status:"
kubectl get all -n dashboard-app

echo "🌍 Services are accessible at:"
echo "Frontend: http://localhost:3000"
echo "API Gateway: http://localhost:4000/graphql (via port-forward)"

# Set up port forwarding for API Gateway
echo "🔄 Setting up port forwarding for API Gateway..."
kubectl port-forward service/api-gateway 4000:4000 -n dashboard-app &

echo "✨ Setup complete! Your local Kubernetes cluster is ready."
echo "To delete the cluster when you're done:"
echo "kind delete cluster --name dashboard-cluster"