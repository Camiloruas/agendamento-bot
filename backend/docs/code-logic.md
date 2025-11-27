# Lógica do Código do Backend
Este arquivo compila a lógica de todos os arquivos do diretório `backend/src`.
## `backend/src/server.ts`
```typescript
import * as dotenv from "dotenv";
dotenv.config();
import express, { Express, Request, Response } from "express";
import profissionalRoutes from "./routes/profissionalRoutes";
import agendamentoRoutes from "./routes/agendamentoRoutes";
import clienteRoutes from "./routes/clienteRoutes";
import horarioRoutes from "./routes/horarioRoutes";
import sequelize, { testConnection } from "./database/connection";
import Profissional from "./models/Profissional";
import Agendamento from "./models/Agendamento";
import Cliente from "./models/Cliente";
import HorarioProfissional from "./models/HorarioProfissional";
interface ISequelizeModel {
initialize: (sequelize: any) => void;
associate?: (models: any) => void;
}
const PORT: number = parseInt(process.env.APP_PORT || "3001", 10);
const app: Express = express();
app.use(express.json());
app.use("/api/profissionais", profissionalRoutes);
app.use("/api/agendamentos", agendamentoRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/horarios", horarioRoutes);
app.get("/", (req: Request, res: Response) => {
res.send("API do Agendamento Bot rodando com TypeScript!");
});
async function startServer() {
const models = { Profissional, Cliente, Agendamento, HorarioProfissional };
for (const model of Object.values(models)) {
model.initialize(sequelize);
}
for (const model of Object.values(models)) {
if (typeof model.associate === "function") {
model.associate(models);
}
}
await testConnection();
await sequelize.sync({ alter: true });
console.log("[DB] Banco de dados sincronizado com sucesso!");
app.listen(PORT, () => {
console.log(`[Server] Servidor rodando em http://localhost:${PORT}`);
});
}
startServer();
```
import { Response } from "express";
import { DatabaseError, Op } from "sequelize";
import { AuthRequest } from "../middlewares/authMiddleware";
import Agendamento from "../models/Agendamento";
import Profissional from "../models/Profissional";
import Cliente from "../models/Cliente";
import HorarioProfissional from "../models/HorarioProfissional";
import moment from 'moment';
export const createAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { dataHora, descricao, clienteId, servico } = req.body;
if (!dataHora || !clienteId || !servico) {
return res.status(400).json({
message: "Erro: A data, hora, ID do cliente e o serviço são obrigatórios.",
});
}
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
try {
const cliente = await Cliente.findByPk(clienteId);
if (!cliente) {
return res.status(404).json({ message: "Cliente não encontrado." });
}
const profissional = await Profissional.findByPk(profissionalId);
if (!profissional) {
return res.status(404).json({ message: "Profissional não encontrado." });
}
const existingAppointment = await Agendamento.findOne({
where: {
profissionalId: profissionalId,
dataHora: dataHora,
status: {
[Op.ne]: 'Cancelado'
}
}
});
if (existingAppointment) {
return res.status(409).json({
message: "Conflito de agendamento. O horário solicitado já está ocupado.",
});
}
const novoAgendamento = await Agendamento.create({
dataHora,
descricao: descricao || "Agendamento padrão",
profissionalId,
clienteId,
servico,
status: 'Pendente',
});
return res.status(201).json({
message: "Agendamento criado com sucesso.",
agendamento: {
id: novoAgendamento.id,
dataHora: novoAgendamento.dataHora,
descricao: novoAgendamento.descricao,
profissionalId: novoAgendamento.profissionalId,
clienteId: novoAgendamento.clienteId,
servico: novoAgendamento.servico,
status: novoAgendamento.status,
},
});
} catch (error) {
const dbError = error as DatabaseError;
console.error("Erro ao criar agendamento:", dbError);
return res.status(500).json({
message: "Erro interno ao processar a requisição.",
details: dbError.message,
});
}
};
export const getAllAgendamentos = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
try {
const agendamentos = await Agendamento.findAll({
where: {
profissionalId: profissionalId,
},
include: [ // Eager loading para trazer dados relacionados e evitar N+1 queries.
{ model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
{ model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
],
order: [["dataHora", "ASC"]], // Ordena para uma visualização cronológica.
});
return res.status(200).json(agendamentos);
} catch (error) {
console.error("Erro ao listar agendamentos:", error);
return res.status(500).json({
message: "Erro interno do servidor ao listar agendamentos.",
});
}
};
export const getAgendamentoById = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { id } = req.params;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
try {
const agendamento = await Agendamento.findOne({
where: {
id: id,
profissionalId: profissionalId, // Cláusula de segurança para garantir o pertencimento.
},
include: [
{ model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
{ model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
],
});
if (!agendamento) {
return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
}
return res.status(200).json(agendamento);
} catch (error) {
console.error("Erro ao buscar agendamento:", error);
return res.status(500).json({ message: "Erro interno ao buscar agendamento." });
}
};
export const deleteAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { id } = req.params;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
try {
const result = await Agendamento.destroy({
where: {
id: id,
profissionalId: profissionalId,
},
});
if (result === 0) {
return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
}
return res.status(204).send();
} catch (error) {
console.error("Erro ao deletar agendamento:", error);
return res.status(500).json({ message: "Erro interno ao deletar agendamento." });
}
};
export const updateAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { id } = req.params;
const { dataHora, descricao, servico, status } = req.body;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!dataHora && !descricao && !servico && !status) {
return res.status(400).json({ message: "Pelo menos um campo deve ser fornecido para atualizar." });
}
try {
const [updatedRowsCount] = await Agendamento.update(
{ dataHora, descricao, servico, status },
{
where: {
id: id,
profissionalId: profissionalId,
},
}
);
if (updatedRowsCount === 0) {
return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
}
const agendamentoAtualizado = await Agendamento.findByPk(id, {
include: [
{ model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
{ model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
],
});
return res.status(200).json({
message: "Agendamento atualizado com sucesso.",
agendamento: agendamentoAtualizado,
});
} catch (error) {
console.error("Erro ao atualizar agendamento:", error);
return res.status(500).json({ message: "Erro interno ao atualizar agendamento." });
}
};
export const getAvailableSlots = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { date } = req.query;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!date || typeof date !== 'string' || !moment(date, 'YYYY-MM-DD', true).isValid()) {
return res.status(400).json({ message: "A data é obrigatória e deve estar no formato YYYY-MM-DD." });
}
try {
const selectedDate = moment.utc(date as string);
const dayOfWeek = selectedDate.day();
const horarioConfig = await HorarioProfissional.findOne({
where: {
profissionalId: profissionalId,
diaDaSemana: dayOfWeek,
ativo: true,
},
});
if (!horarioConfig) {
return res.status(200).json([]); // Se não trabalha no dia, retorna lista vazia.
}
const startOfDay = selectedDate.clone().startOf('day').toDate();
const endOfDay = selectedDate.clone().endOf('day').toDate();
const existingAppointments = await Agendamento.findAll({
where: {
profissionalId: profissionalId,
dataHora: {
[Op.between]: [startOfDay, endOfDay],
},
status: {
[Op.ne]: 'Cancelado',
},
},
attributes: ['dataHora'],
});
const bookedTimes = new Set(existingAppointments.map(app => moment.utc(app.dataHora).format('HH:mm')));
const allSlots: { time: string, status: 'disponivel' | 'ocupado' }[] = [];
const currentTime = moment.utc(`${date} ${horarioConfig.horarioInicio}`, 'YYYY-MM-DD HH:mm');
const endTime = moment.utc(`${date} ${horarioConfig.horarioFim}`, 'YYYY-MM-DD HH:mm');
const lunchStart = horarioConfig.almocoInicio ? moment.utc(`${date} ${horarioConfig.almocoInicio}`, 'YYYY-MM-DD HH:mm') : null;
const lunchEnd = horarioConfig.almocoFim ? moment.utc(`${date} ${horarioConfig.almocoFim}`, 'YYYY-MM-DD HH:mm') : null;
while (currentTime.isBefore(endTime)) {
if (lunchStart && lunchEnd && currentTime.isBetween(lunchStart, lunchEnd, null, '[)')) {
currentTime = lunchEnd.clone();
continue;
}
const slotTime = currentTime.format('HH:mm');
const status = bookedTimes.has(slotTime) ? 'ocupado' : 'disponivel';
allSlots.push({ time: slotTime, status: status });
currentTime.add(1, 'hour'); // Avança para o próximo slot (assumindo duração de 1h).
}
return res.status(200).json(allSlots);
} catch (error) {
console.error("Erro ao buscar horários disponíveis:", error);
return res.status(500).json({ message: "Erro interno ao buscar horários disponíveis." });
}
};
export const getAgendamentosByCliente = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { clienteId } = req.params;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!clienteId) {
return res.status(400).json({ message: "O ID do cliente é obrigatório." });
}
try {
const agendamentos = await Agendamento.findAll({
where: {
clienteId: clienteId,
profissionalId: profissionalId,
},
include: [
{ model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
{ model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
],
order: [["dataHora", "ASC"]],
});
return res.status(200).json(agendamentos);
} catch (error) {
console.error("Erro ao buscar agendamentos por cliente:", error);
return res.status(500).json({ message: "Erro interno ao buscar agendamentos do cliente." });
}
};
export const getAgendamentosByDate = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { date } = req.query;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!date || typeof date !== 'string' || !moment(date, 'YYYY-MM-DD', true).isValid()) {
return res.status(400).json({ message: "A data é obrigatória e deve estar no formato YYYY-MM-DD." });
}
try {
const selectedDate = moment.utc(date as string);
const startOfDay = selectedDate.clone().startOf('day').toDate();
const endOfDay = selectedDate.clone().endOf('day').toDate();
const agendamentos = await Agendamento.findAll({
where: {
profissionalId: profissionalId,
dataHora: {
[Op.between]: [startOfDay, endOfDay],
},
},
include: [
{ model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
{ model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
],
order: [["dataHora", "ASC"]],
});
if (agendamentos.length === 0) {
return res.status(404).json({ message: "Nenhum agendamento encontrado para esta data." });
}
return res.status(200).json(agendamentos);
} catch (error) {
console.error("Erro ao buscar agendamentos por data:", error);
return res.status(500).json({ message: "Erro interno ao buscar agendamentos por data." });
}
};
export const hasActiveAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { clienteId } = req.params;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!clienteId) {
return res.status(400).json({ message: "O ID do cliente é obrigatório." });
}
try {
const now = moment().toDate();
const activeAgendamento = await Agendamento.findOne({
where: {
clienteId: clienteId,
profissionalId: profissionalId,
status: {
[Op.in]: ['Pendente', 'Confirmado'], // Apenas status que representam um agendamento válido.
},
dataHora: {
[Op.gte]: now, // Apenas agendamentos que ainda não ocorreram.
},
},
});
return res.status(200).json({ hasActive: !!activeAgendamento });
} catch (error) {
console.error("Erro ao verificar agendamento ativo:", error);
return res.status(500).json({ message: "Erro interno ao verificar agendamento ativo." });
}
};
## `backend/src/controllers/agendamentoController.ts`
```typescript
import { Response } from "express";
import { DatabaseError, Op } from "sequelize";
import { AuthRequest } from "../middlewares/authMiddleware";
import Agendamento from "../models/Agendamento";
import Profissional from "../models/Profissional";
import Cliente from "../models/Cliente";
import HorarioProfissional from "../models/HorarioProfissional";
import moment from 'moment';
export const createAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { dataHora, descricao, clienteId, servico } = req.body;
if (!dataHora || !clienteId || !servico) {
return res.status(400).json({
message: "Erro: A data, hora, ID do cliente e o serviço são obrigatórios.",
});
}
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
try {
const cliente = await Cliente.findByPk(clienteId);
if (!cliente) {
return res.status(404).json({ message: "Cliente não encontrado." });
}
const profissional = await Profissional.findByPk(profissionalId);
if (!profissional) {
return res.status(404).json({ message: "Profissional não encontrado." });
}
const existingAppointment = await Agendamento.findOne({
where: {
profissionalId: profissionalId,
dataHora: dataHora,
status: {
[Op.ne]: 'Cancelado'
}
}
});
if (existingAppointment) {
return res.status(409).json({
message: "Conflito de agendamento. O horário solicitado já está ocupado.",
});
}
const novoAgendamento = await Agendamento.create({
dataHora,
descricao: descricao || "Agendamento padrão",
profissionalId,
clienteId,
servico,
status: 'Pendente',
});
return res.status(201).json({
message: "Agendamento criado com sucesso.",
agendamento: {
id: novoAgendamento.id,
dataHora: novoAgendamento.dataHora,
descricao: novoAgendamento.descricao,
profissionalId: novoAgendamento.profissionalId,
clienteId: novoAgendamento.clienteId,
servico: novoAgendamento.servico,
status: novoAgendamento.status,
},
});
} catch (error) {
const dbError = error as DatabaseError;
console.error("Erro ao criar agendamento:", dbError);
return res.status(500).json({
message: "Erro interno ao processar a requisição.",
details: dbError.message,
});
}
};
export const getAllAgendamentos = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
try {
const agendamentos = await Agendamento.findAll({
where: {
profissionalId: profissionalId,
},
include: [ // Eager loading para trazer dados relacionados e evitar N+1 queries.
{ model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
{ model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
],
order: [["dataHora", "ASC"]], // Ordena para uma visualização cronológica.
});
return res.status(200).json(agendamentos);
} catch (error) {
console.error("Erro ao listar agendamentos:", error);
return res.status(500).json({
message: "Erro interno do servidor ao listar agendamentos.",
});
}
};
export const getAgendamentoById = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { id } = req.params;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
try {
const agendamento = await Agendamento.findOne({
where: {
id: id,
profissionalId: profissionalId, // Cláusula de segurança para garantir o pertencimento.
},
include: [
{ model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
{ model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
],
});
if (!agendamento) {
return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
}
return res.status(200).json(agendamento);
} catch (error) {
console.error("Erro ao buscar agendamento:", error);
return res.status(500).json({ message: "Erro interno ao buscar agendamento." });
}
};
export const deleteAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { id } = req.params;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
try {
const result = await Agendamento.destroy({
where: {
id: id,
profissionalId: profissionalId,
},
});
if (result === 0) {
return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
}
return res.status(204).send();
} catch (error) {
console.error("Erro ao deletar agendamento:", error);
return res.status(500).json({ message: "Erro interno ao deletar agendamento." });
}
};
export const updateAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { id } = req.params;
const { dataHora, descricao, servico, status } = req.body;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!dataHora && !descricao && !servico && !status) {
return res.status(400).json({ message: "Pelo menos um campo deve ser fornecido para atualizar." });
}
try {
const [updatedRowsCount] = await Agendamento.update(
{ dataHora, descricao, servico, status },
{
where: {
id: id,
profissionalId: profissionalId,
},
}
);
if (updatedRowsCount === 0) {
return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
}
const agendamentoAtualizado = await Agendamento.findByPk(id, {
include: [
{ model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
{ model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
],
});
return res.status(200).json({
message: "Agendamento atualizado com sucesso.",
agendamento: agendamentoAtualizado,
});
} catch (error) {
console.error("Erro ao atualizar agendamento:", error);
return res.status(500).json({ message: "Erro interno ao atualizar agendamento." });
}
};
export const getAvailableSlots = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { date } = req.query;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!date || typeof date !== 'string' || !moment(date, 'YYYY-MM-DD', true).isValid()) {
return res.status(400).json({ message: "A data é obrigatória e deve estar no formato YYYY-MM-DD." });
}
try {
const selectedDate = moment.utc(date as string);
const dayOfWeek = selectedDate.day();
const horarioConfig = await HorarioProfissional.findOne({
where: {
profissionalId: profissionalId,
diaDaSemana: dayOfWeek,
ativo: true,
},
});
if (!horarioConfig) {
return res.status(200).json([]); // Se não trabalha no dia, retorna lista vazia.
}
const startOfDay = selectedDate.clone().startOf('day').toDate();
const endOfDay = selectedDate.clone().endOf('day').toDate();
const existingAppointments = await Agendamento.findAll({
where: {
profissionalId: profissionalId,
dataHora: {
[Op.between]: [startOfDay, endOfDay],
},
status: {
[Op.ne]: 'Cancelado',
},
},
attributes: ['dataHora'],
});
const bookedTimes = new Set(existingAppointments.map(app => moment.utc(app.dataHora).format('HH:mm')));
const allSlots: { time: string, status: 'disponivel' | 'ocupado' }[] = [];
const currentTime = moment.utc(`${date} ${horarioConfig.horarioInicio}`, 'YYYY-MM-DD HH:mm');
const endTime = moment.utc(`${date} ${horarioConfig.horarioFim}`, 'YYYY-MM-DD HH:mm');
const lunchStart = horarioConfig.almocoInicio ? moment.utc(`${date} ${horarioConfig.almocoInicio}`, 'YYYY-MM-DD HH:mm') : null;
const lunchEnd = horarioConfig.almocoFim ? moment.utc(`${date} ${horarioConfig.almocoFim}`, 'YYYY-MM-DD HH:mm') : null;
while (currentTime.isBefore(endTime)) {
if (lunchStart && lunchEnd && currentTime.isBetween(lunchStart, lunchEnd, null, '[)')) {
currentTime = lunchEnd.clone();
continue;
}
const slotTime = currentTime.format('HH:mm');
const status = bookedTimes.has(slotTime) ? 'ocupado' : 'disponivel';
allSlots.push({ time: slotTime, status: status });
currentTime.add(1, 'hour'); // Avança para o próximo slot (assumindo duração de 1h).
}
return res.status(200).json(allSlots);
} catch (error) {
console.error("Erro ao buscar horários disponíveis:", error);
return res.status(500).json({ message: "Erro interno ao buscar horários disponíveis." });
}
};
export const getAgendamentosByCliente = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { clienteId } = req.params;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!clienteId) {
return res.status(400).json({ message: "O ID do cliente é obrigatório." });
}
try {
const agendamentos = await Agendamento.findAll({
where: {
clienteId: clienteId,
profissionalId: profissionalId,
},
include: [
{ model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
{ model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
],
order: [["dataHora", "ASC"]],
});
return res.status(200).json(agendamentos);
} catch (error) {
console.error("Erro ao buscar agendamentos por cliente:", error);
return res.status(500).json({ message: "Erro interno ao buscar agendamentos do cliente." });
}
};
export const getAgendamentosByDate = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { date } = req.query;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!date || typeof date !== 'string' || !moment(date, 'YYYY-MM-DD', true).isValid()) {
return res.status(400).json({ message: "A data é obrigatória e deve estar no formato YYYY-MM-DD." });
}
try {
const selectedDate = moment.utc(date as string);
const startOfDay = selectedDate.clone().startOf('day').toDate();
const endOfDay = selectedDate.clone().endOf('day').toDate();
const agendamentos = await Agendamento.findAll({
where: {
profissionalId: profissionalId,
dataHora: {
[Op.between]: [startOfDay, endOfDay],
},
},
include: [
{ model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
{ model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
],
order: [["dataHora", "ASC"]],
});
if (agendamentos.length === 0) {
return res.status(404).json({ message: "Nenhum agendamento encontrado para esta data." });
}
return res.status(200).json(agendamentos);
} catch (error) {
console.error("Erro ao buscar agendamentos por data:", error);
return res.status(500).json({ message: "Erro interno ao buscar agendamentos por data." });
}
};
export const hasActiveAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const { clienteId } = req.params;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!clienteId) {
return res.status(400).json({ message: "O ID do cliente é obrigatório." });
}
try {
const now = moment().toDate();
const activeAgendamento = await Agendamento.findOne({
where: {
clienteId: clienteId,
profissionalId: profissionalId,
status: {
[Op.in]: ['Pendente', 'Confirmado'], // Apenas status que representam um agendamento válido.
},
dataHora: {
[Op.gte]: now, // Apenas agendamentos que ainda não ocorreram.
},
},
});
return res.status(200).json({ hasActive: !!activeAgendamento });
} catch (error) {
console.error("Erro ao verificar agendamento ativo:", error);
return res.status(500).json({ message: "Erro interno ao verificar agendamento ativo." });
}
};
## `backend/src/controllers/clienteController.ts`
```typescript
import { Request, Response } from 'express';
import Cliente from '../models/Cliente';
import Agendamento from '../models/Agendamento';
export const getClienteByTelefone = async (req: Request, res: Response): Promise<Response> => {
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
export const createCliente = async (req: Request, res: Response): Promise<Response> => {
const { nome, telefone } = req.body;
if (!nome || !telefone) {
return res.status(400).json({ message: "Nome e Telefone são obrigatórios." });
}
try {
const clienteExistente = await Cliente.findOne({ where: { telefone } });
if (clienteExistente) {
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
export const getAllClientes = async (req: Request, res: Response): Promise<Response> => {
try {
const clientes = await Cliente.findAll({
attributes: ['id', 'nome', 'telefone', 'createdAt', 'updatedAt']
});
return res.status(200).json(clientes);
} catch (error) {
console.error("Erro ao buscar todos os clientes:", error);
return res.status(500).json({ message: "Erro interno ao buscar clientes." });
}
};
export const getClienteById = async (req: Request, res: Response): Promise<Response> => {
const { id } = req.params;
try {
const cliente = await Cliente.findByPk(id, {
include: [{ // Inclui agendamentos para fornecer uma visão completa do histórico do cliente.
model: Agendamento,
as: 'agendamentos'
}]
});
if (!cliente) {
return res.status(404).json({ message: "Cliente não encontrado." });
}
return res.status(200).json(cliente);
} catch (error) {
console.error("Erro ao buscar cliente por ID:", error);
return res.status(500).json({ message: "Erro interno ao buscar cliente." });
}
};
export const updateCliente = async (req: Request, res: Response): Promise<Response> => {
const { id } = req.params;
const { nome, telefone } = req.body;
try {
const cliente = await Cliente.findByPk(id);
if (!cliente) {
return res.status(404).json({ message: "Cliente não encontrado." });
}
cliente.nome = nome || cliente.nome;
cliente.telefone = telefone || cliente.telefone;
await cliente.save();
return res.status(200).json({ message: "Cliente atualizado com sucesso.", cliente });
} catch (error) {
console.error("Erro ao atualizar cliente:", error);
return res.status(500).json({ message: "Erro interno ao atualizar cliente." });
}
};
export const deleteCliente = async (req: Request, res: Response): Promise<Response> => {
const { id } = req.params;
try {
const cliente = await Cliente.findByPk(id);
if (!cliente) {
return res.status(404).json({ message: "Cliente não encontrado." });
}
await cliente.destroy();
return res.status(200).json({ message: "Cliente deletado com sucesso." });
} catch (error) {
console.error("Erro ao deletar cliente:", error);
return res.status(500).json({ message: "Erro interno ao deletar cliente." });
}
};
```
## `backend/src/controllers/horarioController.ts`
```typescript
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../middlewares/authMiddleware';
import HorarioProfissional from '../models/HorarioProfissional';
import Agendamento from '../models/Agendamento';
import { HorarioProfissionalAttributes } from '../models/HorarioProfissional';
import moment from 'moment-timezone';
export const getHorarios = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
try {
const horarios = await HorarioProfissional.findAll({
where: { profissionalId: profissionalId },
order: [['diaDaSemana', 'ASC']],
});
return res.status(200).json(horarios);
} catch (error) {
console.error("Erro ao buscar horários:", error);
return res.status(500).json({ message: "Erro interno ao buscar horários." });
}
};
export const createOrUpdateHorarios = async (req: AuthRequest, res: Response): Promise<Response> => {
const profissionalId = req.userId;
const horarios: HorarioProfissionalAttributes[] = req.body;
if (!profissionalId) {
return res.status(401).json({ message: "Profissional não autenticado." });
}
if (!Array.isArray(horarios) || horarios.length === 0) {
return res.status(400).json({ message: "O corpo da requisição deve ser um array de horários." });
}
try {
const resultados = [];
for (const horario of horarios) {
if (horario.diaDaSemana === undefined || horario.ativo === undefined || !horario.horarioInicio || !horario.horarioFim) {
return res.status(400).json({ message: `Horário inválido para o dia ${horario.diaDaSemana}. Campos obrigatórios faltando.` });
}
const [resultado, criado] = await HorarioProfissional.upsert({
...horario,
profissionalId: profissionalId,
});
resultados.push(resultado);
}
return res.status(200).json({
message: "Horários atualizados com sucesso.",
data: resultados,
});
} catch (error) {
console.error("Erro ao criar ou atualizar horários:", error);
return res.status(500).json({ message: "Erro interno ao processar horários." });
}
};
export const getDiasDisponiveis = async (req: Request, res: Response): Promise<Response> => {
const { profissionalId } = req.params;
try {
const diasDeTrabalho = await HorarioProfissional.findAll({
where: { profissionalId, ativo: true },
attributes: ['diaDaSemana'],
});
if (!diasDeTrabalho.length) {
return res.status(200).json([]);
}
const diasDeTrabalhoSet = new Set(diasDeTrabalho.map(d => d.diaDaSemana));
const datasDisponiveis = [];
const hoje = new Date();
hoje.setHours(0, 0, 0, 0);
for (let i = 0; i < 30; i++) {
const data = new Date(hoje);
data.setDate(data.getDate() + i);
const diaDaSemana = data.getDay();
if (diasDeTrabalhoSet.has(diaDaSemana)) {
datasDisponiveis.push(data.toISOString().split('T')[0]);
}
}
return res.status(200).json(datasDisponiveis);
} catch (error) {
console.error("Erro ao buscar dias disponíveis:", error);
return res.status(500).json({ message: "Erro interno ao buscar dias disponíveis." });
}
};
export const getHorariosDisponiveis = async (req: Request, res: Response): Promise<Response> => {
const { profissionalId, date } = req.params;
if (!profissionalId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(profissionalId)) {
return res.status(400).json({ message: "ID do profissional inválido." });
}
const TIMEZONE = 'America/Sao_Paulo'; // É crucial definir um fuso horário para consistência.
try {
const selectedDate = moment.utc(date as string);
const dayOfWeek = selectedDate.day();
const horarioConfig = await HorarioProfissional.findOne({
where: { profissionalId, diaDaSemana: dayOfWeek, ativo: true },
});
if (!horarioConfig) {
return res.status(200).json([]);
}
const startOfDayInTimezone = moment.tz(date as string, TIMEZONE).startOf('day');
const endOfDayInTimezone = moment.tz(date as string, TIMEZONE).endOf('day');
const existingAppointments = await Agendamento.findAll({
where: {
profissionalId: profissionalId,
dataHora: {
[Op.between]: [startOfDayInTimezone.clone().utc().toDate(), endOfDayInTimezone.clone().utc().toDate()],
},
status: {
[Op.ne]: 'Cancelado',
},
},
attributes: ['dataHora'],
});
const bookedTimes = new Set(existingAppointments.map(app => moment.tz(app.dataHora, TIMEZONE).format('HH:mm')));
const allSlots: { time: string, status: 'disponivel' | 'ocupado' }[] = [];
const currentTime = moment.tz(`${date} ${horarioConfig.horarioInicio}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
const endTime = moment.tz(`${date} ${horarioConfig.horarioFim}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
const lunchStart = horarioConfig.almocoInicio ? moment.tz(`${date} ${horarioConfig.almocoInicio}`, 'YYYY-MM-DD HH:mm', TIMEZONE) : null;
const lunchEnd = horarioConfig.almocoFim ? moment.tz(`${date} ${horarioConfig.almocoFim}`, 'YYYY-MM-DD HH:mm', TIMEZONE) : null;
while (currentTime.isBefore(endTime)) {
if (lunchStart && lunchEnd && currentTime.isBetween(lunchStart, lunchEnd, null, '[)')) {
currentTime.add(1, 'hour');
continue;
}
const slotTime = currentTime.format('HH:mm');
const status = bookedTimes.has(slotTime) ? 'ocupado' : 'disponivel';
allSlots.push({ time: slotTime, status: status });
currentTime.add(1, 'hour'); // Avança para o próximo slot.
}
return res.status(200).json(allSlots);
} catch (error) {
console.error("Erro ao buscar horários disponíveis:", error);
return res.status(500).json({ message: "Erro interno ao buscar horários disponíveis.", details: (error as Error).message });
}
};
```
## `backend/src/controllers/profissionalController.ts`
```typescript
import { Request, Response } from "express";
import Profissional from "../models/Profissional";
import ProfissionalInstance from "../models/Profissional";
import { DatabaseError } from "sequelize";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/authMiddleware";
export const createProfissional = async (req: Request, res: Response): Promise<Response> => {
const { nome, email, senha } = req.body;
if (!nome || !email || !senha) {
return res.status(400).json({
message: "Erro: Nome, email e senha são obrigatórios.",
});
}
try {
const novoProfissional = (await Profissional.create({
nome,
email,
senha,
})) as ProfissionalInstance;
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
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
throw new Error("JWT_SECRET não configurado no ambiente.");
}
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
},
});
} catch (error) {
console.error("Erro no login:", error);
return res.status(500).json({
message: "Erro interno do servidor.",
});
}
};
export const getAllProfissionais = async (req: Request, res: Response): Promise<Response> => {
try {
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
export const getProfissionalProfile = async (req: Request, res: Response): Promise<Response> => {
const authReq = req as AuthRequest;
const profissionalId = authReq.userId;
try {
const profissional = await Profissional.findByPk(profissionalId, {
attributes: { exclude: ['senha'] }
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
```
## `backend/src/database/connection.ts`
```typescript
import { Sequelize } from "sequelize";
import "dotenv/config";
const dbName = process.env.DATABASE as string;
const dbUser = process.env.DATABASE_USERNAME as string;
const dbPassword = process.env.DATABASE_PASSWORD;
const dbHost = process.env.DATABASE_HOST;
const dbPort = parseInt(process.env.DATABASE_PORT || "3306", 10);
if (!dbName || !dbUser || !dbHost) {
throw new Error("[DB ERROR] Variáveis de conexão essenciais não configuradas.");
}
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
host: dbHost,
port: dbPort,
dialect: "mysql", // Define o dialeto específico do banco de dados (neste caso, MariaDB, que é compatível com MySQL).
logging: false, // Desativa os logs de queries SQL no console para não poluir a saída em produção.
define: {
freezeTableName: true,
timestamps: true,
},
});
export async function testConnection(): Promise<void> {
try {
await sequelize.authenticate();
console.log("[DB] Conexão com o MariaDB estabelecida com sucesso!");
} catch (error) {
console.error("[DB ERROR] Não foi possível conectar ao MariaDB:", error);
process.exit(1); // Encerra o processo se a conexão com o DB falhar, pois a aplicação não pode funcionar sem ele.
}
}
export default sequelize;
```
## `backend/src/middlewares/authMiddleware.ts`
```typescript
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
interface TokenPayload extends JwtPayload {
id: string;
email: string;
}
export interface AuthRequest extends Request {
userId?: string;
userEmail?: string;
}
export const protect = (req: Request, res: Response, next: NextFunction) => {
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith("Bearer ")) {
return res.status(401).json({ message: "Acesso negado. Token não fornecido ou formato inválido." });
}
const token = authHeader.split(" ")[1];
if (!token) {
return res.status(401).json({ message: "Acesso negado. Token não encontrado após extração." });
}
try {
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
throw new Error("Configuração de segurança incompleta: JWT_SECRET não encontrado.");
}
const decoded = jwt.verify(token, jwtSecret) as unknown as TokenPayload;
const authReq = req as AuthRequest;
authReq.userId = decoded.id;
authReq.userEmail = decoded.email;
next();
} catch (error) {
let errorMessage = 'Erro desconhecido de validação de token';
if (error instanceof Error) {
errorMessage = error.message;
} else if (typeof error === 'string') {
errorMessage = error;
}
console.error('Erro de validação de token:', errorMessage);
return res.status(401).json({ message: "Token inválido ou expirado." });
}
};
```
## `backend/src/models/Agendamento.ts`
```typescript
import { Model, DataTypes, Optional, Sequelize, BelongsToGetAssociationMixin } from "sequelize";
import Cliente from "./Cliente";
import Profissional from "./Profissional";
export interface AgendamentoAttributes {
id: string;
dataHora: Date;
descricao: string | null;
profissionalId: string;
clienteId: string;
servico: 'Corte' | 'Barba' | 'Corte + Barba';
status: 'Pendente' | 'Confirmado' | 'Cancelado';
}
export interface AgendamentoCreationAttributes extends Optional<AgendamentoAttributes, "id" | "descricao" | "status"> {}
export class Agendamento extends Model<AgendamentoAttributes, AgendamentoCreationAttributes> {
declare id: string;
declare dataHora: Date;
declare descricao: string | null;
declare profissionalId: string;
declare clienteId: string;
declare servico: 'Corte' | 'Barba' | 'Corte + Barba';
declare status: 'Pendente' | 'Confirmado' | 'Cancelado';
declare readonly createdAt: Date;
declare readonly updatedAt: Date;
declare getCliente: BelongsToGetAssociationMixin<Cliente>;
declare readonly cliente?: Cliente;
declare readonly profissional?: Profissional;
public static initialize(sequelize: Sequelize): void {
Agendamento.init(
{
id: {
type: DataTypes.UUID,
defaultValue: DataTypes.UUIDV4,
primaryKey: true,
allowNull: false,
},
dataHora: {
type: DataTypes.DATE,
allowNull: false,
},
descricao: {
type: DataTypes.STRING,
allowNull: true,
},
profissionalId: {
type: DataTypes.UUID,
allowNull: false,
},
clienteId: {
type: DataTypes.UUID,
allowNull: false,
},
servico: {
type: DataTypes.ENUM('Corte', 'Barba', 'Corte + Barba'),
allowNull: false,
},
status: {
type: DataTypes.ENUM('Pendente', 'Confirmado', 'Cancelado'),
defaultValue: 'Pendente',
allowNull: false,
},
},
{
sequelize,
tableName: "agendamentos",
timestamps: true,
}
);
}
public static associate(): void {
this.belongsTo(Profissional, {
foreignKey: "profissionalId",
as: "profissional",
onDelete: "CASCADE", // Se um profissional for deletado, seus agendamentos também serão.
onUpdate: "CASCADE",
});
this.belongsTo(Cliente, {
foreignKey: "clienteId",
as: "cliente",
onDelete: "CASCADE", // Se um cliente for deletado, seus agendamentos também serão.
onUpdate: "CASCADE",
});
}
}
export default Agendamento;
```
## `backend/src/models/Cliente.ts`
```typescript
import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
export interface ClienteAttributes {
id: string;
nome: string;
telefone: string;
}
interface ClienteCreationAttributes extends Optional<ClienteAttributes, 'id'> {}
export class Cliente extends Model<ClienteAttributes, ClienteCreationAttributes> {
declare id: string;
declare nome: string;
declare telefone: string;
declare readonly createdAt: Date;
declare readonly updatedAt: Date;
public static initialize(sequelize: Sequelize): void {
Cliente.init({
id: {
type: DataTypes.UUID,
defaultValue: DataTypes.UUIDV4,
primaryKey: true,
},
nome: {
type: DataTypes.STRING,
allowNull: false,
},
telefone: {
type: DataTypes.STRING,
allowNull: false,
unique: true, // Garante que cada número de telefone seja único, prevenindo clientes duplicados.
},
}, {
sequelize,
tableName: 'clientes',
timestamps: true,
});
}
public static associate(models: any): void {
this.hasMany(models.Agendamento, {
foreignKey: 'clienteId',
as: 'agendamentos', // Alias para ser usado em queries (ex: `include: { as: 'agendamentos' }`)
});
}
}
export type ClienteInstance = Cliente;
export default Cliente;
```
## `backend/src/models/HorarioProfissional.ts`
```typescript
import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import Profissional from './Profissional';
export interface HorarioProfissionalAttributes {
id: string;
profissionalId: string;
diaDaSemana: number; // 0 (Domingo) a 6 (Sábado), para alinhar com o padrão JavaScript `Date.getDay()`.
ativo: boolean; // Permite desativar um dia de trabalho sem apagar o registro.
horarioInicio: string; // Formato "HH:MM".
horarioFim: string; // Formato "HH:MM".
almocoInicio: string; // Formato "HH:MM", opcional.
almocoFim: string; // Formato "HH:MM", opcional.
}
interface HorarioProfissionalCreationAttributes extends Optional<HorarioProfissionalAttributes, 'id'> {}
export class HorarioProfissional extends Model<HorarioProfissionalAttributes, HorarioProfissionalCreationAttributes> {
declare id: string;
declare profissionalId: string;
declare diaDaSemana: number;
declare ativo: boolean;
declare horarioInicio: string;
declare horarioFim: string;
declare almocoInicio: string;
declare almocoFim: string;
declare readonly createdAt: Date;
declare readonly updatedAt: Date;
public static initialize(sequelize: Sequelize): void {
HorarioProfissional.init({
id: {
type: DataTypes.UUID,
defaultValue: DataTypes.UUIDV4,
primaryKey: true,
},
profissionalId: {
type: DataTypes.UUID,
allowNull: false,
references: {
model: 'profissionais',
key: 'id',
},
},
diaDaSemana: {
type: DataTypes.INTEGER,
allowNull: false,
validate: {
min: 0,
max: 6,
},
},
ativo: {
type: DataTypes.BOOLEAN,
defaultValue: true,
allowNull: false,
},
horarioInicio: {
type: DataTypes.TIME,
allowNull: false,
},
horarioFim: {
type: DataTypes.TIME,
allowNull: false,
},
almocoInicio: {
type: DataTypes.TIME,
allowNull: true,
},
almocoFim: {
type: DataTypes.TIME,
allowNull: true,
},
}, {
sequelize,
tableName: 'horarios_profissionais',
timestamps: true,
indexes: [{
unique: true,
fields: ['profissionalId', 'diaDaSemana']
}]
});
}
public static associate(models: any): void {
this.belongsTo(models.Profissional, {
foreignKey: 'profissionalId',
as: 'profissional',
});
}
}
export default HorarioProfissional;
```
## `backend/src/models/Profissional.ts`
```typescript
import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import * as bcrypt from "bcrypt";
export interface ProfissionalAttributes {
id: string;
nome: string;
email: string;
senha: string;
createdAt?: Date;
updatedAt?: Date;
}
export interface ProfissionalCreationAttributes extends Optional<ProfissionalAttributes, "id" | "createdAt" | "updatedAt"> {}
export class Profissional extends Model<ProfissionalAttributes, ProfissionalCreationAttributes> {
declare id: string;
declare nome: string;
declare email: string;
declare senha: string;
declare readonly createdAt: Date;
declare readonly updatedAt: Date;
public static initialize(sequelize: Sequelize): void {
Profissional.init(
{
id: {
type: DataTypes.UUID,
defaultValue: DataTypes.UUIDV4,
allowNull: false,
primaryKey: true,
},
nome: {
type: DataTypes.STRING,
allowNull: false,
},
email: {
type: DataTypes.STRING,
allowNull: false,
unique: true, // Garante que cada profissional tenha um email único.
},
senha: {
type: DataTypes.STRING,
allowNull: false,
},
},
{
sequelize,
tableName: "profissionais",
timestamps: true,
modelName: "Profissional",
}
);
Profissional.beforeCreate(async (profissional: any) => {
const senhaTextoPlano = profissional.senha as string;
if (!senhaTextoPlano) {
throw new Error("Senha não fornecida para criptografia.");
}
const saltRounds = 8; // O "custo" da criptografia. Um valor maior é mais seguro, porém mais lento.
const hashedPassword = await bcrypt.hash(senhaTextoPlano, saltRounds);
profissional.senha = hashedPassword;
});
}
public static associate(models: any): void {
this.hasMany(models.Agendamento, {
foreignKey: 'profissionalId',
as: 'agendamentos',
});
this.hasMany(models.HorarioProfissional, {
foreignKey: 'profissionalId',
as: 'horarios',
});
}
}
export default Profissional;
```
## `backend/src/routes/agendamentoRoutes.ts`
```typescript
import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import {
createAgendamento,
getAllAgendamentos,
getAgendamentoById,
deleteAgendamento,
updateAgendamento,
getAvailableSlots,
getAgendamentosByCliente,
hasActiveAgendamento,
getAgendamentosByDate
} from "../controllers/agendamentoController";
const router = Router();
router.post("/", protect, createAgendamento);
router.get("/", protect, getAllAgendamentos);
router.get("/by-date", protect, getAgendamentosByDate);
router.get("/:id", protect, getAgendamentoById);
router.delete("/:id", protect, deleteAgendamento);
router.put("/:id", protect, updateAgendamento);
router.get("/available-slots", protect, getAvailableSlots);
router.get("/cliente/:clienteId", protect, getAgendamentosByCliente);
router.get("/has-active-appointment/:clienteId", protect, hasActiveAgendamento);
export default router;
```
## `backend/src/routes/clienteRoutes.ts`
```typescript
import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import {
getClienteByTelefone,
createCliente,
getAllClientes,
getClienteById,
updateCliente,
deleteCliente
} from "../controllers/clienteController";
const router = Router();
router.get('/by-phone', protect, getClienteByTelefone);
router.post('/', protect, createCliente);
router.get('/', protect, getAllClientes);
router.route('/:id')
.get(protect, getClienteById)
.put(protect, updateCliente)
.delete(protect, deleteCliente);
export default router;
```
## `backend/src/routes/horarioRoutes.ts`
```typescript
import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import {
getHorarios,
createOrUpdateHorarios,
getDiasDisponiveis,
getHorariosDisponiveis,
} from "../controllers/horarioController";
const router = Router();
router.get("/", protect, getHorarios);
router.post("/", protect, createOrUpdateHorarios);
router.get("/dias-disponiveis/:profissionalId", protect, getDiasDisponiveis);
router.get("/horarios-disponiveis/:profissionalId/:date", protect, getHorariosDisponiveis);
export default router;
```
## `backend/src/routes/profissionalRoutes.ts`
```typescript
import { Router } from "express";
import { createProfissional, loginProfissional, getAllProfissionais, getProfissionalProfile } from "../controllers/profissionalController";
import { protect } from "../middlewares/authMiddleware";
const router = Router();
router.post('/register', createProfissional);
router.post('/login', loginProfissional);
router.get('/', protect, getAllProfissionais);
router.get('/profile', protect, getProfissionalProfile);
export default router;
```
