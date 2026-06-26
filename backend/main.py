from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import glob
import uuid
import shutil
import cv2
import zipfile
import io
import re
from datetime import datetime
from database import (
    init_db, add_photo, add_face, get_photo_by_face_index, photo_exists,
    add_search_history, get_search_history, delete_search_history, clear_search_history,
    create_event, get_events, get_event, update_event, delete_event, link_photo_to_event,
    add_bookmark, remove_bookmark, get_bookmarks, is_bookmarked, get_photo_id_by_path,
    add_tag, remove_tag, get_tags_for_photo, get_all_tags, get_photos_by_tag,
    get_stats, nuke_all_data, get_people_for_event, get_faces_for_person, rename_person,
    get_db_connection
)
from vector_index import vector_store
from detector import detector
from clustering import cluster_event_faces

app = FastAPI(title="FaceVault Event AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

scan_tasks = {}

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

# ─── Directory Indexing ───────────────────────────────────────────────

def extract_captured_at(path: str, filename: str) -> str:
    # 1. Try EXIF
    try:
        from PIL import Image, ExifTags
        with Image.open(path) as img:
            exif = img.getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)
                    if tag == 'DateTimeOriginal':
                        dt = datetime.strptime(str(value).strip(), "%Y:%m:%d %H:%M:%S")
                        return dt.isoformat()
    except Exception:
        pass
        
    # 2. Try Regex on filename
    try:
        match1 = re.search(r'(20\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})', filename)
        if match1:
            dt = datetime(int(match1.group(1)), int(match1.group(2)), int(match1.group(3)),
                          int(match1.group(4)), int(match1.group(5)), int(match1.group(6)))
            return dt.isoformat()
            
        match2 = re.search(r'(20\d{2})(\d{2})(\d{2})', filename)
        if match2:
            dt = datetime(int(match2.group(1)), int(match2.group(2)), int(match2.group(3)))
            return dt.isoformat()
            
        match3 = re.search(r'(20\d{2})-(\d{2})-(\d{2}) at (\d{2})\.(\d{2})\.(\d{2})', filename)
        if match3:
            dt = datetime(int(match3.group(1)), int(match3.group(2)), int(match3.group(3)),
                          int(match3.group(4)), int(match3.group(5)), int(match3.group(6)))
            return dt.isoformat()
            
        match4 = re.search(r'(1[5-7]\d{8})', filename)
        if match4:
            dt = datetime.fromtimestamp(int(match4.group(1)))
            return dt.isoformat()
    except Exception:
        pass
        
    # 3. Fallback to file modification time
    try:
        mtime = os.path.getmtime(path)
        return datetime.fromtimestamp(mtime).isoformat()
    except Exception:
        return datetime.now().isoformat()

def process_directory(directory_path: str, task_id: str, event_id: int = None):
    """Background task to index a folder of images with progress tracking."""
    valid_extensions = ["*.jpg", "*.jpeg", "*.png"]
    image_paths = []
    
    for ext in valid_extensions:
        image_paths.extend(glob.glob(os.path.join(directory_path, "**", ext), recursive=True))
        
    total_images = len(image_paths)
    scan_tasks[task_id] = {"status": "scanning", "total": total_images, "processed": 0}
    
    photo_count = 0
    face_count = 0
    
    for idx, path in enumerate(image_paths):
        try:
            # Skip embedding generation if already indexed, but link to event
            existing_photo_id = get_photo_id_by_path(path)
            if existing_photo_id:
                if event_id:
                    link_photo_to_event(event_id, existing_photo_id)
                scan_tasks[task_id]["processed"] = idx + 1
                continue

            filename = os.path.basename(path)
            captured_at = extract_captured_at(path, filename)
            photo_id = add_photo(path, filename, captured_at)
            
            # Link photo to event if provided
            if event_id:
                link_photo_to_event(event_id, photo_id)
            
            faces = detector.detect_and_extract(path)
            for face in faces:
                embedding_index = vector_store.add_embedding(face["embedding"])
                add_face(photo_id, face["bbox"], embedding_index)
                face_count += 1
                
        except Exception as e:
            print(f"Failed to process {path}: {e}")
        
        scan_tasks[task_id]["processed"] = idx + 1
            
    vector_store.save()
    scan_tasks[task_id]["status"] = "completed"
    
    # Update event stats if linked
    if event_id:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Calculate accurate counts
        cursor.execute("SELECT COUNT(*) FROM event_photos WHERE event_id = ?", (event_id,))
        real_photo_count = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT COUNT(f.id) 
            FROM faces f
            JOIN event_photos ep ON f.photo_id = ep.photo_id
            WHERE ep.event_id = ?
        ''', (event_id,))
        real_face_count = cursor.fetchone()[0]
        
        conn.close()
        
        update_event(event_id, status="indexed", photo_count=real_photo_count, face_count=real_face_count)
        
        # Trigger face clustering automatically
        scan_tasks[task_id]["status"] = "clustering"
        try:
            cluster_event_faces(event_id)
        except Exception as e:
            print(f"Failed to cluster faces for event {event_id}: {e}")
            
        scan_tasks[task_id]["status"] = "completed"

@app.post("/api/index")
async def index_folder(path: str, background_tasks: BackgroundTasks, event_id: Optional[int] = None):
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Invalid directory path")
    
    task_id = str(uuid.uuid4())
    scan_tasks[task_id] = {"status": "pending", "total": 0, "processed": 0}
    background_tasks.add_task(process_directory, path, task_id, event_id)
    return {"status": "started", "task_id": task_id, "path": path}

@app.get("/api/status/{task_id}")
def get_status(task_id: str):
    if task_id not in scan_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return scan_tasks[task_id]

# ─── File System ──────────────────────────────────────────────────────

@app.get("/api/directories")
def list_directories(path: str = "C:/"):
    try:
        # Resolve to absolute path
        abs_path = os.path.abspath(path)
        if not os.path.exists(abs_path) or not os.path.isdir(abs_path):
            raise HTTPException(status_code=400, detail="Invalid directory path")
            
        directories = []
        for item in os.listdir(abs_path):
            item_path = os.path.join(abs_path, item)
            if os.path.isdir(item_path):
                # skip hidden/system dirs on windows if possible, but basic try/except is enough
                try:
                    directories.append({
                        "name": item,
                        "path": item_path
                    })
                except Exception:
                    pass
        
        # Sort alphabetically
        directories.sort(key=lambda x: x["name"].lower())
        
        # Determine parent
        parent = os.path.dirname(abs_path)
        if parent == abs_path:
            parent = None # we are at root
            
        return {
            "current": abs_path,
            "parent": parent,
            "directories": directories
        }
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Image Serving ────────────────────────────────────────────────────

@app.get("/api/image")
def get_image(path: str, thumbnail: bool = False):
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Image not found")
        
    if thumbnail:
        img = cv2.imread(path)
        if img is not None:
            h, w = img.shape[:2]
            max_dim = 256
            scale = min(max_dim/w, max_dim/h)
            new_w, new_h = int(w * scale), int(h * scale)
            thumb = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
            
            success, encoded_image = cv2.imencode('.jpg', thumb, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if success:
                return Response(content=encoded_image.tobytes(), media_type="image/jpeg")
                
    return FileResponse(path)

# ─── Face Search ──────────────────────────────────────────────────────

import asyncio

@app.post("/api/search")
async def search_face(
    files: List[UploadFile] = File(...),
    folder_path: Optional[str] = Form(None),
    threshold: Optional[float] = Form(0.6)
):
    contents_list = []
    for file in files:
        contents_list.append(await file.read())
        
    # Run the CPU-heavy inference in a separate thread so we don't freeze the FastAPI event loop
    probe_embedding = await asyncio.to_thread(detector.extract_probe, contents_list)
    
    if probe_embedding is None:
        raise HTTPException(status_code=400, detail="No faces detected in the provided selfies.")
        
    results = vector_store.search(probe_embedding, k=10000, threshold=threshold)
    
    matches = []
    for res in results:
        photo_meta = get_photo_by_face_index(res["embedding_index"])
        if photo_meta:
            if folder_path and folder_path not in photo_meta["filepath"]:
                continue
                
            # Add bookmark status
            photo_id = photo_meta.get("id")
            bookmarked = is_bookmarked(photo_id) if photo_id else False
            tags = get_tags_for_photo(photo_id) if photo_id else []
            matches.append({
                "distance": res["distance"],
                "photo": photo_meta,
                "bookmarked": bookmarked,
                "tags": tags,
                "face_count": photo_meta.get("face_count", 1)
            })
            
    matches.sort(key=lambda x: x["distance"])
    
    primary_filename = files[0].filename if files else "unknown_selfie.jpg"
    add_search_history(primary_filename, len(matches), folder_path or "All")
    
    return {"matches": matches}

# ─── Search History ───────────────────────────────────────────────────

@app.get("/api/history")
def get_history():
    return {"history": get_search_history()}

@app.delete("/api/history/{history_id}")
def delete_history_entry(history_id: int):
    if delete_search_history(history_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="History entry not found")

@app.delete("/api/history/clear")
def clear_history():
    clear_search_history()
    return {"status": "cleared"}

# ─── Events ───────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    name: str
    folder_path: str = ""
    description: str = ""

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

@app.get("/api/events")
def list_events():
    return {"events": get_events()}

@app.post("/api/events")
def create_new_event(event: EventCreate):
    result = create_event(event.name, event.folder_path, event.description)
    return result

@app.get("/api/events/{event_id}")
def get_single_event(event_id: int):
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.put("/api/events/{event_id}")
def update_single_event(event_id: int, event: EventUpdate):
    if not update_event(event_id, name=event.name, description=event.description):
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "updated"}

@app.delete("/api/events/{event_id}")
def delete_single_event(event_id: int):
    if not delete_event(event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "deleted"}

@app.post("/api/events/{event_id}/index")
async def index_event(event_id: int, background_tasks: BackgroundTasks):
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event["folder_path"] or not os.path.isdir(event["folder_path"]):
        raise HTTPException(status_code=400, detail="Event folder path is invalid")
    
    task_id = str(uuid.uuid4())
    scan_tasks[task_id] = {"status": "pending", "total": 0, "processed": 0}
    update_event(event_id, status="indexing")
    background_tasks.add_task(process_directory, event["folder_path"], task_id, event_id)
    return {"status": "started", "task_id": task_id}

@app.post("/api/reindex/{event_id}")
async def reindex_event(event_id: int, background_tasks: BackgroundTasks):
    """Re-index an event's folder (same as index but explicit re-scan)."""
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not event["folder_path"] or not os.path.isdir(event["folder_path"]):
        raise HTTPException(status_code=400, detail="Event folder path is invalid")
    
    task_id = str(uuid.uuid4())
    scan_tasks[task_id] = {"status": "pending", "total": 0, "processed": 0}
    update_event(event_id, status="re-indexing")
    background_tasks.add_task(process_directory, event["folder_path"], task_id, event_id)
    return {"status": "started", "task_id": task_id}

# ─── People ───────────────────────────────────────────────────────────

@app.get("/api/events/{event_id}/people")
def get_event_people(event_id: int):
    event = get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"people": get_people_for_event(event_id)}

class PersonRenameRequest(BaseModel):
    name: str

@app.put("/api/people/{person_id}")
def update_person_name(person_id: int, req: PersonRenameRequest):
    if not rename_person(person_id, req.name):
        raise HTTPException(status_code=404, detail="Person not found")
    return {"status": "updated", "name": req.name}

@app.get("/api/people/{person_id}/faces")
def get_person_faces(person_id: int):
    return {"faces": get_faces_for_person(person_id)}

# ─── Bookmarks ────────────────────────────────────────────────────────

class BookmarkRequest(BaseModel):
    filepath: str

@app.get("/api/bookmarks")
def list_bookmarks():
    return {"bookmarks": get_bookmarks()}

@app.post("/api/bookmarks")
def bookmark_photo(req: BookmarkRequest):
    photo_id = get_photo_id_by_path(req.filepath)
    if not photo_id:
        raise HTTPException(status_code=404, detail="Photo not found in index")
    add_bookmark(photo_id)
    return {"status": "bookmarked", "photo_id": photo_id}

@app.delete("/api/bookmarks")
def unbookmark_photo(req: BookmarkRequest):
    photo_id = get_photo_id_by_path(req.filepath)
    if not photo_id:
        raise HTTPException(status_code=404, detail="Photo not found")
    remove_bookmark(photo_id)
    return {"status": "removed"}

# ─── Tags ─────────────────────────────────────────────────────────────

class TagRequest(BaseModel):
    filepath: str
    label: str

@app.get("/api/tags")
def list_all_tags():
    return {"tags": get_all_tags()}

@app.post("/api/tags")
def tag_photo(req: TagRequest):
    photo_id = get_photo_id_by_path(req.filepath)
    if not photo_id:
        raise HTTPException(status_code=404, detail="Photo not found in index")
    add_tag(photo_id, req.label)
    return {"status": "tagged", "label": req.label}

@app.delete("/api/tags")
def untag_photo(req: TagRequest):
    photo_id = get_photo_id_by_path(req.filepath)
    if not photo_id:
        raise HTTPException(status_code=404, detail="Photo not found")
    remove_tag(photo_id, req.label)
    return {"status": "removed"}

@app.get("/api/photos/{photo_id}/tags")
def get_photo_tags(photo_id: int):
    return {"tags": get_tags_for_photo(photo_id)}

@app.get("/api/tags/{label}/photos")
def get_tagged_photos(label: str):
    return {"photos": get_photos_by_tag(label)}

# ─── Stats ────────────────────────────────────────────────────────────

@app.get("/api/stats")
def get_dashboard_stats():
    return get_stats()

# ─── Download / Copy ──────────────────────────────────────────────────

class DownloadRequest(BaseModel):
    files: List[str]

@app.post("/api/download_zip")
async def download_zip(request: DownloadRequest):
    if not request.files:
        raise HTTPException(status_code=400, detail="No files provided")
        
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in request.files:
            if os.path.isfile(file_path):
                zip_file.write(file_path, arcname=os.path.basename(file_path))
                
    zip_buffer.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="facevault_event_photos.zip"'
    }
    
    return StreamingResponse(
        iter([zip_buffer.getvalue()]), 
        media_type="application/x-zip-compressed", 
        headers=headers
    )

class CopyRequest(BaseModel):
    files: List[str]
    destination: str

@app.post("/api/copy")
async def copy_files(request: CopyRequest):
    if not os.path.exists(request.destination):
        os.makedirs(request.destination, exist_ok=True)
        
    copied_count = 0
    errors = []
    for file_path in request.files:
        if os.path.isfile(file_path):
            try:
                shutil.copy(file_path, request.destination)
                copied_count += 1
            except Exception as e:
                errors.append(f"Failed {file_path}: {e}")
        else:
            errors.append(f"File not found: {file_path}")
            
    return {"copied": copied_count, "errors": errors}

# ─── Danger Zone ──────────────────────────────────────────────────────

@app.delete("/api/nuke")
def danger_nuke():
    """Delete all data from the database and reset the FAISS index."""
    nuke_all_data()
    # Reset the FAISS index
    import faiss
    vector_store.index = faiss.IndexFlatL2(512)
    vector_store.save()
    return {"status": "All data has been permanently deleted."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
