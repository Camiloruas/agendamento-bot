// frontend/src/services/horarioService.ts

import axios from 'axios';

const API_URL = 'http://localhost:3001/api/horarios'; // URL base para as rotas de horário

interface HorarioData {
  diasTrabalho: string[];
  horarioAbertura: string;
  horarioFechamento: string;
  intervaloInicio?: string;
  intervaloFim?: string;
}

interface HorarioProfissional {
  id: string;
  profissionalId: string;
  diaDaSemana: number; // 0 (Domingo) a 6 (Sábado)
  ativo: boolean;
  horarioInicio: string; // Formato "HH:MM"
  horarioFim: string; // Formato "HH:MM"
  almocoInicio: string | null; // Formato "HH:MM", opcional
  almocoFim: string | null; // Formato "HH:MM", opcional
}

const saveHorarios = async (horarioData: HorarioData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado.');
    }

    const response = await axios.post(API_URL, horarioData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Erro ao salvar horários.');
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};

const getHorarios = async (): Promise<HorarioProfissional[]> => {
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
      throw new Error(error.response.data.message || 'Erro ao buscar horários.');
    } else {
      throw new Error('Erro de rede ou servidor indisponível.');
    }
  }
};


const horarioService = {
  saveHorarios,
  getHorarios,
};

export default horarioService;