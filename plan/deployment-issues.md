# Deployment Issues

## Summary
Attempting to deploy the PeoplePerson API to Cloud Run staging has encountered multiple issues. This document tracks the problems discovered and solutions implemented.

## Issues Discovered

### 1. PORT Environment Variable Not Used
**Problem**: The Dockerfile had a hardcoded port instead of using Cloud Run's `PORT` environment variable.

**Original Code** (api/Dockerfile:49):
```dockerfile
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**Issue**: Cloud Run sets a `PORT` environment variable that the container must listen on. Hardcoding the port causes the health checks to fail because the app may not be listening on the expected port.

**Solution**: Changed to use the PORT environment variable with a fallback:
```dockerfile
CMD python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
```

**Status**: ✅ Fixed

### 2. Wrong Dockerfile Referenced in Cloud Build
**Problem**: The cloudbuild.yaml referenced `Dockerfile.prod` which doesn't exist.

**Current Code** (api/cloudbuild.yaml:3):
```yaml
args: ['build', '-f', 'Dockerfile.prod', '-t', 'gcr.io/peopleperson-app/peopleperson-api:staging', '.']
```

**Issue**: The actual Dockerfile is located at `api/Dockerfile`, not `api/Dockerfile.prod`. This means Cloud Build was building something different than what we tested locally.

**Solution**: Need to update cloudbuild.yaml to reference the correct Dockerfile path.

**Status**: ⚠️ Not yet fixed

### 3. Architecture Mismatch (ARM vs AMD64)
**Problem**: Building Docker images locally on Apple Silicon (ARM64) produces ARM images, but Cloud Run requires AMD64 images.

**Error Message**:
```
terminated: Application failed to start: failed to load /bin/sh: exec format error
```

**Issue**: When we built and pushed the local image to GCR, it was built for ARM64 architecture. Cloud Run tried to run it on AMD64 and failed with "exec format error".

**Solution**: Build Docker images with `--platform linux/amd64` flag:
```bash
docker build --platform linux/amd64 -f Dockerfile -t gcr.io/peopleperson-app/peopleperson-api:staging .
```

**Status**: ⚠️ In progress - awaiting requirements.txt simplification

### 4. Bloated Docker Image Size
**Problem**: The AMD64 build produced a 7.99GB image compared to 1.52GB ARM build.

**Issue**: The requirements.txt includes heavy ML dependencies (sentence-transformers, torch, CUDA libraries) that balloon the image size when built for AMD64:
- torch: ~900MB
- nvidia-cublas-cu12: ~594MB
- nvidia-cudnn-cu12: ~707MB
- Plus many other CUDA packages

**Impact**:
- Longer build times
- Longer deployment times
- Higher storage costs
- Slower cold starts

**Solution**: Simplify requirements.txt to remove unnecessary ML/CUDA dependencies.

**Status**: 🔄 In progress - user is simplifying dependencies

## Comparison with KarlCam

Reviewed KarlCam deployment configuration to identify differences:

### Similarities
- Both use Cloud Run v2 services
- Both use similar environment variable patterns
- Both have port configurations in Cloud Run terraform

### Key Differences

**Dockerfile**:
- KarlCam: Simple single-stage build, runs as root
- PeoplePerson: Multi-stage build with non-root user (more secure but more complex)

**CMD in Dockerfile**:
- KarlCam: `CMD python -m uvicorn web.api.main:app --host 0.0.0.0 --port ${PORT:-8000}` ✅
- PeoplePerson: `CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]` ❌

**Health Probes**:
- KarlCam: No startup/liveness probes in Terraform
- PeoplePerson: Has both startup_probe and liveness_probe configured

**Cloud Build**:
- KarlCam: Uses Cloud Build with Terraform for deployment
- PeoplePerson: Has cloudbuild.yaml but references wrong Dockerfile

## Next Steps

1. ✅ Fix PORT environment variable usage in Dockerfile
2. ⏳ Simplify requirements.txt to remove CUDA/ML dependencies
3. ⏳ Rebuild Docker image with `--platform linux/amd64`
4. ⏳ Push AMD64 image to GCR
5. ⏳ Deploy to Cloud Run staging
6. ⏳ Update cloudbuild.yaml to reference correct Dockerfile
7. ⏳ Test full deployment pipeline

## Timeline

- **2025-10-19**: Initial deployment attempt failed with startup probe errors
- **2025-10-19**: Discovered PORT variable issue, architecture mismatch
- **2025-10-19**: Built AMD64 image (7.99GB) - deemed too large
- **2025-10-19**: Paused to simplify dependencies
