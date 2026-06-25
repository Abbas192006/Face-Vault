import os
import sys
from pathlib import Path

# On Windows Python 3.8+, DLLs are not automatically loaded from PATH.
# We must manually add the pip-installed CUDA/cuDNN bin directories.
if sys.platform == "win32":
    try:
        import nvidia
        base_dir = Path(nvidia.__path__[0])
        dirs_to_add = []
        for lib in ["cudnn", "cublas", "cuda_nvrtc", "cuda_runtime"]:
            bin_dir = base_dir / lib / "bin"
            if bin_dir.exists():
                dirs_to_add.append(str(bin_dir))
                os.add_dll_directory(str(bin_dir))
        if dirs_to_add:
            os.environ["PATH"] = ";".join(dirs_to_add) + ";" + os.environ.get("PATH", "")
    except Exception:
        pass

import cv2
import insightface
from insightface.app import FaceAnalysis
import numpy as np
from typing import List, Dict, Any, Optional

class FaceDetector:
    def __init__(self):
        # Initialize the FaceAnalysis app. 
        # 'buffalo_l' is the default model pack which provides 512-d embeddings.
        self.app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
        # Prepare the model (use ctx_id=0 for GPU, -1 for CPU)
        # Using GPU (RTX 4050) as requested for massive speed boost
        self.app.prepare(ctx_id=0, det_size=(640, 640))

    def detect_and_extract(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Loads an image, detects faces, and extracts embeddings.
        Using full original resolution to maximize small-face accuracy.
        """
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image at {image_path}")
            
        faces = self.app.get(img)
        results = []
        
        for face in faces:
            results.append({
                "bbox": face.bbox.tolist(), # [x1, y1, x2, y2]
                "embedding": face.embedding # 512-D numpy array
            })
            
        return results

    def extract_probe(self, image_bytes_list: List[bytes]) -> Optional[np.ndarray]:
        """
        Extracts face embeddings from multiple probe images of the same person.
        Averages the embeddings to create a robust 'Master Vector' (Ensemble Search).
        """
        embeddings = []
        for img_bytes in image_bytes_list:
            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            if img is not None:
                faces = self.app.get(img)
                # Find the largest face in the probe image to avoid background faces
                if faces:
                    largest_face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
                    embeddings.append(largest_face.normed_embedding)
                    
        if not embeddings:
            return None
            
        # Average the embeddings for extreme accuracy
        avg_embedding = np.mean(embeddings, axis=0)
        # Re-normalize
        norm = np.linalg.norm(avg_embedding)
        if norm > 0:
            avg_embedding = avg_embedding / norm
            
        return avg_embedding

detector = FaceDetector()
