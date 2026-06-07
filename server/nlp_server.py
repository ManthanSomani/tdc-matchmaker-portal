import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once on startup
model = SentenceTransformer('all-MiniLM-L6-v2')

class BatchRequest(BaseModel):
    user_text: str
    match_texts: List[str]

@app.post("/api/batch-similarity")
def calculate_batch_similarity(data: BatchRequest):
    try:
        user_embedding = model.encode(data.user_text, convert_to_tensor=True)
        match_embeddings = model.encode(data.match_texts, convert_to_tensor=True)
        cosine_scores = util.cos_sim(user_embedding, match_embeddings)[0]
        scores = [round(score.item() * 100, 2) for score in cosine_scores]
        return {"scores": scores}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Render will provide the PORT, default to 8000 for local development
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)