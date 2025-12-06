import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const Register = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(''); // Limpa mensagens anteriores

    if (senha !== confirmarSenha) {
      setMensagem('As senhas não coincidem!');
      setIsError(true);
      return;
    }

    try {
      await authService.register(nome, email, senha, telefone);
      setMensagem('Registro bem-sucedido! Redirecionando para Onboarding...');
      setIsError(false);
      navigate('/onboarding'); // Redireciona para a página de Onboarding após o registro
    } catch (error: any) {
      setMensagem(error.message || 'Erro ao registrar. Tente novamente.');
      setIsError(true);
    }
  };

  return (
    <>
      <div style={styles.container}>
        <h1 style={styles.title}>Criar minha conta</h1>
        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="nome" style={styles.label}>Nome Completo:</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email (login):</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="senha" style={styles.label}>Senha:</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="confirmarSenha" style={styles.label}>Confirmar Senha:</label>
            <input
              type="password"
              id="confirmarSenha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="telefone" style={styles.label}>Telefone (WhatsApp do salão):</label>
            <input
              type="text"
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.button}>Registrar</button>
        </form>
        {mensagem && (
          <p style={isError ? styles.errorMessage : styles.successMessage}>
            {mensagem}
          </p>
        )}
        <p style={styles.loginLink}>
          Já tem uma conta? <a href="/login" style={styles.link}>Faça Login</a>
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
    paddingBottom: '80px',
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
    width: 'calc(100% - 22px)',
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
    marginTop: '20px',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#3d1f1f',
    color: '#ff4444',
    textAlign: 'center' as 'center',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid #ff4444',
  },
  successMessage: {
    marginTop: '20px',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#1f3d2a',
    color: '#4caf50',
    textAlign: 'center' as 'center',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid #4caf50',
  },
  loginLink: {
    marginTop: '20px',
    color: '#b0b0b0',
  },
  link: {
    color: '#4da6ff',
    textDecoration: 'none',
  },
};

export default Register;