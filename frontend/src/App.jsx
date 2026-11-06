import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewPage from './pages/OverviewPage';
import PlaygroundPage from './pages/PlaygroundPage';
import EvaluationPage from './pages/EvaluationPage';
import MethodologyPage from './pages/MethodologyPage';
import DatasetPage from './pages/DatasetPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage onNavigate={(tab) => setActiveTab(tab)} />;
      case 'playground':
        return <PlaygroundPage />;
      case 'evaluation':
        return <EvaluationPage />;
      case 'methodology':
        return <MethodologyPage />;
      case 'dataset':
        return <DatasetPage />;
      default:
        return <OverviewPage onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="app-container">
      {/* Persistent Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Area */}
      <div className="main-wrapper">
        <Header activeTab={activeTab} />
        
        <main className="content-container">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
