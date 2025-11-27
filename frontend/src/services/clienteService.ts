// frontend/src/services/clienteService.ts

import axios from 'axios';

const API_URL = 'http://localhost:3001/api/clientes'; // URL base para as rotas de cliente

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  // Adicione outros campos relevantes do modelo Cliente
}

const getAllClientes = async (): Promise<Cliente[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado.');
    }

    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao buscar clientes.');
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};

const clienteService = {
  getAllClientes,
};

export default clienteService;
