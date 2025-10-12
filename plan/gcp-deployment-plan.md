# Google Cloud Platform Deployment Plan for PeoplePerson

## Overview
This document outlines a comprehensive deployment strategy for PeoplePerson on Google Cloud Platform, modeled after KarlCam's serverless architecture. The plan leverages Cloud Run for containerized services, Cloud SQL for PostgreSQL, and Terraform for infrastructure as code.

## Architecture Components

### 1. Core Services
- **SvelteKit Application**: Single full-stack service running on Cloud Run
  - Combines frontend and API backend in one deployment
  - Server-side rendering with API routes
  - WebSocket support for SSE streaming

### 2. Infrastructure Stack
- **Cloud Run**: Serverless container platform for the main application
- **Cloud SQL**: Managed PostgreSQL instance for database
- **Cloud Storage**: Bucket for file uploads and static assets
- **Secret Manager**: Secure storage for API keys and credentials
- **Cloud Build**: CI/CD pipeline for automated deployments

## Detailed Implementation Plan

### Phase 1: Project Setup and Prerequisites

#### 1.1 Google Cloud Project Configuration
```bash
# Create new GCP project
gcloud projects create peopleperson-app --name="PeoplePerson"

# Set project as default
gcloud config set project peopleperson-app

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudsql.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com
```

#### 1.2 Service Account Setup
```bash
# Create service account for Cloud Run
gcloud iam service-accounts create peopleperson-sa \
  --display-name="PeoplePerson Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding peopleperson-app \
  --member="serviceAccount:peopleperson-sa@peopleperson-app.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding peopleperson-app \
  --member="serviceAccount:peopleperson-sa@peopleperson-app.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Phase 2: Dockerization

#### 2.1 Create Production Dockerfile
```dockerfile
# Dockerfile.prod
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the SvelteKit app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/build build/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules node_modules/

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

CMD ["node", "build"]
```

### Phase 3: Terraform Infrastructure

#### 3.1 Directory Structure
```
terraform/
├── main.tf                 # Main configuration
├── variables.tf            # Variable definitions
├── outputs.tf              # Output values
├── cloud-run.tf           # Cloud Run services
├── database.tf            # Cloud SQL configuration
├── storage.tf             # Cloud Storage buckets
├── secrets.tf             # Secret Manager
├── networking.tf          # Domain mapping
└── environments/
    ├── staging/
    │   └── terraform.tfvars
    └── production/
        └── terraform.tfvars
```

#### 3.2 Main Terraform Configuration

**main.tf**:
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "peopleperson-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
```

**cloud-run.tf**:
```hcl
resource "google_cloud_run_v2_service" "peopleperson_app" {
  name     = "peopleperson-${var.environment}"
  location = var.region
  
  template {
    service_account = google_service_account.app_sa.email
    
    annotations = {
      "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.main.connection_name
    }
    
    containers {
      image = "gcr.io/${var.project_id}/peopleperson:${var.image_tag}"
      
      env {
        name  = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name  = "ANTHROPIC_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.anthropic_api_key.secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      env {
        name  = "ORIGIN"
        value = "https://${var.domain}"
      }
      
      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
      }
      
      ports {
        container_port = 8080
      }
    }
    
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
  }
  
  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

# Allow unauthenticated access
resource "google_cloud_run_service_iam_binding" "app_public" {
  location = google_cloud_run_v2_service.peopleperson_app.location
  service  = google_cloud_run_v2_service.peopleperson_app.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}
```

**database.tf**:
```hcl
resource "google_sql_database_instance" "main" {
  name             = "peopleperson-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier = var.db_tier
    
    database_flags {
      name  = "max_connections"
      value = "100"
    }
    
    backup_configuration {
      enabled                        = true
      start_time                    = "03:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
    }
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
  }
  
  deletion_protection = var.environment == "production" ? true : false
}

resource "google_sql_database" "app" {
  name     = "peopleperson"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "app" {
  name     = "peopleperson_${var.environment}"
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}
```

### Phase 4: CI/CD Pipeline

#### 4.1 Cloud Build Configuration

**cloudbuild.yaml**:
```yaml
substitutions:
  _PROJECT_ID: peopleperson-app
  _REGION: us-central1
  _SERVICE_NAME: peopleperson

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'

steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-app'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/${_PROJECT_ID}/${_SERVICE_NAME}:${SHORT_SHA}'
      - '-t'
      - 'gcr.io/${_PROJECT_ID}/${_SERVICE_NAME}:${BRANCH_NAME}'
      - '-t'
      - 'gcr.io/${_PROJECT_ID}/${_SERVICE_NAME}:latest'
      - '-f'
      - 'Dockerfile.prod'
      - '.'

  # Push image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    id: 'push-app'
    args: ['push', '--all-tags', 'gcr.io/${_PROJECT_ID}/${_SERVICE_NAME}']
    waitFor: ['build-app']

  # Run database migrations
  - name: 'gcr.io/${_PROJECT_ID}/${_SERVICE_NAME}:${SHORT_SHA}'
    id: 'migrate-database'
    env:
      - 'DATABASE_URL=${_DATABASE_URL}'
    entrypoint: 'npm'
    args: ['run', 'db:sync']
    waitFor: ['push-app']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    id: 'deploy-app'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - '${_SERVICE_NAME}-${_ENVIRONMENT}'
      - '--image'
      - 'gcr.io/${_PROJECT_ID}/${_SERVICE_NAME}:${SHORT_SHA}'
      - '--region'
      - '${_REGION}'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
    waitFor: ['migrate-database']

  # Run smoke tests
  - name: 'python:3.11-slim'
    id: 'smoke-tests'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        pip install requests
        python -c "
        import requests
        import sys
        
        # Test health endpoint
        health_response = requests.get('https://${_SERVICE_NAME}-${_ENVIRONMENT}-${_PROJECT_ID}.run.app/health')
        if health_response.status_code != 200:
            print(f'Health check failed: {health_response.status_code}')
            sys.exit(1)
        
        # Test main page
        main_response = requests.get('https://${_SERVICE_NAME}-${_ENVIRONMENT}-${_PROJECT_ID}.run.app')
        if main_response.status_code != 200:
            print(f'Main page failed: {main_response.status_code}')
            sys.exit(1)
            
        print('All smoke tests passed!')
        "
    waitFor: ['deploy-app']

availableSecrets:
  secretManager:
    - versionName: projects/${_PROJECT_ID}/secrets/database-url/versions/latest
      env: 'DATABASE_URL'

images:
  - 'gcr.io/${_PROJECT_ID}/${_SERVICE_NAME}:${SHORT_SHA}'
  - 'gcr.io/${_PROJECT_ID}/${_SERVICE_NAME}:${BRANCH_NAME}'
  - 'gcr.io/${_PROJECT_ID}/${_SERVICE_NAME}:latest'

timeout: '1200s'
```

### Phase 5: Environment Configuration

#### 5.1 Staging Environment
**terraform/environments/staging/terraform.tfvars**:
```hcl
environment = "staging"
project_id  = "peopleperson-app"
region      = "us-central1"

# Scaling configuration
min_instances = 0
max_instances = 5

# Database configuration
db_tier = "db-f1-micro"

# Domain configuration
domain = "staging.peopleperson.app"
```

#### 5.2 Production Environment
**terraform/environments/production/terraform.tfvars**:
```hcl
environment = "production"
project_id  = "peopleperson-app"
region      = "us-central1"

# Scaling configuration
min_instances = 1
max_instances = 20

# Database configuration
db_tier = "db-custom-2-8192"

# Domain configuration
domain = "peopleperson.app"
```

### Phase 6: Security and Secrets Management

#### 6.1 Secret Manager Setup
```bash
# Create secrets
gcloud secrets create database-url --data-file=- <<< "postgresql://user:pass@/dbname?host=/cloudsql/CONNECTION_NAME"
gcloud secrets create anthropic-api-key --data-file=- <<< "YOUR_API_KEY"

# Grant access to service account
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:peopleperson-sa@peopleperson-app.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Phase 7: Monitoring and Observability

#### 7.1 Cloud Monitoring Setup
- Configure uptime checks for main endpoints
- Set up alerting policies for:
  - Service availability < 99%
  - Response time > 2 seconds
  - Database connection failures
  - Memory usage > 80%
  - CPU usage > 80%

#### 7.2 Logging Configuration
- Structured logging with appropriate severity levels
- Log aggregation for error tracking
- Custom metrics for business KPIs

### Phase 8: Deployment Process

#### 8.1 Initial Deployment Steps
1. Create GCP project and enable APIs
2. Set up Cloud Storage bucket for Terraform state
3. Configure secrets in Secret Manager
4. Initialize Terraform and create infrastructure
5. Build and push initial Docker image
6. Deploy application to Cloud Run
7. Configure domain mapping
8. Run database migrations
9. Verify deployment with smoke tests

#### 8.2 Continuous Deployment Workflow
1. Developer pushes to main branch
2. Cloud Build trigger activates
3. Build and test Docker image
4. Push to Container Registry
5. Run database migrations if needed
6. Deploy to staging environment
7. Run automated tests
8. Manual approval for production
9. Deploy to production
10. Monitor deployment metrics

## Cost Optimization Strategies

### 1. Cloud Run Optimization
- Set minimum instances to 0 for staging
- Use CPU throttling for background tasks
- Implement request concurrency optimization
- Configure appropriate memory limits

### 2. Database Optimization
- Use smaller instance for staging
- Enable automatic storage increase
- Implement connection pooling
- Schedule backups during low-traffic periods

### 3. Storage Optimization
- Implement lifecycle policies for old data
- Use Nearline storage for backups
- Compress images and static assets
- Enable CDN caching for static content

## Migration Timeline

### Week 1: Infrastructure Setup
- Day 1-2: GCP project setup and permissions
- Day 3-4: Terraform configuration development
- Day 5: Infrastructure provisioning for staging

### Week 2: Application Containerization
- Day 1-2: Dockerfile creation and optimization
- Day 3-4: Local testing with Docker
- Day 5: Cloud Build pipeline setup

### Week 3: Deployment and Testing
- Day 1-2: Deploy to staging environment
- Day 3-4: Integration testing and bug fixes
- Day 5: Performance testing and optimization

### Week 4: Production Rollout
- Day 1: Final staging validation
- Day 2: Production infrastructure setup
- Day 3: Production deployment
- Day 4-5: Monitoring and issue resolution

## Rollback Strategy

### Automated Rollback
- Cloud Run automatically maintains previous revisions
- Traffic can be instantly shifted to previous version
- Database migrations should be backward compatible

### Manual Rollback Process
1. Identify issue in production
2. Shift traffic to previous Cloud Run revision
3. Revert database changes if necessary
4. Investigate and fix issues
5. Re-deploy fixed version

## Security Considerations

### 1. Network Security
- Use private IP for Cloud SQL
- Implement Cloud Armor for DDoS protection
- Configure firewall rules appropriately

### 2. Application Security
- Store all secrets in Secret Manager
- Use service accounts with minimal permissions
- Enable audit logging for all services
- Implement rate limiting on API endpoints

### 3. Data Security
- Enable encryption at rest for all services
- Use SSL/TLS for all connections
- Implement backup encryption
- Regular security scanning of containers

## Success Metrics

### Technical Metrics
- Deployment success rate > 95%
- Service availability > 99.9%
- Average response time < 500ms
- Auto-scaling response time < 30 seconds

### Business Metrics
- Reduction in infrastructure costs by 40%
- Improved deployment frequency by 3x
- Reduced mean time to recovery (MTTR) by 50%
- Zero-downtime deployments achieved

## Conclusion

This deployment plan provides a comprehensive roadmap for migrating PeoplePerson to Google Cloud Platform using modern serverless architecture. The approach emphasizes scalability, security, and cost-efficiency while maintaining high availability and performance standards.

Key advantages of this architecture:
- **Serverless scalability**: Automatic scaling based on demand
- **Managed services**: Reduced operational overhead
- **Infrastructure as Code**: Reproducible and version-controlled infrastructure
- **CI/CD automation**: Faster and more reliable deployments
- **Cost optimization**: Pay only for resources used

The plan can be adjusted based on specific requirements and constraints as the migration progresses.