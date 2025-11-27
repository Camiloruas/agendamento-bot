// frontend/src/services/agendamentoService.ts

import axios from 'axios';

const API_URL = 'http://localhost:3001/api/agendamentos'; // URL base para as rotas de agendamento

interface Agendamento {
  id: string;
  profissionalId: string;
  clienteId: string;
  dataHora: string; // Ou Date, dependendo de como você quer tipar no frontend
  servico: string;
  status: string;
  cliente?: { // Supondo que o cliente possa ser incluído no agendamento
    nome: string;
    telefone: string;
  };
}

interface CreateAgendamentoData {
  dataHora: string;
  clienteId: string;
  servico: string;
  descricao?: string;
}

const getAllAgendamentos = async (): Promise<Agendamento[]> => {
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
      throw new Error(error.response.data.message || 'Erro ao buscar agendamentos.');
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};

const getAgendamentosByDate = async (date: string): Promise<Agendamento[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado.');
    }

    const response = await axios.get(`${API_URL}/by-date?date=${date}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || `Erro ao buscar agendamentos para a data ${date}.`);
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};

const createAgendamento = async (agendamentoData: CreateAgendamentoData): Promise<Agendamento> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado.');
    }

    const response = await axios.post(API_URL, agendamentoData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.agendamento; // O backend retorna { message, agendamento }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao criar agendamento.');
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};

const agendamentoService = {
  getAllAgendamentos,
  getAgendamentosByDate,
  createAgendamento,
};

export default agendamentoService;
