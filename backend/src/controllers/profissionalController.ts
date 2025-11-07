// backend/src/controllers/profissionalController.ts

import { Request, Response } from "express";
// Removendo o .js no import: Tenta resolver o problema de tipagem no VS Code.
import Profissional, { ProfissionalInstance } from "../models/Profissional";
import { DatabaseError } from "sequelize";

export const createProfissional = async (req: Request, res: Response): Promise<Response> => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({
      message: "Erro: Nome, email e senha são obrigatórios.",
    });
  }

  try {
    // 3. Criação do Profissional

    // CORREÇÃO FINAL: Usamos a asserção 'as ProfissionalInstance' no resultado da função
    const novoProfissional = (await Profissional.create({
      nome,
      email,
      senha,
    })) as ProfissionalInstance; // <--- Asserção de Tipo no resultado

    // 4. Retorna o objeto criado
    const profissionalResponse = {
      // O TypeScript agora não deve mais reclamar destas propriedades
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
