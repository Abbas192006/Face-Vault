import faiss
import numpy as np
import os

INDEX_PATH = "facevault.index"
DIMENSION = 512  # Standard for InsightFace buffalo_l / arcface

class FAISSIndex:
    def __init__(self):
        self.dimension = DIMENSION
        if os.path.exists(INDEX_PATH):
            self.index = faiss.read_index(INDEX_PATH)
        else:
            # L2 distance based index (Inner Product can also be used if vectors are normalized)
            self.index = faiss.IndexFlatL2(self.dimension)

    def add_embedding(self, embedding: np.ndarray) -> int:
        """Adds a normalized face embedding and returns its sequential ID."""
        if len(embedding.shape) == 1:
            embedding = np.expand_dims(embedding, axis=0)
        
        # FAISS expects float32
        embedding = embedding.astype('float32')
        faiss.normalize_L2(embedding)
        
        current_count = self.index.ntotal
        self.index.add(embedding)
        
        return current_count # The index of the added embedding

    def search(self, query_embedding: np.ndarray, k: int = 5, threshold: float = 1.0):
        """Searches for k nearest neighbors."""
        if len(query_embedding.shape) == 1:
            query_embedding = np.expand_dims(query_embedding, axis=0)
            
        query_embedding = query_embedding.astype('float32')
        faiss.normalize_L2(query_embedding)
        
        distances, indices = self.index.search(query_embedding, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1 and dist <= threshold:
                results.append({"embedding_index": int(idx), "distance": float(dist)})
                
        return results

    def save(self):
        faiss.write_index(self.index, INDEX_PATH)

vector_store = FAISSIndex()
