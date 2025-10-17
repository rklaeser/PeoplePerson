# Infrastructure Deployment Sequence

This document outlines the learned sequence for deploying a full-stack application to Google Cloud Platform.

## 1. Local Development & Docker Setup

1. **Create your APIs and web apps**
   - Build FastAPI backend with proper health endpoints (`/health`)
   - Build React frontend with production build configuration
   - Ensure both work locally

2. **Create production Dockerfiles**
   - `api/Dockerfile.prod`: Multi-stage build with proper user permissions
   - `frontend/Dockerfile.prod`: Multi-stage build with static file serving
   - Test Docker builds locally:
     ```bash
     docker build -f Dockerfile.prod -t my-api .
     docker build -f Dockerfile.prod -t my-frontend .
     ```

## 2. Google Cloud Build Setup

1. **Create `cloudbuild.yaml`**
   - Configure builds for both API and frontend
   - Use `latest` tag for simplicity (easier than unique hashes)
   - Set up proper build steps with platform specification (`linux/amd64`)

2. **Test Google Cloud Build**
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```
   - Confirm images are pushed to Google Container Registry
   - Verify both API and frontend images build successfully

## 3. Terraform Infrastructure

1. **Set up Terraform configuration**
   - `main.tf`: Provider configuration, APIs, service accounts
   - `cloud-run.tf`: Cloud Run services with proper port mapping (8080)
   - `cloud-sql.tf`: Database configuration
   - `secrets.tf`: Secret Manager integration
   - `networking.tf`: Domain mappings (use CNAME to `ghs.googlehosted.com`)
   - `variables.tf`: All configurable parameters

2. **Configure secrets with `terraform.tfvars`**
   - Let Terraform manage all secrets (database passwords, API keys)
   - Use Secret Manager for runtime secret access
   - Never commit `terraform.tfvars` to version control

3. **Deploy production first**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```
   - Production creates shared SQL instance (cost optimization)
   - Creates production database on shared instance

4. **Deploy staging second**
   - Uses same shared SQL instance 
   - Creates staging database on production Cloud SQL instance
   - More cost-effective than separate SQL instances

## 4. DNS Configuration

1. **Domain setup strategy**
   - If domain not ready: deploy infrastructure first, configure DNS later
   - Update Terraform with correct domain names
   - Use CNAME records for subdomains: `subdomain.domain.com → ghs.googlehosted.com`

2. **DNS Records**
   ```dns
   # For Google Cloud Run subdomains
   myapp.domain.com → CNAME ghs.googlehosted.com
   api.myapp.domain.com → CNAME ghs.googlehosted.com
   ```

3. **Domain verification**
   - Verify parent domain in Google Search Console
   - Covers all subdomains automatically

## 5. GitHub Integration & CI/CD

1. **Set up Cloud Build triggers**
   - Configure triggers for staging branch → staging environment
   - Configure triggers for production branch → production environment
   - Automatic builds on push to respective branches

2. **Branch strategy**
   - `main` branch → production deployment
   - `staging` branch → staging deployment
   - Feature branches → manual testing

## 6. Local Development Environment

1. **Create comprehensive Makefile**
   ```makefile
   start-sql:     # Start Cloud SQL proxy
   start-api:     # Start API server locally
   start-web:     # Start frontend development server
   start-all:     # Start all services with tmux
   ```

2. **Set up tmux configuration**
   - Show all relevant terminals at once
   - Easy switching between API, frontend, database logs
   - Streamlined local development workflow

3. **Local database access**
   ```bash
   make start-sql    # Cloud SQL proxy
   make start-api    # API with local database connection
   make start-web    # Frontend pointing to local API
   ```

## 7. Infrastructure Complete - App Development

At this point, your infrastructure is fully set up:
- ✅ Docker builds working locally and in Cloud Build
- ✅ Terraform managing all infrastructure 
- ✅ Production and staging environments deployed
- ✅ DNS configured with custom domains
- ✅ CI/CD pipeline automated via GitHub
- ✅ Local development environment streamlined

**Now you can focus on improving your application** without worrying about infrastructure setup.

## Key Lessons Learned

- **Use `latest` tags** for simplicity in initial setup
- **Shared SQL instances** for cost optimization between environments
- **CNAME records** cleaner than multiple A records for subdomains
- **Deploy infrastructure first**, configure DNS later if needed
- **Terraform manages secrets** better than manual Secret Manager setup
- **Local development** should mirror production as closely as possible