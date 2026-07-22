import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer, util
from typing import List

app = FastAPI(title="TDC Career Similarity API", version="1.0.0")

allowed_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5000").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Load model once on startup
model = SentenceTransformer(os.getenv("SENTENCE_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))

class BatchRequest(BaseModel):
    user_text: str = Field(min_length=1, max_length=500)
    match_texts: List[str] = Field(min_length=1, max_length=100)

@app.get("/health")
def health():
    return {"status": "ok", "model": os.getenv("SENTENCE_MODEL", "sentence-transformers/all-MiniLM-L6-v2")}

@app.post("/api/batch-similarity")
def calculate_batch_similarity(data: BatchRequest):
    try:
        user_embedding = model.encode(data.user_text, convert_to_tensor=True)
        match_embeddings = model.encode(data.match_texts, convert_to_tensor=True)
        cosine_scores = util.cos_sim(user_embedding, match_embeddings)[0]
        scores = [round(score.item() * 100, 2) for score in cosine_scores]
        return {"scores": scores}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Similarity model is temporarily unavailable") from exc

if __name__ == "__main__":
    # Render will provide the PORT, default to 8000 for local development
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
