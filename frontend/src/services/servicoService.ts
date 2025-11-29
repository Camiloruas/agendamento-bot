import axios from 'axios';

const API_URL = 'http://localhost:3001/api/servicos';

export interface Servico {
    id: string;
    nome: string;
    descricao: string | null;
    preco: number;
    duracao: number;
    ativo: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const servicoService = {
    getAllServicos: async (): Promise<Servico[]> => {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar serviços:', error);
            throw error;
        }
    },

    createServico: async (servicoData: Partial<Servico>): Promise<Servico> => {
        try {
            const response = await axios.post(API_URL, servicoData);
            return response.data;
        } catch (error) {
            console.error('Erro ao criar serviço:', error);
            throw error;
        }
    },

    updateServico: async (id: string, servicoData: Partial<Servico>): Promise<Servico> => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, servicoData);
            return response.data;
        } catch (error) {
            console.error('Erro ao atualizar serviço:', error);
            throw error;
        }
    },

    deleteServico: async (id: string): Promise<void> => {
        try {
            await axios.delete(`${API_URL}/${id}`);
        } catch (error) {
            console.error('Erro ao deletar serviço:', error);
            throw error;
        }
    },

    toggleServico: async (id: string): Promise<Servico> => {
        try {
            const response = await axios.patch(`${API_URL}/${id}/toggle`);
            return response.data.servico;
        } catch (error) {
            console.error('Erro ao alternar status do serviço:', error);
            throw error;
        }
    },
};

export default servicoService;
