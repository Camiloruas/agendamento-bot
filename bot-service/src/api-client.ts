

import axios from 'axios';
import moment from 'moment'; 


const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:3001/api';

let profissionalId: number | null = null;


export class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppointmentConflictError';
  }
}

export const api = {
  
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

      
      profissionalId = profissional.id;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log(`[API CLIENT] Login para ${profissional.nome} realizado com sucesso!`);
      return token;

    } catch (error: any) {
      console.error('[API CLIENT] Erro no login do profissional:', error.response?.data?.message || error.message);
      throw new Error('Falha no login do profissional.');
    }
  },

  
  getProfissionalId(): number | null {
    return profissionalId;
  },

  
  async getClienteByTelefone(telefone: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clientes/by-phone?telefone=${telefone}`);
      console.log(`[API CLIENT] getClienteByTelefone - Resposta bem-sucedida para ${telefone}:`, response.data);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        console.warn(`[API CLIENT] getClienteByTelefone - Erro de resposta da API para ${telefone}: Status ${error.response.status}, Data:`, error.response.data);
        if (error.response.status === 404) {
          return null; 
        }
      } else {
        console.error('[API CLIENT] getClienteByTelefone - Erro desconhecido ao buscar cliente:', error.message);
      }
      throw error; 
    }
  },

  
  async createCliente(nome: string, telefone: string): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/clientes`, { nome, telefone });
    return response.data;
  },

  
  async getActiveAppointment(clienteId: number): Promise<any> {
    try {
        const futureAppointments = await api.getFutureAppointments(clienteId);
        console.log(`[API CLIENT] getActiveAppointment - Future appointments para cliente ${clienteId}:`, futureAppointments);
        const now = moment();

        
        const activeAppointment = futureAppointments.find(app =>
            ['Pendente', 'Confirmado'].includes(app.status) && moment(app.dataHora).isSameOrAfter(now)
        );
        console.log(`[API CLIENT] getActiveAppointment - Active appointment found:`, activeAppointment);
        return activeAppointment || null;
    } catch (error: any) {
        
        
        
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log(`[API CLIENT] getActiveAppointment - No future appointments (404) for client ${clienteId}.`);
            return null; 
        }
        console.error(`[API CLIENT] getActiveAppointment - Erro ao buscar agendamentos ativos para cliente ${clienteId}:`, error.message);
        throw error; 
    }
  },

  
  async getFutureAppointments(clienteId: number): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/agendamentos/cliente/${clienteId}`); 
    return response.data;
  },

  
  async cancelAgendamento(agendamentoId: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/agendamentos/${agendamentoId}`);
  },

  
  async getAvailableDates(): Promise<string[]> {
    if (!this.getProfissionalId()) {
      throw new Error("ID do profissional não definido para buscar datas.");
    }
    const response = await axios.get(`${API_BASE_URL}/horarios/dias-disponiveis/${this.getProfissionalId()}`);
    return response.data;
  },

  
  async getAvailableSlots(date: string): Promise<string[]> {
    if (!this.getProfissionalId()) {
      throw new Error("ID do profissional não definido para buscar horários.");
    }
    const response = await axios.get(`${API_BASE_URL}/horarios/horarios-disponiveis/${this.getProfissionalId()}/${date}`);
    return response.data;
  },

  
  async createAgendamento(data: any): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/agendamentos`, data);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        
        throw new AppointmentConflictError(error.response.data.message || 'Este horário já foi agendado.');
      }
      
      throw error;
    }
  }
};
