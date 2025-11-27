// frontend/src/services/authService.ts

import axios from 'axios';

const API_URL = 'http://localhost:3001/api/profissionais'; // URL base para as rotas de profissional

const login = async (email: string, senha: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, senha });
    if (response.data.token) {
      // Armazena o token e talvez outras informações do profissional no localStorage
      localStorage.setItem('profissional', JSON.stringify(response.data.profissional));
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    // Trata erros da requisição, como credenciais inválidas
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro de login.');
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};

const register = async (nome: string, email: string, senha: string, telefone: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { nome, email, senha, telefone });
    // Opcionalmente, pode-se logar o usuário automaticamente após o registro
    // if (response.data.token) {
    //   localStorage.setItem('profissional', JSON.stringify(response.data.profissional));
    //   localStorage.setItem('token', response.data.token);
    // }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro de registro.');
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};

const logout = () => {
  localStorage.removeItem('profissional');
  localStorage.removeItem('token');
};

const getCurrentProfessional = () => {
  const profissionalStr = localStorage.getItem('profissional');
  return profissionalStr ? JSON.parse(profissionalStr) : null;
};

const authService = {
  login,
  register,
  logout,
  getCurrentProfessional,
};

export default authService;
