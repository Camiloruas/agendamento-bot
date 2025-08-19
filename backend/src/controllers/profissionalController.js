import Profissional from "../models/Profissional.js";
import bcrypt from "bcrypt"; // Usaremos para criptografar a senha

const profissionalController = {
  // Função para criar um novo profissional
  async create(req, res) {
    try {
      const { nome, email, senha } = req.body;

      // Criptografar a senha antes de salvar no banco de dados
      const salt = await bcrypt.genSalt(10);
      const senhaCriptografada = await bcrypt.hash(senha, salt);

      const novoProfissional = await Profissional.create({
        nome,
        email,
        senha: senhaCriptografada,
      });

      // Retorna uma resposta de sucesso
      res.status(201).json(novoProfissional);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao criar profissional." });
    }
  },
};

export default profissionalController;
