import axios from 'axios';

const API_URL = 'http://localhost:3001/api/servicos';

export interface Servico {
    id: string;
    nome: string;
    descricao: string;
    preco: number;
    duracao: number;
}

const getAllServices = async (): Promise<Servico[]> => {
    try {
        const token = localStorage.getItem('token');
        // Serviços podem ser públicos ou protegidos. Se protegidos, envie o token.
        // Assumindo que para listar serviços no dashboard o usuário já está logado.
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const response = await axios.get(API_URL, config);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Erro ao buscar serviços.');
        } else {
            throw new Error('Erro de rede ou servidor indisponível.');
        }
    }
};

const servicoService = {
    getAllServices,
};

export default servicoService;
