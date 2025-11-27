// frontend/src/services/profissionalService.ts

import axios from 'axios';

const API_URL = 'http://localhost:3001/api/profissionais'; // URL base para as rotas de profissional

interface ProfissionalProfile {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfileData {
  nome?: string;
  email?: string;
  telefone?: string;
}

interface ChangePasswordData {
  currentPassword?: string;
  newPassword?: string;
}

const getProfissionalProfile = async (): Promise<ProfissionalProfile> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado.');
    }

    const response = await axios.get(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar perfil.');
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};

const updateProfissionalProfile = async (profileData: UpdateProfileData): Promise<ProfissionalProfile> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado.');
    }

    const response = await axios.put(`${API_URL}/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.profissional; // O backend retorna { message, profissional }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao atualizar perfil.');
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};

const changeProfissionalPassword = async (passwordData: ChangePasswordData): Promise<{ message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado.');
    }

    const response = await axios.put(`${API_URL}/password`, passwordData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao alterar senha.');
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};

const profissionalService = {
  getProfissionalProfile,
  updateProfissionalProfile,
  changeProfissionalPassword,
};

export default profissionalService;
