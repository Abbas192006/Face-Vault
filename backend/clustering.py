import numpy as np
from sklearn.cluster import DBSCAN
from database import get_db_connection, create_person, link_face_to_person, delete_people_for_event
from vector_index import vector_store
import faiss

def cluster_event_faces(event_id: int):
    # Remove existing people for this event before clustering
    delete_people_for_event(event_id)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all faces belonging to photos in this event
    cursor.execute('''
        SELECT f.id, f.embedding_index 
        FROM faces f
        JOIN photos p ON f.photo_id = p.id
        JOIN event_photos ep ON p.id = ep.photo_id
        WHERE ep.event_id = ?
    ''', (event_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        return
        
    face_ids = []
    embeddings = []
    
    for row in rows:
        face_id = row['id']
        emb_index = row['embedding_index']
        try:
            # Reconstruct embedding from FAISS
            emb = vector_store.index.reconstruct(emb_index)
            face_ids.append(face_id)
            embeddings.append(emb)
        except Exception as e:
            print(f"Failed to reconstruct embedding {emb_index}: {e}")
            
    if not embeddings:
        return
        
    X = np.array(embeddings)
    
    # DBSCAN clustering
    # eps=1.05 is a reasonable threshold for normalized embeddings (Euclidean distance corresponding to Cosine threshold ~0.45)
    clustering = DBSCAN(eps=1.05, min_samples=2, metric='euclidean').fit(X)
    labels = clustering.labels_
    
    # Group face_ids by label
    clusters = {}
    for face_id, label in zip(face_ids, labels):
        if label == -1: # Noise / Unclustered
            continue
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(face_id)
        
    # Create people and link faces
    person_idx = 1
    for label, cluster_face_ids in clusters.items():
        if not cluster_face_ids:
            continue
            
        # The first face becomes the representative face
        rep_face_id = cluster_face_ids[0]
        person_name = f"Person {person_idx}"
        
        person_id = create_person(event_id, person_name, rep_face_id)
        
        for fid in cluster_face_ids:
            link_face_to_person(person_id, fid)
            
        person_idx += 1
