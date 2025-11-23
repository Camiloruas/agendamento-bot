"use strict";
// bot-service/src/api-client.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const axios_1 = __importDefault(require("axios"));
// URL base da sua API de backend
const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:3001/api';
let profissionalId = null;
exports.api = {
    /**
     * Realiza o login de um profissional e armazena o token globalmente para o Axios.
     */
    async loginProfissional(email, password) {
        console.log(`[API CLIENT] Tentando login para ${email}...`);
        try {
            const response = await axios_1.default.post(`${API_BASE_URL}/profissionais/login`, {
                email: email,
                senha: password,
            });
            const { token, profissional } = response.data;
            if (!token) {
                throw new Error("Token não recebido da API de login.");
            }
            // Armazena o ID do profissional e define o token para todas as requisições futuras
            profissionalId = profissional.id;
            axios_1.default.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log(`[API CLIENT] Login para ${profissional.nome} realizado com sucesso!`);
            return token;
        }
        catch (error) {
            console.error('[API CLIENT] Erro no login do profissional:', error.response?.data?.message || error.message);
            throw new Error('Falha no login do profissional.');
        }
    },
    /**
     * Retorna o ID do profissional logado.
     */
    getProfissionalId() {
        return profissionalId;
    },
    /**
     * Busca um cliente pelo número de telefone.
     */
    async getClienteByTelefone(telefone) {
        try {
            const response = await axios_1.default.get(`${API_BASE_URL}/clientes/telefone/${telefone}`);
            return response.data;
        }
        catch (error) {
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
    async createCliente(nome, telefone) {
        const response = await axios_1.default.post(`${API_BASE_URL}/clientes`, { nome, telefone });
        return response.data;
    },
    /**
     * Busca o agendamento ativo de um cliente.
     */
    async getActiveAppointment(clienteId) {
        // Esta é uma lógica de exemplo, a API pode não ter uma rota "active"
        const response = await axios_1.default.get(`${API_BASE_URL}/agendamentos/cliente/${clienteId}?status=ativo`);
        return response.data[0] || null;
    },
    /**
     * Busca agendamentos futuros de um cliente.
     */
    async getFutureAppointments(clienteId) {
        const response = await axios_1.default.get(`${API_BASE_URL}/agendamentos/cliente/${clienteId}?status=futuro`);
        return response.data;
    },
    /**
     * Cancela um agendamento.
     */
    async cancelAgendamento(agendamentoId) {
        await axios_1.default.delete(`${API_BASE_URL}/agendamentos/${agendamentoId}`);
    },
    /**
     * Busca os dias disponíveis para agendamento.
     */
    async getAvailableDates() {
        if (!this.getProfissionalId()) {
            throw new Error("ID do profissional não definido para buscar datas.");
        }
        const response = await axios_1.default.get(`${API_BASE_URL}/horarios/dias-disponiveis/${this.getProfissionalId()}`);
        return response.data;
    },
    /**
     * Busca os horários disponíveis para um dia específico.
     */
    async getAvailableSlots(date) {
        if (!this.getProfissionalId()) {
            throw new Error("ID do profissional não definido para buscar horários.");
        }
        const response = await axios_1.default.get(`${API_BASE_URL}/horarios/horarios-disponiveis/${this.getProfissionalId()}/${date}`);
        return response.data;
    },
    /**
     * Cria um novo agendamento.
     */
    async createAgendamento(data) {
        const response = await axios_1.default.post(`${API_BASE_URL}/agendamentos`, data);
        return response.data;
    }
};
