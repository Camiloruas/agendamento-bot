// backend/src/controllers/clienteController.ts

import { Request, Response } from 'express';
import Cliente from '../models/Cliente'; // Importa o novo modelo

// 1. Rota ÚTIL para o BOT: Buscar um cliente pelo telefone (número do WhatsApp)
export const getClienteByTelefone = async (req: Request, res: Response): Promise<Response> => {
    // O telefone deve ser passado como parâmetro de consulta (query) na URL: /clientes?telefone=5585999999999
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

// 2. Rota ÚTIL para o BOT: Criar um novo cliente (quando o bot pede o nome)
export const createCliente = async (req: Request, res: Response): Promise<Response> => {
    const { nome, telefone } = req.body;

    // O bot DEVE garantir que o telefone já é o ID do WhatsApp
    if (!nome || !telefone) {
        return res.status(400).json({ message: "Nome e Telefone são obrigatórios." });
    }

    try {
        // Verifica se o telefone já existe para evitar duplicidade
        const clienteExistente = await Cliente.findOne({ where: { telefone } });
        
        if (clienteExistente) {
             // Se já existir, retornamos um 409 Conflict ou o cliente existente
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