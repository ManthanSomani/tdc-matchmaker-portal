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

model = SentenceTransformer('all-MiniLM-L6-v2')

# Define the Batch Schema (One user text, an array of match texts)
class BatchRequest(BaseModel):
    user_text: str
    match_texts: List[str]

@app.post("/api/batch-similarity")
def calculate_batch_similarity(data: BatchRequest):
    try:
        # Convert all texts to vectors at the exact same time
        user_embedding = model.encode(data.user_text, convert_to_tensor=True)
        match_embeddings = model.encode(data.match_texts, convert_to_tensor=True)
        
        # Calculate scores for the whole list instantly
        cosine_scores = util.cos_sim(user_embedding, match_embeddings)[0]
        
        # Format the scores into a clean array
        scores = [round(score.item() * 100, 2) for score in cosine_scores]
        return {"scores": scores}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)