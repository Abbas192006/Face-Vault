import sqlite3
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

DB_PATH = "facevault.db"

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Photos table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filepath TEXT UNIQUE NOT NULL,
            filename TEXT NOT NULL,
            indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Migration for existing databases
    cursor.execute("PRAGMA table_info(photos)")
    columns = [info[1] for info in cursor.fetchall()]
    if 'captured_at' not in columns:
        cursor.execute("ALTER TABLE photos ADD COLUMN captured_at TIMESTAMP DEFAULT NULL")
    
    # Faces table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS faces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            photo_id INTEGER NOT NULL,
            box_x1 REAL,
            box_y1 REAL,
            box_x2 REAL,
            box_y2 REAL,
            embedding_index INTEGER,
            FOREIGN KEY(photo_id) REFERENCES photos(id) ON DELETE CASCADE
        )
    ''')
    
    # Search History table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            probe_filename TEXT NOT NULL,
            match_count INTEGER NOT NULL,
            folder_scanned TEXT,
            searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            folder_path TEXT,
            description TEXT DEFAULT '',
            photo_count INTEGER DEFAULT 0,
            face_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Bookmarks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            photo_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(photo_id) REFERENCES photos(id) ON DELETE CASCADE,
            UNIQUE(photo_id)
        )
    ''')

    # Tags table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            photo_id INTEGER NOT NULL,
            label TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(photo_id) REFERENCES photos(id) ON DELETE CASCADE,
            UNIQUE(photo_id, label)
        )
    ''')

    # Event-Photo mapping table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS event_photos (
            event_id INTEGER NOT NULL,
            photo_id INTEGER NOT NULL,
            PRIMARY KEY (event_id, photo_id),
            FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY(photo_id) REFERENCES photos(id) ON DELETE CASCADE
        )
    ''')
    
    # People table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            representative_face_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY(representative_face_id) REFERENCES faces(id) ON DELETE SET NULL
        )
    ''')

    # People-Faces mapping table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS people_faces (
            person_id INTEGER NOT NULL,
            face_id INTEGER NOT NULL,
            PRIMARY KEY (person_id, face_id),
            FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE,
            FOREIGN KEY(face_id) REFERENCES faces(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

# ─── Search History ───────────────────────────────────────────────────

def add_search_history(probe_filename: str, match_count: int, folder_scanned: str) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO search_history (probe_filename, match_count, folder_scanned, searched_at) VALUES (?, ?, ?, ?)",
        (probe_filename, match_count, folder_scanned, datetime.now().isoformat())
    )
    conn.commit()
    h_id = cursor.lastrowid
    conn.close()
    return h_id

def get_search_history() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM search_history ORDER BY searched_at DESC LIMIT 50")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_search_history(history_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM search_history WHERE id = ?", (history_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def clear_search_history():
    conn = get_db_connection()
    conn.execute("DELETE FROM search_history")
    conn.commit()
    conn.close()

# ─── Photos ───────────────────────────────────────────────────────────

def add_photo(filepath: str, filename: str, captured_at: str = None) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    if captured_at is None:
        captured_at = datetime.now().isoformat()
    try:
        cursor.execute(
            "INSERT INTO photos (filepath, filename, indexed_at, captured_at) VALUES (?, ?, ?, ?)", 
            (filepath, filename, datetime.now().isoformat(), captured_at)
        )
        conn.commit()
        photo_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        cursor.execute("SELECT id FROM photos WHERE filepath = ?", (filepath,))
        photo_id = cursor.fetchone()['id']
    finally:
        conn.close()
    return photo_id

def photo_exists(filepath: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM photos WHERE filepath = ?", (filepath,))
    row = cursor.fetchone()
    conn.close()
    return row is not None

def get_photo_id_by_path(filepath: str) -> Optional[int]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM photos WHERE filepath = ?", (filepath,))
    row = cursor.fetchone()
    conn.close()
    return row['id'] if row else None

# ─── Faces ────────────────────────────────────────────────────────────

def add_face(photo_id: int, bbox: List[float], embedding_index: int) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO faces (photo_id, box_x1, box_y1, box_x2, box_y2, embedding_index) VALUES (?, ?, ?, ?, ?, ?)",
        (photo_id, bbox[0], bbox[1], bbox[2], bbox[3], embedding_index)
    )
    conn.commit()
    face_id = cursor.lastrowid
    conn.close()
    return face_id

def get_photo_by_face_index(embedding_index: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.id, p.filepath, p.filename, p.captured_at, f.box_x1, f.box_y1, f.box_x2, f.box_y2,
               (SELECT COUNT(*) FROM faces f2 WHERE f2.photo_id = p.id) as face_count
        FROM faces f 
        JOIN photos p ON f.photo_id = p.id 
        WHERE f.embedding_index = ?
    ''', (embedding_index,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# ─── Events ───────────────────────────────────────────────────────────

def create_event(name: str, folder_path: str = "", description: str = "") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO events (name, folder_path, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (name, folder_path, description, now, now)
    )
    conn.commit()
    event_id = cursor.lastrowid
    conn.close()
    return {"id": event_id, "name": name, "folder_path": folder_path, "description": description,
            "photo_count": 0, "face_count": 0, "status": "pending", "created_at": now, "updated_at": now}

def get_events() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_event(event_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_event(event_id: int, name: str = None, description: str = None, 
                 status: str = None, photo_count: int = None, face_count: int = None) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    updates = []
    values = []
    if name is not None:
        updates.append("name = ?")
        values.append(name)
    if description is not None:
        updates.append("description = ?")
        values.append(description)
    if status is not None:
        updates.append("status = ?")
        values.append(status)
    if photo_count is not None:
        updates.append("photo_count = ?")
        values.append(photo_count)
    if face_count is not None:
        updates.append("face_count = ?")
        values.append(face_count)
    
    if not updates:
        conn.close()
        return False
    
    updates.append("updated_at = ?")
    values.append(datetime.now().isoformat())
    values.append(event_id)
    
    cursor.execute(f"UPDATE events SET {', '.join(updates)} WHERE id = ?", values)
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    return updated

def delete_event(event_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def link_photo_to_event(event_id: int, photo_id: int):
    conn = get_db_connection()
    try:
        conn.execute("INSERT OR IGNORE INTO event_photos (event_id, photo_id) VALUES (?, ?)", (event_id, photo_id))
        conn.commit()
    finally:
        conn.close()

# ─── People ───────────────────────────────────────────────────────────

def create_person(event_id: int, name: str, representative_face_id: int = None) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO people (event_id, name, representative_face_id) VALUES (?, ?, ?)",
        (event_id, name, representative_face_id)
    )
    conn.commit()
    person_id = cursor.lastrowid
    conn.close()
    return person_id

def rename_person(person_id: int, new_name: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE people SET name = ? WHERE id = ?", (new_name, person_id))
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return updated

def link_face_to_person(person_id: int, face_id: int):
    conn = get_db_connection()
    try:
        conn.execute("INSERT OR IGNORE INTO people_faces (person_id, face_id) VALUES (?, ?)", (person_id, face_id))
        conn.commit()
    finally:
        conn.close()

def delete_people_for_event(event_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM people WHERE event_id = ?", (event_id,))
    conn.commit()
    conn.close()

def get_people_for_event(event_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.id, p.name, p.representative_face_id, 
               (SELECT COUNT(*) FROM people_faces pf WHERE pf.person_id = p.id) as face_count,
               ph.filepath as rep_filepath
        FROM people p
        LEFT JOIN faces f ON p.representative_face_id = f.id
        LEFT JOIN photos ph ON f.photo_id = ph.id
        WHERE p.event_id = ?
        ORDER BY face_count DESC
    ''', (event_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_faces_for_person(person_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT f.id as face_id, f.box_x1, f.box_y1, f.box_x2, f.box_y2,
               p.id as photo_id, p.filepath, p.filename, p.captured_at,
               (SELECT COUNT(*) FROM faces f2 WHERE f2.photo_id = p.id) as photo_face_count
        FROM people_faces pf
        JOIN faces f ON pf.face_id = f.id
        JOIN photos p ON f.photo_id = p.id
        WHERE pf.person_id = ?
    ''', (person_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ─── Bookmarks ────────────────────────────────────────────────────────

def add_bookmark(photo_id: int) -> bool:
    conn = get_db_connection()
    try:
        conn.execute("INSERT OR IGNORE INTO bookmarks (photo_id, created_at) VALUES (?, ?)",
                     (photo_id, datetime.now().isoformat()))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()

def remove_bookmark(photo_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM bookmarks WHERE photo_id = ?", (photo_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_bookmarks() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT b.id, b.created_at, p.id as photo_id, p.filepath, p.filename, p.captured_at
        FROM bookmarks b
        JOIN photos p ON b.photo_id = p.id
        ORDER BY b.created_at DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def is_bookmarked(photo_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM bookmarks WHERE photo_id = ?", (photo_id,))
    row = cursor.fetchone()
    conn.close()
    return row is not None

# ─── Tags ─────────────────────────────────────────────────────────────

def add_tag(photo_id: int, label: str) -> bool:
    conn = get_db_connection()
    try:
        conn.execute("INSERT OR IGNORE INTO tags (photo_id, label, created_at) VALUES (?, ?, ?)",
                     (photo_id, label.strip().lower(), datetime.now().isoformat()))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()

def remove_tag(photo_id: int, label: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tags WHERE photo_id = ? AND label = ?", (photo_id, label.strip().lower()))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_tags_for_photo(photo_id: int) -> List[str]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT label FROM tags WHERE photo_id = ? ORDER BY label", (photo_id,))
    rows = cursor.fetchall()
    conn.close()
    return [row['label'] for row in rows]

def get_all_tags() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT label, COUNT(*) as count FROM tags GROUP BY label ORDER BY count DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_photos_by_tag(label: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.id as tag_id, t.created_at, p.id as photo_id, p.filepath, p.filename, p.captured_at
        FROM tags t
        JOIN photos p ON t.photo_id = p.id
        WHERE t.label = ?
        ORDER BY t.created_at DESC
    ''', (label.strip().lower(),))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ─── Stats ────────────────────────────────────────────────────────────

def get_stats() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as count FROM photos")
    total_photos = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM faces")
    total_faces = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM search_history")
    total_searches = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM events")
    total_events = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM bookmarks")
    total_bookmarks = cursor.fetchone()['count']
    
    conn.close()
    
    # Get file sizes
    db_size = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0
    index_path = "facevault.index"
    index_size = os.path.getsize(index_path) if os.path.exists(index_path) else 0
    
    return {
        "total_photos": total_photos,
        "total_faces": total_faces,
        "total_searches": total_searches,
        "total_events": total_events,
        "total_bookmarks": total_bookmarks,
        "db_size_bytes": db_size,
        "index_size_bytes": index_size,
        "db_size_mb": round(db_size / (1024 * 1024), 2),
        "index_size_mb": round(index_size / (1024 * 1024), 2),
    }

# ─── Danger Zone ──────────────────────────────────────────────────────

def nuke_all_data():
    """Delete all data from all tables. Use with extreme caution."""
    conn = get_db_connection()
    tables = ["tags", "bookmarks", "event_photos", "faces", "search_history", "events", "photos"]
    for table in tables:
        conn.execute(f"DELETE FROM {table}")
    conn.commit()
    conn.close()
