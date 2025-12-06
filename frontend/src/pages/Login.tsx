// frontend/src/pages/Login.tsx

import React, { useState } from 'react';
import authService from '../services/authService'; // Importe o authService
import { useNavigate } from 'react-router-dom'; // Importe useNavigate para redirecionamento
import Footer from '../components/Footer'; // Importe o Footer

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); // Novo estado para loading
  const navigate = useNavigate(); // Hook para navegação

  const handleSubmit = async (e: React.FormEvent) => { // Tornar a função assíncrona
    e.preventDefault();
    setError(''); // Limpa erros anteriores
    setLoading(true); // Ativa o estado de loading

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false); // Desativa o loading
      return;
    }

    try {
      await authService.login(email, password);
      // Se o login for bem-sucedido, redireciona para o dashboard
      navigate('/dashboard'); // Redirecionar para o dashboard (será criado depois)
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false); // Desativa o loading, independente do sucesso ou falha
    }
  };

  return (
    <>
      <div style={styles.container}>
        <h2 style={styles.title}>Login Profissional</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading} // Desabilita o input durante o loading
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Senha:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading} // Desabilita o input durante o loading
              style={styles.input}
            />
          </div>
          {error && <p style={styles.errorMessage}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Entrando...' : 'Entrar'} {/* Muda o texto do botão durante o loading */}
          </button>
        </form>
        <p style={styles.linkText}>
          Não tem uma conta? <a href="/register" style={styles.link}>Crie sua conta</a>
        </p>
        <p style={styles.linkText}>
          Esqueceu sua senha? <a href="/forgot-password" style={styles.link}>Recuperar senha</a>
        </p>
      </div>
      <Footer />
    </>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1f2e',
    padding: '20px',
    paddingBottom: '80px', // Espaço para o footer fixo
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    color: '#ffffff',
    marginBottom: '30px',
    fontSize: '32px',
    fontWeight: 'bold',
  },
  form: {
    backgroundColor: '#141824',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column' as 'column',
    border: 'none',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#e0e0e0',
    fontWeight: 'bold',
  },
  input: {
    width: 'calc(100% - 22px)', // Adjusted for padding and border
    padding: '10px',
    border: '1px solid #2a3142',
    borderRadius: '4px',
    fontSize: '16px',
    backgroundColor: '#1f2533',
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '18px',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'background-color 0.3s ease',
  },
  errorMessage: {
    color: '#ff4444',
    marginTop: '10px',
    textAlign: 'center' as 'center',
  },
  linkText: {
    marginTop: '15px',
    color: '#b0b0b0',
  },
  link: {
    color: '#4da6ff',
    textDecoration: 'none',
  },
};

export default Login;