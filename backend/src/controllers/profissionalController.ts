// backend/src/controllers/profissionalController.ts

import { Request, Response } from "express";
// Removendo o .js no import: Tenta resolver o problema de tipagem no VS Code.
import Profissional, { ProfissionalInstance } from "../models/Profissional";
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

export const loginProfissional = async (req: Request, res: Response): Promise<Response> => {
  // 1. RESOLUÇÃO DO ERRO 1: Garante que email e senha estão no escopo
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      message: "Email e senha são obrigatórios.",
    });
  }

  try {
    // 2. Buscar Profissional pelo Email
    let profissional = await Profissional.findOne({ where: { email } });

    if (!profissional) {
      return res.status(401).json({
        message: "Credenciais inválidas.",
      });
    }

    // ASSERÇÃO DE TIPO: Resolve o erro de Property 'email' does not exist
    const profInstance = profissional as ProfissionalInstance;

    // 3. Comparar Senha (Texto Puro vs. Hash do DB)
    const isPasswordValid = await bcrypt.compare(senha, profInstance.senha);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Credenciais inválidas.",
      });
    }

    // --- Geração do Token JWT ---
    const jwtSecret = process.env.JWT_SECRET;

    // RESOLUÇÃO DO ERRO 2: Verifica a chave secreta antes de assinar
    if (!jwtSecret) {
      throw new Error("JWT_SECRET não configurado no ambiente.");
    }

    // Carga útil do token (payload)
    const tokenPayload = {
      id: profInstance.id,
      email: profInstance.email,
    };

    // Gerar e assinar o token
    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: "1h",
    });

    // Resposta de sucesso (retorna o token)
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
    // RESOLUÇÃO DO ERRO 3: O catch garante o retorno
    console.error("Erro no login:", error);
    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
};
