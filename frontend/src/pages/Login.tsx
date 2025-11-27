// frontend/src/pages/Login.tsx

import React, { useState } from 'react';
import authService from '../services/authService'; // Importe o authService
import { useNavigate } from 'react-router-dom'; // Importe useNavigate para redirecionamento

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
    <div className="login-container">
      <h2>Login Profissional</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading} // Desabilita o input durante o loading
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Senha:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading} // Desabilita o input durante o loading
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'} {/* Muda o texto do botão durante o loading */}
        </button>
      </form>
      <p>
        Não tem uma conta? <a href="/register">Crie sua conta</a>
      </p>
      <p>
        Esqueceu sua senha? <a href="/forgot-password">Recuperar senha</a>
      </p>
    </div>
  );
};

export default Login;