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
      const response = await axios.get(`${API_BASE_URL}/clientes/telefone/${telefone}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null; // Cliente não encontrado
      }
      console.error('[API] Erro ao buscar cliente:', error.message);
      throw error;
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
    // Esta é uma lógica de exemplo, a API pode não ter uma rota "active"
    const response = await axios.get(`${API_BASE_URL}/agendamentos/cliente/${clienteId}?status=ativo`);
    return response.data[0] || null;
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
