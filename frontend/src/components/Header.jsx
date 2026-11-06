import React from 'react';

const PAGE_META = {
  overview: {
    title: 'Project Overview',
    subtitle: 'Research rationale, problem formulation, and comparative systems overview'
  },
  playground: {
    title: 'RAG Inference Playground',
    subtitle: 'Live comparative generation across Baseline LLM, Naive RAG, and Advanced Semantic RAG'
  },
  evaluation: {
    title: 'Batch Evaluation Dashboard',
    subtitle: 'Saved quantitative benchmark metrics and per-sample validation results'
  },
  methodology: {
    title: 'Research Methodology & Architecture',
    subtitle: 'Detailed algorithmic workflows, retrieval mechanics, and verification specifications'
  },
  dataset: {
    title: 'Dataset Explorer',
    subtitle: 'Inspect curated HaluEval QA knowledge base, questions, and reference targets'
  }
};

export default function Header({ activeTab }) {
  const meta = PAGE_META[activeTab] || PAGE_META.overview;

  return (
    <header className="top-header">
      <div className="header-title-box">
        <h1 className="header-title">{meta.title}</h1>
        <span className="header-subtitle">{meta.subtitle}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span className="header-badge">FAISS FlatIP</span>
        <span className="header-badge">MiniLM-L6-v2</span>
      </div>
    </header>
  );
}

