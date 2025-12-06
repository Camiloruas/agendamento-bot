// frontend/src/App.tsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importe os componentes das páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import ForgotPassword from './pages/ForgotPassword';

// Importe o CSS
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes> {/* O <Routes> agora vive aqui */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Rota padrão: redireciona para /login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
