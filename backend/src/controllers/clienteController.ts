import { Request, Response } from 'express';
import Cliente from '../models/Cliente'; 
import Agendamento from '../models/Agendamento';

/**
 * @function getClienteByTelefone
 * @description Busca um cliente específico pelo seu número de telefone.
 * Esta é uma rota crucial para o bot, que usa o número do WhatsApp como identificador primário.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns Retorna o cliente encontrado ou um erro 404 se não existir.
 */
export const getClienteByTelefone = async (req: Request, res: Response): Promise<Response> => {
    const { telefone } = req.query;

    if (!telefone) {
        return res.status(400).json({ message: "O parâmetro 'telefone' é obrigatório." });
    }

    try {
        const cliente = await Cliente.findOne({ 
            where: { telefone: telefone as string } 
        });

        if (!cliente) {
            return res.status(404).json({ message: "Cliente não encontrado." });
        }

        return res.status(200).json(cliente);

    } catch (error) {
        console.error("Erro ao buscar cliente por telefone:", error);
        return res.status(500).json({ message: "Erro interno ao buscar cliente." });
    }
};

/**
 * @function createCliente
 * @description Cadastra um novo cliente no sistema.
 * É utilizado pelo bot quando um novo usuário interage pela primeira vez e fornece seu nome.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns Retorna o cliente recém-criado.
 */
export const createCliente = async (req: Request, res: Response): Promise<Response> => {
    const { nome, telefone } = req.body;

    if (!nome || !telefone) {
        return res.status(400).json({ message: "Nome e Telefone são obrigatórios." });
    }

    try {
        // A verificação de duplicidade é vital para manter a integridade dos dados,
        // garantindo que cada número de telefone corresponda a um único cliente.
        const clienteExistente = await Cliente.findOne({ where: { telefone } });
        
        if (clienteExistente) {
             return res.status(409).json({ 
                 message: "Cliente com este telefone já cadastrado.", 
                 cliente: clienteExistente 
             });
        }
        
        const novoCliente = await Cliente.create({ nome, telefone });

        return res.status(201).json({ 
            message: "Cliente cadastrado com sucesso.", 
            cliente: novoCliente 
        });

    } catch (error) {
        console.error("Erro ao cadastrar cliente:", error);
        return res.status(500).json({ message: "Erro interno ao cadastrar cliente." });
    }
};

/**
 * @function getAllClientes
 * @description Retorna uma lista de todos os clientes cadastrados.
 * Útil para painéis administrativos e relatórios.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns Uma lista de todos os clientes.
 */
export const getAllClientes = async (req: Request, res: Response): Promise<Response> => {
    try {
        const clientes = await Cliente.findAll({
            // Seleciona explicitamente os atributos para evitar expor dados sensíveis.
            attributes: ['id', 'nome', 'telefone', 'createdAt', 'updatedAt'] 
        });
        return res.status(200).json(clientes);
    } catch (error) {
        console.error("Erro ao buscar todos os clientes:", error);
        return res.status(500).json({ message: "Erro interno ao buscar clientes." });
    }
};

/**
 * @function getClienteById
 * @description Busca um cliente pelo seu ID único, incluindo seus agendamentos associados.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns O cliente e seus agendamentos, ou um erro 404.
 */
export const getClienteById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    try {
        const cliente = await Cliente.findByPk(id, {
            include: [{ // Inclui agendamentos para fornecer uma visão completa do histórico do cliente.
                model: Agendamento,
                as: 'agendamentos'
            }]
        });

        if (!cliente) {
            return res.status(404).json({ message: "Cliente não encontrado." });
        }

        return res.status(200).json(cliente);
    } catch (error) {
        console.error("Erro ao buscar cliente por ID:", error);
        return res.status(500).json({ message: "Erro interno ao buscar cliente." });
    }
};

/**
 * @function updateCliente
 * @description Atualiza os dados de um cliente existente (nome e/ou telefone).
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns O cliente com os dados atualizados.
 */
export const updateCliente = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { nome, telefone } = req.body;

    try {
        const cliente = await Cliente.findByPk(id);

        if (!cliente) {
            return res.status(404).json({ message: "Cliente não encontrado." });
        }

        // Atualiza os campos apenas se eles forem fornecidos na requisição.
        cliente.nome = nome || cliente.nome;
        cliente.telefone = telefone || cliente.telefone;

        await cliente.save();

        return res.status(200).json({ message: "Cliente atualizado com sucesso.", cliente });
    } catch (error) {
        console.error("Erro ao atualizar cliente:", error);
        return res.status(500).json({ message: "Erro interno ao atualizar cliente." });
    }
};

/**
 * @function deleteCliente
 * @description Remove um cliente do banco de dados.
 * A exclusão em cascata (configurada no modelo Agendamento) removerá também seus agendamentos.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns Uma mensagem de sucesso.
 */
export const deleteCliente = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    try {
        const cliente = await Cliente.findByPk(id);

        if (!cliente) {
            return res.status(404).json({ message: "Cliente não encontrado." });
        }

        await cliente.destroy();

        return res.status(200).json({ message: "Cliente deletado com sucesso." });
    } catch (error) {
        console.error("Erro ao deletar cliente:", error);
        return res.status(500).json({ message: "Erro interno ao deletar cliente." });
    }
};