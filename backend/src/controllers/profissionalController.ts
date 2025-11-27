import { Request, Response } from "express";
import Profissional from "../models/Profissional";
import ProfissionalInstance from "../models/Profissional";
import { DatabaseError } from "sequelize";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/authMiddleware";
import { getClienteByTelefone } from "./clienteController";

/**
 * @function createProfissional
 * @description Registra um novo profissional no sistema.
 * A senha é automaticamente criptografada antes de ser salva, graças ao `hook` no modelo.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns Retorna o objeto do profissional criado (sem a senha).
 */
export const createProfissional = async (req: Request, res: Response): Promise<Response> => {
  const { nome, email, senha, telefone } = req.body;

  if (!nome || !email || !senha || !telefone) {
    return res.status(400).json({
      message: "Erro: Nome, email, telefone e senha são obrigatórios.",
    });
  }

  try {
    const novoProfissional = (await Profissional.create({
      nome,
      email,
      senha,
      telefone,
    })) as Profissional;

    // A resposta omite a senha para seguir as melhores práticas de segurança.
    const profissionalResponse = {
      id: novoProfissional.id,
      nome: novoProfissional.nome,
      email: novoProfissional.email,
      telefone: novoProfissional.telefone,
      createdAt: novoProfissional.createdAt,
      updatedAt: novoProfissional.updatedAt,
    };

    return res.status(201).json(profissionalResponse);
  } catch (error) {
    const dbError = error as DatabaseError;

    // Trata especificamente o erro de violação de constraint de unicidade (email duplicado).
    if (dbError.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Erro: O email OU telefone fornecido já está em uso.",
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

/**
 * @function loginProfissional
 * @description Autentica um profissional e retorna um token JWT para acesso a rotas protegidas.
 * Este token é essencial para que o bot-service possa fazer requisições em nome do profissional.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns Um token JWT e informações básicas do profissional.
 */
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

    const profInstance = profissional as Profissional;
    // Compara a senha fornecida com o hash armazenado no banco de dados.
    const isPasswordValid = await bcrypt.compare(senha, profInstance.senha);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Credenciais inválidas.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET não configurado no ambiente.");
    }

    // O payload do token contém informações que podem ser usadas para identificar o usuário em requisições futuras.
    const tokenPayload = {
      id: profInstance.id,
      email: profInstance.email,
    };

    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: "60d", // O token terá uma validade longa, adequada para um serviço de backend.
    });

    return res.status(200).json({
      message: "Login bem-sucedido.",
      token: token,
      profissional: {
        id: profInstance.id,
        nome: profInstance.nome,
        email: profInstance.email,
        telefone: profInstance.telefone,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
};

/**
 * @function getAllProfissionais
 * @description Retorna uma lista de todos os profissionais cadastrados, excluindo suas senhas.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns Uma lista de profissionais.
 */
export const getAllProfissionais = async (req: Request, res: Response): Promise<Response> => {
  try {
    const profissionais = await Profissional.findAll({
      attributes: ["id", "nome", "email", "telefone", "createdAt", "updatedAt"],
    });

    return res.status(200).json(profissionais);
  } catch (error) {
    console.error("Erro ao listar profissionais:", error);
    return res.status(500).json({
      message: "Erro interno do servidor ao listar profissionais.",
    });
  }
};

/**
 * @function getProfissionalProfile
 * @description Busca e retorna o perfil do profissional que está autenticado (cujos dados estão no token).
 * @param req Objeto de requisição do Express, que deve ser um AuthRequest contendo `userId`.
 * @param res Objeto de resposta do Express.
 * @returns O perfil do profissional (sem a senha).
 */
export const getProfissionalProfile = async (req: Request, res: Response): Promise<Response> => {
  const authReq = req as AuthRequest;
  const profissionalId = authReq.userId;

  try {
    const profissional = await Profissional.findByPk(profissionalId, {
      attributes: { exclude: ["senha"] },
    });

    if (!profissional) {
      return res.status(404).json({ message: "Perfil do profissional não encontrado." });
    }

    return res.status(200).json(profissional);
  } catch (error) {
    console.error("Erro ao buscar perfil do profissional:", error);
    return res.status(500).json({ message: "Erro interno ao buscar o perfil." });
  }
};
