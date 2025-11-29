import { Request, Response } from 'express';
import Servico from '../models/Servico';

export const getAllServices = async (req: Request, res: Response): Promise<Response> => {
    try {
        const servicos = await Servico.findAll();
        return res.status(200).json(servicos);
    } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        return res.status(500).json({ message: "Erro interno ao buscar serviços." });
    }
};

export const createService = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { nome, descricao, preco, duracao } = req.body;

        if (!nome || !preco || !duracao) {
            return res.status(400).json({ message: "Campos obrigatórios: nome, preco, duracao." });
        }

        const novoServico = await Servico.create({
            nome,
            descricao,
            preco,
            duracao
        });

        return res.status(201).json(novoServico);
    } catch (error) {
        console.error("Erro ao criar serviço:", error);
        return res.status(500).json({ message: "Erro interno ao criar serviço." });
    }
};
