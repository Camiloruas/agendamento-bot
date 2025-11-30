import { Request, Response } from 'express';
import Servico from '../models/Servico';

export const getAllServices = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { ativo } = req.query;

        const whereClause = ativo === 'true' ? { ativo: true } : {};

        const servicos = await Servico.findAll({ where: whereClause });
        return res.status(200).json(servicos);
    } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        return res.status(500).json({ message: "Erro interno ao buscar serviços." });
    }
};

export const createService = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { nome, descricao, preco, duracao, ativo } = req.body;

        if (!nome || !preco || !duracao) {
            return res.status(400).json({ message: "Campos obrigatórios: nome, preco, duracao." });
        }

        const novoServico = await Servico.create({
            nome,
            descricao,
            preco,
            duracao,
            ativo: ativo !== undefined ? ativo : true, // Default: ativo
        });

        return res.status(201).json(novoServico);
    } catch (error) {
        console.error("Erro ao criar serviço:", error);
        return res.status(500).json({ message: "Erro interno ao criar serviço." });
    }
};

export const updateService = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, duracao, ativo } = req.body;

        const servico = await Servico.findByPk(id);

        if (!servico) {
            return res.status(404).json({ message: "Serviço não encontrado." });
        }

        servico.nome = nome !== undefined ? nome : servico.nome;
        servico.descricao = descricao !== undefined ? descricao : servico.descricao;
        servico.preco = preco !== undefined ? preco : servico.preco;
        servico.duracao = duracao !== undefined ? duracao : servico.duracao;
        servico.ativo = ativo !== undefined ? ativo : servico.ativo;

        await servico.save();

        return res.status(200).json(servico);
    } catch (error) {
        console.error("Erro ao atualizar serviço:", error);
        return res.status(500).json({ message: "Erro interno ao atualizar serviço." });
    }
};

export const deleteService = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        const servico = await Servico.findByPk(id);

        if (!servico) {
            return res.status(404).json({ message: "Serviço não encontrado." });
        }

        await servico.destroy();

        return res.status(200).json({ message: "Serviço deletado com sucesso.", id });
    } catch (error) {
        console.error("Erro ao deletar serviço:", error);
        return res.status(500).json({ message: "Erro interno ao deletar serviço." });
    }
};

export const toggleServiceStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        const servico = await Servico.findByPk(id);

        if (!servico) {
            return res.status(404).json({ message: "Serviço não encontrado." });
        }

        servico.ativo = !servico.ativo;
        await servico.save();

        return res.status(200).json({
            message: `Serviço ${servico.ativo ? 'ativado' : 'desativado'} com sucesso.`,
            servico
        });
    } catch (error) {
        console.error("Erro ao alternar status do serviço:", error);
        return res.status(500).json({ message: "Erro interno ao alternar status." });
    }
};

