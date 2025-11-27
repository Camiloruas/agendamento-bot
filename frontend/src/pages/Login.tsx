// frontend/src/pages/Login.tsx

import React, { useState } from 'react';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpa erros anteriores

    // Lógica de validação e chamada à API virá aqui
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    console.log('Tentando logar com:', { email, password });
    // Simulando uma chamada de API
    if (email === 'test@example.com' && password === 'password') {
      console.log('Login bem-sucedido!');
      // Redirecionar para o dashboard ou armazenar token
    } else {
      setError('Email ou senha inválidos.');
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
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit">Entrar</button>
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
