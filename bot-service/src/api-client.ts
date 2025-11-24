// bot-service/src/api-client.ts

import axios from 'axios';

// URL base da sua API de backend
const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:3001/api';

let profissionalId: number | null = null;

// Erro customizado para conflitos de agendamento
export class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppointmentConflictError';
  }
}

export const api = {
  /**
   * Realiza o login de um profissional e armazena o token globalmente para o Axios.
   */
  async loginProfissional(email: string, password: string): Promise<string> {
    console.log(`[API CLIENT] Tentando login para ${email}...`);
    try {
      const response = await axios.post(`${API_BASE_URL}/profissionais/login`, {
        email: email,
        senha: password,
      });

      const { token, profissional } = response.data;

      if (!token) {
        throw new Error("Token não recebido da API de login.");
      }

      // Armazena o ID do profissional e define o token para todas as requisições futuras
      profissionalId = profissional.id;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log(`[API CLIENT] Login para ${profissional.nome} realizado com sucesso!`);
      return token;

    } catch (error: any) {
      console.error('[API CLIENT] Erro no login do profissional:', error.response?.data?.message || error.message);
      throw new Error('Falha no login do profissional.');
    }
  },

  /**
   * Retorna o ID do profissional logado.
   */
  getProfissionalId(): number | null {
    return profissionalId;
  },

  /**
   * Busca um cliente pelo número de telefone.
   */
  async getClienteByTelefone(telefone: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clientes/by-phone?telefone=${telefone}`);
      console.log(`[API CLIENT] getClienteByTelefone - Resposta bem-sucedida para ${telefone}:`, response.data);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        console.warn(`[API CLIENT] getClienteByTelefone - Erro de resposta da API para ${telefone}: Status ${error.response.status}, Data:`, error.response.data);
        if (error.response.status === 404) {
          return null; // Cliente não encontrado
        }
      } else {
        console.error('[API CLIENT] getClienteByTelefone - Erro desconhecido ao buscar cliente:', error.message);
      }
      throw error; // Re-lança outros erros
    }
  },

  /**
   * Cria um novo cliente.
   */
  async createCliente(nome: string, telefone: string): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/clientes`, { nome, telefone });
    return response.data;
  },

  /**
   * Busca o agendamento ativo de um cliente.
   */
  async getActiveAppointment(clienteId: number): Promise<any> {
    try {
        const response = await axios.get(`${API_BASE_URL}/agendamentos/has-active-appointment/${clienteId}`);
        // Assuming the backend returns the active appointment object if found, or null/empty object if not.
        // The hasActiveAgendamento controller might return a boolean, or the active appointment directly.
        // Let's assume it returns the appointment object if active, otherwise null.
        return response.data || null;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            // If the API returns 404 meaning no active appointment, we treat it as null.
            if (error.response.status === 404) {
                return null;
            }
        }
        // For any other error, re-throw it.
        throw error;
    }
  },

  /**
   * Busca agendamentos futuros de um cliente.
   */
  async getFutureAppointments(clienteId: number): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/agendamentos/cliente/${clienteId}?status=futuro`);
    return response.data;
  },

  /**
   * Cancela um agendamento.
   */
  async cancelAgendamento(agendamentoId: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/agendamentos/${agendamentoId}`);
  },

  /**
   * Busca os dias disponíveis para agendamento.
   */
  async getAvailableDates(): Promise<string[]> {
    if (!this.getProfissionalId()) {
      throw new Error("ID do profissional não definido para buscar datas.");
    }
    const response = await axios.get(`${API_BASE_URL}/horarios/dias-disponiveis/${this.getProfissionalId()}`);
    return response.data;
  },

  /**
   * Busca os horários disponíveis para um dia específico.
   */
  async getAvailableSlots(date: string): Promise<string[]> {
    if (!this.getProfissionalId()) {
      throw new Error("ID do profissional não definido para buscar horários.");
    }
    const response = await axios.get(`${API_BASE_URL}/horarios/horarios-disponiveis/${this.getProfissionalId()}/${date}`);
    return response.data;
  },

  /**
   * Cria um novo agendamento.
   */
  async createAgendamento(data: any): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/agendamentos`, data);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        // Lança um erro específico para conflito de agendamento
        throw new AppointmentConflictError(error.response.data.message || 'Este horário já foi agendado.');
      }
      // Para outros erros, relança o erro original
      throw error;
    }
  }
};
