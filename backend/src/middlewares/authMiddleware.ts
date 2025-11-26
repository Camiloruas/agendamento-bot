import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * @interface TokenPayload
 * @description Define a estrutura esperada para o payload decodificado de um token JWT.
 * Garante que saibamos quais informações do usuário (`id` e `email`) estão contidas no token.
 */
interface TokenPayload extends JwtPayload {
    id: string;
    email: string;
}

/**
 * @interface AuthRequest
 * @description Estende a interface `Request` padrão do Express para incluir as propriedades
 * `userId` e `userEmail`. Isso permite que, após a validação do token, as informações
 * do usuário sejam anexadas ao objeto `req` e fiquem disponíveis para os próximos middlewares e controllers.
 */
export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
}

/**
 * @function protect
 * @description Middleware de autenticação para proteger rotas. Ele verifica a presença e a validade
 * de um token JWT no cabeçalho `Authorization`. Se o token for válido, as informações do usuário
 * são extraídas e anexadas à requisição. Caso contrário, o acesso é negado.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @param next Função para passar o controle para o próximo middleware na pilha.
 */
export const protect = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // A primeira verificação garante que o token foi enviado e segue o padrão "Bearer".
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Acesso negado. Token não fornecido ou formato inválido." });
    }

    // Extrai o token da string "Bearer <token>".
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Acesso negado. Token não encontrado após extração." });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;

        // É crucial que a chave secreta do JWT esteja configurada, caso contrário a validação é impossível.
        if (!jwtSecret) {
            throw new Error("Configuração de segurança incompleta: JWT_SECRET não encontrado.");
        }

        // `jwt.verify` decodifica o token e valida sua assinatura e data de expiração.
        // Se a verificação falhar (assinatura inválida, token expirado), ele lança um erro.
        const decoded = jwt.verify(token, jwtSecret) as unknown as TokenPayload;

        // Anexa os dados do usuário à requisição para uso posterior.
        const authReq = req as AuthRequest;
        authReq.userId = decoded.id;
        authReq.userEmail = decoded.email;

        // Se tudo estiver correto, permite que a requisição prossiga para o controller da rota.
        next();

    } catch (error) {
        // O bloco `catch` lida com quaisquer erros lançados por `jwt.verify`.
        let errorMessage = 'Erro desconhecido de validação de token';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        console.error('Erro de validação de token:', errorMessage);

        // Retorna um erro 401 para indicar que a autenticação falhou.
        return res.status(401).json({ message: "Token inválido ou expirado." });
    }
};