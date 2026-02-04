import { useState, useEffect } from 'react';
import './App.css';
import AuthorsList from './pages/AuthorsList';
import PublicationsList from './pages/PublicationsList';
import Alert from './components/Alert';

function App() {
  const [activeTab, setActiveTab] = useState('authors');
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1>📚 Editorial Management System</h1>
          <p className="subtitle">Microservicios de Autores y Publicaciones</p>
        </div>
      </header>

      {alert && (
        <div className="container">
          <Alert type={alert.type} message={alert.message} />
        </div>
      )}

      <nav className="app-nav">
        <div className="container">
          <button
            className={`nav-btn ${activeTab === 'authors' ? 'active' : ''}`}
            onClick={() => setActiveTab('authors')}
          >
            👥 Authors
          </button>
          <button
            className={`nav-btn ${activeTab === 'publications' ? 'active' : ''}`}
            onClick={() => setActiveTab('publications')}
          >
            📝 Publications
          </button>
        </div>
      </nav>

      <main className="container">
        {activeTab === 'authors' && <AuthorsList onAlert={showAlert} />}
        {activeTab === 'publications' && (
          <PublicationsList onAlert={showAlert} />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 Editorial Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
