# FaceVault AI - Technical Architecture

## Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

## Backend
- FastAPI
- Python

## AI Layer
- InsightFace
- OpenCV

## Storage
### SQLite
Stores:
- Photo metadata
- User settings
- Index status

### FAISS
Stores:
- Face embeddings
- Similarity search vectors

## Background Jobs
- Celery
- Redis

## Architecture

Browser
→ Next.js Frontend
→ FastAPI Backend
→ SQLite
→ FAISS
→ Local Photo Library

## Deployment
Runs completely offline on localhost.

## Future Packaging
- Tauri Desktop Application
