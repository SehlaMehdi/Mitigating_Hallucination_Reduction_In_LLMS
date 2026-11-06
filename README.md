# Mitigating Hallucinations in Large Language Models Using Advanced RAG Pipelines

A comparative study of Baseline LLM, Naive Retrieval-Augmented Generation (RAG), and Semantic-Aware RAG techniques to improve factual accuracy and reduce semantic hallucinations in Large Language Models.

## Overview

Large Language Models (LLMs) can generate responses that sound convincing but contain incorrect, unsupported, or fabricated information. These responses are commonly known as hallucinations.

This project explores how Retrieval-Augmented Generation (RAG) can help mitigate hallucinations by providing relevant knowledge to an LLM before generating an answer.

Three different approaches are implemented and evaluated:

- **System A – Baseline LLM:** Generates answers directly using an LLM without external knowledge retrieval.
- **System B – Naive RAG:** Retrieves the top relevant knowledge passages using FAISS and provides them as context to the LLM.
- **System C – Semantic-Aware RAG:** Extends retrieval with relevance filtering, redundancy removal, answer verification, fallback retrieval, and evidence-based answer generation.

The objective is to compare these approaches and investigate how semantic filtering and verification can improve answer grounding.

## System Architecture

### System A – Baseline LLM

The user's question is directly sent to the LLM through the Groq API. The model generates an answer without retrieving external knowledge.

### System B – Naive RAG

1. The user's question is converted into an embedding.
2. FAISS searches the knowledge base for relevant passages.
3. The top 2 passages are retrieved.
4. Retrieved passages are provided as context to the LLM.
5. The LLM generates an answer based on the retrieved context.

### System C – Semantic-Aware RAG

This system introduces additional semantic processing and verification stages:

1. Initial retrieval of relevant passages.
2. Semantic relevance filtering.
3. Redundancy removal.
4. Grounded answer generation.
5. Answer verification against the retrieved evidence.
6. Fallback retrieval if the answer is unsupported.
7. Abstention when sufficient supporting evidence is unavailable.

## Key Features

- Comparison of three LLM and RAG approaches.
- Semantic retrieval using sentence embeddings.
- Vector similarity search using FAISS.
- Semantic relevance filtering.
- Redundancy reduction.
- Answer verification and fallback retrieval.
- Evidence-based answer generation.
- Interactive RAG playground.
- Evaluation dashboard for comparing system performance.
- Dataset exploration interface.
- Evaluation reports and metric summaries.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Styling | CSS |
| Backend | Python, FastAPI |
| LLM API | Groq API |
| LLM Model | openai/gpt-oss-20b |
| Embedding Model | sentence-transformers/all-MiniLM-L6-v2 |
| Vector Database / Search | FAISS |
| Dataset | HaluEval (curated QA subset) |
| Data Processing | Pandas |
| Environment Management | python-dotenv |

## Dataset

The project uses a curated subset of the HaluEval Question Answering dataset.

The dataset contains 500 question-answer records with three columns:

- `knowledge` – Supporting knowledge passage.
- `question` – User question.
- `right_answer` – Reference answer.

The dataset is used as the knowledge source for retrieval and for evaluating the generated responses.

## Evaluation Metrics

The three systems are evaluated using the following metrics:

- **Normalized Exact Match:** Measures whether the generated answer exactly matches the reference after text normalization.
- **Token Precision:** Measures the proportion of generated answer tokens that match the reference.
- **Token Recall:** Measures the proportion of reference answer tokens covered by the generated answer.
- **Token F1 Score:** Combines token precision and recall.
- **Semantic Cosine Similarity:** Measures semantic similarity between generated answers and reference answers using sentence embeddings.

The evaluation also records valid responses, abstentions, and errors.

These metrics provide indicators of answer matching and semantic similarity; they should not be interpreted as direct measurements of hallucination rate.

## Project Structure

```text
Mitigating_Hallucination_Reduction_In_LLMS/
│
├── backend/
│   └── main.py
│
├── data/
│   ├── prototype_qa_data.csv
│   └── qa_data_raw.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── notebooks/
│   ├── 01_setup_and_data.ipynb
│   ├── 02_baseline_llm.ipynb
│   ├── 03_naive_rag.ipynb
│   ├── 04_semantic_rag_basic.ipynb
│   └── 05_comparison_test.ipynb
│
├── results/
│   ├── evaluation_metrics_summary.csv
│   ├── evaluation_summary.csv
│   ├── RAG_Evaluation_Report.pdf
│   └── Architectural_Inspection_and_Diagnostic_Audit_Report.pdf
│
├── src/
│   ├── __init__.py
│   └── rag_pipeline.py
│
├── evaluate_systems.py
├── generate_evaluation_pdf.py
├── requirements.txt
├── .env.example
└── .gitignore
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SehlaMehdi/Mitigating_Hallucination_Reduction_In_LLMS.git
```

Navigate to the project directory:

```bash
cd Mitigating_Hallucination_Reduction_In_LLMS
```

### 2. Set Up the Python Backend

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install the required Python dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure the Groq API Key

Create a `.env` file in the project root directory.

Add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Obtain an API key from the Groq developer platform.

**Important:** Never share or commit your actual `.env` file or API key.

### 4. Start the Backend

From the main project directory, run:

```bash
python -m uvicorn backend.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 5. Set Up the Frontend

Open a separate terminal:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will generally be available at:

```text
http://localhost:5173
```

## Running the Evaluation

From the main project directory, activate your Python environment and execute:

```bash
python evaluate_systems.py
```

The evaluation outputs are saved in the `results/` directory.

## Expected Outcome

The project investigates whether combining retrieval with semantic relevance filtering, redundancy removal, and answer verification can improve the factual grounding of LLM-generated responses.

The three-system comparison provides an experimental basis for understanding the advantages and limitations of different RAG approaches.

## Future Enhancements

- Evaluate the systems on larger and more diverse datasets.
- Incorporate additional hallucination-specific evaluation metrics.
- Improve semantic relevance and answer verification.
- Explore different embedding models and LLMs.
- Extend the approach to domain-specific knowledge bases.

## Acknowledgements

- HaluEval dataset for hallucination-related evaluation data.
- Sentence Transformers for semantic embedding generation.
- FAISS for efficient vector similarity search.
- Groq for LLM inference.

## License

A license has not yet been specified for this repository. Please check the dataset's redistribution terms before sharing the dataset files publicly.
