// backend/src/controllers/profissionalController.ts

import { Request, Response } from "express";
import Profissional from "../models/Profissional";
import ProfissionalInstance from "../models/Profissional";
import { DatabaseError } from "sequelize";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createProfissional = async (req: Request, res: Response): Promise<Response> => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({
      message: "Erro: Nome, email e senha são obrigatórios.",
    });
  }

  try {
    // Criação do Profissional
    const novoProfissional = (await Profissional.create({
      nome,
      email,
      senha,
    })) as ProfissionalInstance;

    // Retorna o objeto criado (excluindo a senha)
    const profissionalResponse = {
      id: novoProfissional.id,
      nome: novoProfissional.nome,
      email: novoProfissional.email,
      createdAt: novoProfissional.createdAt,
      updatedAt: novoProfissional.updatedAt,
    };

    return res.status(201).json(profissionalResponse);
  } catch (error) {
    const dbError = error as DatabaseError;

    if (dbError.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Erro: O email fornecido já está em uso.",
        details: dbError.message,
      });
    }

    console.error("Erro ao criar profissional:", dbError);
    return res.status(500).json({
      message: "Erro interno ao processar a requisição.",
      details: dbError.message,
    });
  }
};

export const loginProfissional = async (req: Request, res: Response): Promise<Response> => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      message: "Email e senha são obrigatórios.",
    });
  }

  try {
    let profissional = await Profissional.findOne({ where: { email } });

    if (!profissional) {
      return res.status(401).json({
        message: "Credenciais inválidas.",
      });
    }

    const profInstance = profissional as ProfissionalInstance;
    const isPasswordValid = await bcrypt.compare(senha, profInstance.senha);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Credenciais inválidas.",
      });
    }

    // --- Geração do Token JWT ---
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET não configurado no ambiente.");
    }

    const tokenPayload = {
      id: profInstance.id,
      email: profInstance.email,
    };

    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: "60d",
    });

    return res.status(200).json({
      message: "Login bem-sucedido.",
      token: token,
      profissional: {
        id: profInstance.id,
        nome: profInstance.nome,
        email: profInstance.email,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
};

// --- NOVIDADE: FUNÇÃO getAllProfissionais ADICIONADA E EXPORTADA ---
export const getAllProfissionais = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Busca todos os profissionais, excluindo a senha por segurança
    const profissionais = await Profissional.findAll({
      attributes: ["id", "nome", "email", "createdAt", "updatedAt"],
    });

    return res.status(200).json(profissionais);
  } catch (error) {
    console.error("Erro ao listar profissionais:", error);
    return res.status(500).json({
      message: "Erro interno do servidor ao listar profissionais.",
    });
  }
};
