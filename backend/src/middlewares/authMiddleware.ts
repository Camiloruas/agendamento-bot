import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// 1. Interface para o Payload do Token
interface TokenPayload extends JwtPayload {
    id: string;
    email: string;
}

// 2. Estende a interface Request do Express
export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
    // 1. Verificar o cabeçalho Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Acesso negado. Token não fornecido ou formato inválido." });
    }

    // 2. Extrair o Token (remove "Bearer ")
    // CORREÇÃO: Usamos o 'split' e garantimos que o token é uma string.
    const token = authHeader.split(" ")[1];

    // NOVIDADE: Verifica se o token existe DEPOIS do split, resolvendo o erro de tipagem no jwt.verify
    if (!token) {
        return res.status(401).json({ message: "Acesso negado. Token não encontrado após extração." });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;

        // 3. Verifica a chave secreta
        if (!jwtSecret) {
            // Este 'throw' é intencional para garantir que o catch seja acionado se a config sumir.
            throw new Error("Configuração de segurança incompleta: JWT_SECRET não encontrado.");
        }

        // 4. Verificar e decodificar o token
        // Usamos 'as unknown as TokenPayload' para resolver o erro complexo de tipagem do JWT.
        // O TS aceita 'token' e 'jwtSecret' aqui, pois garantimos que ambos são strings no escopo.
        const decoded = jwt.verify(token, jwtSecret) as unknown as TokenPayload;

        // 5. Adicionar o ID e Email do usuário à requisição
        const authReq = req as AuthRequest;
        authReq.userId = decoded.id;
        authReq.userEmail = decoded.email;

        // 6. Token válido, permite a continuação
        next();

    } catch (error) {
        // CORREÇÃO: Bloco catch completo para tratar o erro ts(7005) (implicit any)
        let errorMessage = 'Erro desconhecido de validação de token';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        console.error('Erro de validação de token:', errorMessage);

        // Retorna 401 para o cliente (mantido)
        return res.status(401).json({ message: "Token inválido ou expirado." });
    }
};