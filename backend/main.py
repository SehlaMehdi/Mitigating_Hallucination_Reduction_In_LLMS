import csv
import os
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from src.rag_pipeline import run_system_a, run_system_b, run_system_c

app = FastAPI(title="RAG Research Platform API")

# CORS is required so our frontend can securely talk to our backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# In-Memory Dataset Cache for Fast Reference Lookup & Dataset Explorer
# ------------------------------------------------------------------------------
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_csv_path = os.path.join(base_dir, "data", "prototype_qa_data.csv")

if os.path.exists(data_csv_path):
    dataset_df = pd.read_csv(data_csv_path)
else:
    dataset_df = pd.DataFrame(columns=["knowledge", "question", "right_answer"])

def normalize_lookup(text: str) -> str:
    """Standardizes string for deterministic reference question matching."""
    if not text:
        return ""
    return "".join(ch.lower() for ch in str(text) if ch.isalnum() or ch.isspace()).strip()

def find_reference_match(query: str):
    """
    Checks whether the submitted query matches an existing question in the benchmark dataset.
    Returns the exact reference answer and knowledge passage if matched.
    """
    norm_q = normalize_lookup(query)
    if not norm_q:
        return {"matched": False, "right_answer": None, "knowledge": None, "dataset_index": None}

    for idx, row in dataset_df.iterrows():
        row_q = normalize_lookup(row["question"])
        if norm_q == row_q:
            return {
                "matched": True,
                "right_answer": str(row["right_answer"]),
                "knowledge": str(row["knowledge"]),
                "dataset_index": int(idx) + 1
            }

    return {"matched": False, "right_answer": None, "knowledge": None, "dataset_index": None}


# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------

class QueryRequest(BaseModel):
    query: str

@app.post("/api/ask")
def ask_systems(request: QueryRequest):
    """
    Receives a question, executes Systems A, B, and C, checks for a reference answer,
    and returns mapped JSON.
    """
    question = request.query
    
    # Execute the three systems
    ans_a = run_system_a(question)
    ans_b, docs_b = run_system_b(question, k=2)
    ans_c, docs_c = run_system_c(question, k=5)
    
    # Check for ground truth reference in the dataset
    ref_info = find_reference_match(question)

    return {
        "system_a": {
            "answer": ans_a
        },
        "system_b": {
            "answer": ans_b,
            "retrieved_chunks": docs_b
        },
        "system_c": {
            "answer": ans_c,
            "filtered_chunks": [{"text": t, "score": s} for t, s in docs_c]
        },
        "reference": ref_info
    }

@app.get("/api/evaluation-results")
def get_evaluation_results():
    """
    Reads the detailed batch evaluation summary CSV and serves it to the frontend dashboard.
    """
    results_path = os.path.join(base_dir, "results", "evaluation_summary.csv")
    if not os.path.exists(results_path):
        return {"error": "Evaluation summary not found. Please run evaluate_systems.py first.", "results": []}
    
    rows = []
    with open(results_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
            
    return {"results": rows}

@app.get("/api/evaluation-metrics")
def get_evaluation_metrics():
    """
    Reads the aggregate evaluation metrics summary CSV.
    """
    metrics_path = os.path.join(base_dir, "results", "evaluation_metrics_summary.csv")
    if not os.path.exists(metrics_path):
        return {"error": "Evaluation metrics summary not found.", "metrics": []}
    
    rows = []
    with open(metrics_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
            
    return {"metrics": rows}

# ------------------------------------------------------------------------------
# File Download Endpoints
# ------------------------------------------------------------------------------

@app.get("/api/download/summary-csv")
def download_summary_csv():
    path = os.path.join(base_dir, "results", "evaluation_summary.csv")
    if not os.path.exists(path):
        return {"error": "File not found"}
    return FileResponse(path, filename="evaluation_summary.csv", media_type="text/csv")

@app.get("/api/download/metrics-csv")
def download_metrics_csv():
    path = os.path.join(base_dir, "results", "evaluation_metrics_summary.csv")
    if not os.path.exists(path):
        return {"error": "File not found"}
    return FileResponse(path, filename="evaluation_metrics_summary.csv", media_type="text/csv")

@app.get("/api/download/report-pdf")
def download_report_pdf():
    path = os.path.join(base_dir, "results", "RAG_Evaluation_Report.pdf")
    if not os.path.exists(path):
        return {"error": "File not found"}
    return FileResponse(path, filename="RAG_Evaluation_Report.pdf", media_type="application/pdf")

# ------------------------------------------------------------------------------
# Dataset Explorer Endpoints
# ------------------------------------------------------------------------------

@app.get("/api/dataset/samples")
def get_dataset_samples(limit: int = 5):
    """
    Returns curated sample questions for quick testing in the playground.
    """
    samples = []
    for idx, row in dataset_df.head(limit).iterrows():
        samples.append({
            "id": int(idx) + 1,
            "question": str(row["question"]),
            "right_answer": str(row["right_answer"])
        })
    return {"samples": samples}

@app.get("/api/dataset")
def get_dataset_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", max_length=200)
):
    """
    Paginated, searchable endpoint for Dataset Explorer.
    """
    df = dataset_df.copy()
    total_records = len(df)

    if search.strip():
        term = search.strip().lower()
        mask = (
            df["question"].str.lower().str.contains(term, na=False) |
            df["right_answer"].str.lower().str.contains(term, na=False) |
            df["knowledge"].str.lower().str.contains(term, na=False)
        )
        df = df[mask]

    filtered_records = len(df)
    total_pages = max(1, (filtered_records + page_size - 1) // page_size)

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    page_slice = df.iloc[start_idx:end_idx]

    items = []
    for idx, row in page_slice.iterrows():
        items.append({
            "id": int(idx) + 1,
            "question": str(row["question"]),
            "right_answer": str(row["right_answer"]),
            "knowledge": str(row["knowledge"])
        })

    return {
        "total_records": total_records,
        "filtered_records": filtered_records,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": items
    }
