import axios from 'axios';
import moment from 'moment';

// Define a URL base para todas as chamadas à API do backend.
// Usar uma variável de ambiente aqui torna o código portável entre diferentes ambientes (desenvolvimento, produção).
const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:3001/api';

// Armazena o ID do profissional logado para ser usado em requisições subsequentes.
let profissionalId: number | null = null;

/**
 * @class AppointmentConflictError
 * @description Erro customizado para ser lançado quando a API retorna um status 409 (Conflito).
 * Isso permite que a lógica do bot trate especificamente a situação em que um horário
 * acabou de ser agendado por outra pessoa, oferecendo uma experiência de usuário mais refinada.
 */
export class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppointmentConflictError';
  }
}

export interface TimeSlot {
  time: string;
  status: "disponivel" | "ocupado";
}

/**
 * @const api
 * @description Centraliza todas as interações com a API de backend em um único objeto.
 * Este padrão (conhecido como "Adapter" ou "Service Layer") desacopla a lógica de negócio do bot
 * dos detalhes de implementação da comunicação HTTP, facilitando a manutenção e os testes.
 */
export const api = {
  /**
   * @method loginProfissional
   * @description Autentica o profissional no backend e armazena o token JWT globalmente no Axios.
   * Isso garante que todas as futuras requisições do bot para a API sejam autenticadas.
   */
  async loginProfissional(email: string, password: string): Promise<string> {
    console.log(`[API CLIENT] Tentando login para ${email}...`);
    try {
      const response = await axios.post(`${API_BASE_URL}/profissionais/login`, {
        email: email,
        senha: password,
      });
      const { token, profissional } = response.data;
      if (!token) throw new Error("Token não recebido da API de login.");

      profissionalId = profissional.id;
      // Configura o token no cabeçalho `Authorization` para todas as chamadas futuras do Axios.
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log(`[API CLIENT] Login para ${profissional.nome} realizado com sucesso!`);
      return token;
    } catch (error: any) {
      console.error('[API CLIENT] Erro no login do profissional:', error.response?.data?.message || error.message);
      throw new Error('Falha no login do profissional.');
    }
  },

  /**
   * @method getProfissionalId
   * @description Retorna o ID do profissional atualmente logado.
   */
  getProfissionalId(): number | null {
    return profissionalId;
  },

  /**
   * @method getClienteByTelefone
   * @description Busca um cliente pelo número de telefone. Retorna `null` se não encontrado (404),
   * o que é um fluxo esperado quando um novo cliente interage com o bot.
   */
  async getClienteByTelefone(telefone: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clientes/by-phone?telefone=${telefone}`);
      console.log(`[API CLIENT] getClienteByTelefone - Resposta bem-sucedida para ${telefone}:`, response.data);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 404) return null; // Comportamento esperado: cliente não existe.
        console.warn(`[API CLIENT] getClienteByTelefone - Erro de resposta da API para ${telefone}: Status ${error.response.status}, Data:`, error.response.data);
      } else {
        console.error('[API CLIENT] getClienteByTelefone - Erro desconhecido ao buscar cliente:', error.message);
      }
      throw error;
    }
  },

  /**
   * @method createCliente
   * @description Envia uma requisição para criar um novo cliente no backend.
   */
  async createCliente(nome: string, telefone: string): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/clientes`, { nome, telefone });
    return response.data;
  },

  /**
   * @method getActiveAppointment
   * @description Verifica se um cliente possui um agendamento ativo (status 'Pendente' ou 'Confirmado' no futuro).
   */
  async getActiveAppointment(clienteId: number): Promise<any> {
    try {
      const futureAppointments = await api.getFutureAppointments(clienteId);
      const now = moment();
      const activeAppointment = futureAppointments.find(app =>
        ['Pendente', 'Confirmado'].includes(app.status) && moment(app.dataHora).isSameOrAfter(now)
      );
      return activeAppointment || null;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null; // Nenhum agendamento futuro encontrado, logo, nenhum ativo.
      }
      console.error(`[API CLIENT] getActiveAppointment - Erro ao buscar agendamentos ativos para cliente ${clienteId}:`, error.message);
      throw error;
    }
  },

  /**
   * @method getFutureAppointments
   * @description Busca todos os agendamentos futuros de um cliente.
   */
  async getFutureAppointments(clienteId: number): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/agendamentos/cliente/${clienteId}`);
    return response.data;
  },

  /**
   * @method cancelAgendamento
   * @description Envia uma requisição para cancelar um agendamento específico.
   */
  async cancelAgendamento(agendamentoId: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/agendamentos/${agendamentoId}`);
  },

  /**
   * @method getAvailableDates
   * @description Busca os dias disponíveis para agendamento com o profissional logado.
   */
  async getAvailableDates(): Promise<string[]> {
    if (!this.getProfissionalId()) throw new Error("ID do profissional não definido para buscar datas.");
    const response = await axios.get(`${API_BASE_URL}/horarios/dias-disponiveis/${this.getProfissionalId()}`);
    return response.data;
  },

  /**
   * @method getAvailableSlots
   * @description Busca os horários (slots) disponíveis para uma data específica com o profissional logado.
   */
  async getAvailableSlots(date: string): Promise<TimeSlot[]> {
    if (!this.getProfissionalId()) throw new Error("ID do profissional não definido para buscar horários.");
    const response = await axios.get(`${API_BASE_URL}/horarios/horarios-disponiveis/${this.getProfissionalId()}/${date}`);
    return response.data;
  },

  /**
   * @method createAgendamento
   * @description Envia a requisição final para criar o agendamento no backend.
   * Trata especificamente o erro de conflito (409) para lançar o `AppointmentConflictError`.
   */
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
  },

  /**
   * @method getServices
   * @description Busca a lista de serviços disponíveis no backend.
   */
  async getServices(): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/servicos`);
    return response.data;
  }
};
