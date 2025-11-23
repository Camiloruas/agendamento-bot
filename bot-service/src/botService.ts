// bot-service/src/botService.ts

import { api } from "./api-client"; // Importa apenas o objeto da API

// --- DEFINIÇÕES DE ESTADO E CONSTANTES ---

// Mapa para armazenar o estado da conversa de cada usuário
export const conversations = new Map<string, Conversation>();

// Enum para os estados da conversa
export enum BotState {
  START,
  AWAITING_REGISTRATION_NAME,
  MAIN_MENU,
  EXISTING_APPOINTMENT_MENU,
  AWAITING_SERVICE_SELECTION,
  AWAITING_DAY_SELECTION,
  AWAITING_TIME_SELECTION,
  CONFIRMATION,
}

// Interface para o objeto de conversa
export interface Conversation {
  state: BotState;
  clienteId: number | null;
  clienteNome: string | null;
  telefone: string;
  selectedService: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  activeAppointment: any | null; // Considere tipar melhor (Agendamento)
  availableDates: string[];
  availableTimes: string[];
}

// Constantes
export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const SERVICES = [
  { id: 1, servico_tag: "corte" },
  { id: 2, servico_tag: "barba" },
  { id: 3, servico_tag: "corte_barba" },
];

/**
 * Módulo de Lógica Principal do Bot.
 * Gerencia o estado da conversa e a interação com a API.
 */

// --- Funções de Handler para cada Estado ---

/**
 * Ponto de Início: Identifica se é cliente novo ou recorrente e direciona ao menu correto.
 * Esta função é chamada apenas para a primeira mensagem de uma nova sessão ou após a finalização.
 */
async function handleStart(conv: Conversation, input: string): Promise<string> {
  // 1. Se cliente não está cadastrado -> Iniciar Cadastro
  if (!conv.clienteId) {
    conv.state = BotState.AWAITING_REGISTRATION_NAME;
    return "Olá! Bem-vindo ao nosso salão! Para fazermos o seu primeiro agendamento, preciso do seu nome completo:";
  }

  // 2. Cliente já cadastrado: Verifica se já tem agendamento ativo
  conv.activeAppointment = await api.getActiveAppointment(conv.clienteId);

  if (conv.activeAppointment) {
    // Se já tem agendamento ativo
    conv.state = BotState.EXISTING_APPOINTMENT_MENU;
    const dataHora = new Date(conv.activeAppointment.dataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: 'America/Sao_Paulo' });

    return `Olá, ${conv.clienteNome}! Você já tem um agendamento:
📅 ${dataHora}
💈 ${conv.activeAppointment.servico}
Deseja:
1) Manter
2) Remarcar
3) Cancelar
4) Novo agendamento`;
  } else {
    // Não tem agendamento ativo -> Menu Principal
    return await showMainMenu(conv);
  }
}

/**
 * Exibe e processa o Menu Principal (novo agendamento ou consulta).
 */
async function showMainMenu(conv: Conversation): Promise<string> {
  conv.state = BotState.MAIN_MENU;
  return `Olá, ${conv.clienteNome}! Bem-vindo de volta 👋
Como posso ajudar hoje? Digite o número da opção:
1) Fazer um Novo Agendamento
2) Ver Agendamentos Futuros (Consulta)
0) Encerrar`;
}

async function handleMainMenu(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 1) {
    conv.state = BotState.AWAITING_SERVICE_SELECTION;
    return `Qual serviço deseja realizar? Digite o número:
1) Corte
2) Barba
3) Corte + Barba
0) Cancelar`;
  } else if (selection === 2) {
    // Opção 2: Consultar agendamentos futuros
    const appointments = await api.getFutureAppointments(conv.clienteId!); // Assumimos que a rota existe
    if (appointments.length === 0) {
      return `Você não possui agendamentos futuros. ${await showMainMenu(conv)}`;
    }

    let msg = "Seus agendamentos futuros:\n";
    appointments.forEach((a: any, index: number) => {
      const dataHora = new Date(a.dataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: 'America/Sao_Paulo' });
      msg += `${index + 1}. ${a.servico} em ${dataHora}\n`;
    });
    return `${msg}\n${await showMainMenu(conv)}`;
  } else if (selection === 0) {
    conv.state = BotState.START;
    return "Conversa encerrada. Aguardamos você! 👋";
  }
  return `Opção inválida. Digite 1, 2 ou 0. ${await showMainMenu(conv)}`;
}

/**
 * Cadastro: Salva o nome e avança para o menu principal/serviço.
 */
async function handleRegistration(conv: Conversation, input: string): Promise<string> {
  const nome = input.trim();
  if (nome.length < 2) {
    return "Por favor, digite um nome válido para o cadastro.";
  }

  const result = await api.createCliente(nome, conv.telefone);

  conv.clienteId = result.cliente.id;
  conv.clienteNome = result.cliente.nome;

  // Após o cadastro, vai direto para o agendamento (opção 1 do menu)
  conv.state = BotState.AWAITING_SERVICE_SELECTION;
  return `✅ Ótimo, ${conv.clienteNome}! Seu cadastrado foi realizado com sucesso. Agora, vamos agendar.

Qual serviço deseja realizar? Digite o número:
1) Corte
2) Barba
3) Corte + Barba
0) Cancelar`;
}

/**
 * Menu de Agendamento Ativo: Opções para Remarcar/Cancelar/Novo.
 */
async function handleExistingAppointmentMenu(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 1) {
    conv.state = BotState.START; // Reseta, mas mantém o agendamento
    return `Seu agendamento foi mantido. Até breve!`;
  } else if (selection === 2) {
    // Remarcar: Cancelamos o antigo e começamos um novo fluxo de agendamento
    await api.cancelAgendamento(conv.activeAppointment.id);
    conv.activeAppointment = null;
    conv.state = BotState.AWAITING_SERVICE_SELECTION;
    return `Entendido. Agendamento anterior cancelado. Por favor, escolha o serviço para remarcar:
1) Corte
2) Barba
3) Corte + Barba
0) Cancelar`;
  } else if (selection === 3) {
    // Cancelar
    await api.cancelAgendamento(conv.activeAppointment.id);
    conv.activeAppointment = null;
    return `✅ Agendamento cancelado com sucesso. ${await showMainMenu(conv)}`;
  } else if (selection === 4) {
    // Novo Agendamento (4)
    conv.state = BotState.AWAITING_SERVICE_SELECTION;
    return `Certo, vamos para um novo agendamento.
Qual serviço deseja realizar? Digite o número:
1) Corte
2) Barba
3) Corte + Barba
0) Cancelar`;
  } else {
    return "Opção inválida. Escolha entre 1, 2, 3 ou 4.";
  }
}

/**
 * Seleção de Serviço: Define o serviço e avança para a escolha do dia.
 */
async function handleServiceSelection(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);
  const selectedService = SERVICES.find((s) => s.id === selection);

  if (selection === 0) {
    return await showMainMenu(conv);
  }

  if (!selectedService) {
    return "Serviço inválido. Por favor, escolha uma das opções (1, 2 ou 3).";
  }

  conv.selectedService = selectedService.servico_tag;

  // --- Busca Dias Ativos ---
  const activeDates = await api.getAvailableDates();
  
  // Limita a lista de datas para os próximos 8 dias disponíveis
  conv.availableDates = activeDates.map((date: string) => date.split("T")[0]).slice(0, 8);

  if (conv.availableDates.length === 0) {
    return `Desculpe, não temos dias disponíveis no momento. ${await showMainMenu(conv)}`;
  }

  let datesMessage = "Escolha o dia (temos estes próximos 8 dias disponíveis):\n";
  conv.availableDates.forEach((dateStr, index) => {
    const dateObj = new Date(dateStr + "T00:00:00Z");
    const dayOfWeek = DIAS_SEMANA[dateObj.getUTCDay()];
    const formattedDate = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: 'UTC' });
    datesMessage += `${index + 1}) ${dayOfWeek} (${formattedDate})\n`;
  });
  datesMessage += "0) Voltar ao Menu Principal";

  conv.state = BotState.AWAITING_DAY_SELECTION;
  return datesMessage;
}

/**
 * Seleção de Dia: Define o dia e busca os horários disponíveis na API.
 */
async function handleDaySelection(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 0) {
    return await showMainMenu(conv);
  }

  if (isNaN(selection) || selection < 1 || selection > conv.availableDates.length) {
    return `Dia inválido. Por favor, escolha um número de 1 a ${conv.availableDates.length}.`;
  }

  const selectedDate = conv.availableDates[selection - 1];
  conv.selectedDate = selectedDate;

  // CHAMA A ROTA DA API: getAvailableSlots
  const slots = await api.getAvailableSlots(selectedDate);
  conv.availableTimes = slots;

  if (slots.length === 0) {
    // Se a API não retornar horários (dia de folga, ou tudo ocupado)
    return `❌ Não há horários disponíveis para o dia ${selectedDate}. Por favor, tente outro dia.`;
  }

  // Monta a mensagem de horários
  let timesMessage = "Horários disponíveis:\n";
  slots.forEach((timeStr, index) => {
    timesMessage += `${index + 1}) ${timeStr}\n`;
  });
  timesMessage += "0) Voltar ao Menu Principal";

  conv.state = BotState.AWAITING_TIME_SELECTION;
  return timesMessage;
}

/**
 * Seleção de Horário: Define a hora e avança para a confirmação.
 */
async function handleTimeSelection(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 0) {
    return await showMainMenu(conv);
  }

  if (isNaN(selection) || selection < 1 || selection > conv.availableTimes.length) {
    return `Horário inválido. Por favor, escolha um número de 1 a ${conv.availableTimes.length}.`;
  }

  conv.selectedTime = conv.availableTimes[selection - 1];

  // Formata a data para o padrão brasileiro (DD/MM)
  const dateObj = new Date(conv.selectedDate + "T00:00:00Z"); // Use Z for UTC consistency
  const formattedDate = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: 'UTC' });

  const dataHoraFormatada = `${formattedDate} às ${conv.selectedTime}`;

  // --- Confirmação ---
  conv.state = BotState.CONFIRMATION;
  return `Confirmando:
📅 ${dataHoraFormatada}
💈 ${conv.selectedService}
Favor conferir a data, podemos Confirmar? 
1) Sim
2) Não (Voltar ao menu)`;
}

/**
 * Confirmação: Salva o agendamento no banco.
 */
async function handleConfirmation(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 1) {
    // CHAMA A ROTA DA API: createAgendamento
    if (!conv.clienteId || !conv.selectedDate || !conv.selectedTime || !conv.selectedService) {
      conv.state = BotState.START;
      return "Erro interno: Dados incompletos para o agendamento. Digite 'Olá' para recomeçar.";
    }

    const fullDateTime = `${conv.selectedDate}T${conv.selectedTime}:00`; // String de hora local, ex: "2025-11-25T09:00:00"

    const newAppointmentData = {
      profissionalId: api.getProfissionalId(),
      clienteId: conv.clienteId,
      // Analisa a string de hora local (assumindo que o servidor está no fuso horário correto) e converte para string ISO 8601 UTC
      dataHora: new Date(fullDateTime).toISOString(),
      servico: conv.selectedService,
    };

    const result = await api.createAgendamento(newAppointmentData);

    // Limpa o estado da conversa e finaliza
    conv.state = BotState.START;
    conv.selectedDate = null;
    conv.selectedTime = null;
    conv.selectedService = null;

    return `✅ Agendamento realizado com sucesso!
Detalhes:
📅 ${new Date(result.agendamento.dataHora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: 'America/Sao_Paulo' })}
💈 ${result.agendamento.servico}
Aguardamos você, ${conv.clienteNome}! 😊`;
  } else if (selection === 2) {
    return await showMainMenu(conv);
  }

  return "Opção inválida. Digite 1 para confirmar ou 2 para voltar ao Menu Principal.";
}

/**
 * Função principal que processa a mensagem recebida e retorna a resposta do bot.
 */
export async function handleIncomingMessage(telefone: string, message: string): Promise<string> {
  try {
    let conv: Conversation;
    const input = message.trim();
    const normalizedInput = input.toLowerCase();

    // 1. Inicializa ou recupera o estado da conversa
    if (!conversations.has(telefone)) {
      const clienteData = await api.getClienteByTelefone(telefone);

      conv = {
        state: BotState.START,
        clienteId: clienteData?.id || null,
        clienteNome: clienteData?.nome || null,
        telefone: telefone,
        selectedService: null,
        selectedDate: null,
        selectedTime: null,
        activeAppointment: null,
        availableDates: [],
        availableTimes: [],
      };
      conversations.set(telefone, conv);
    } else {
      conv = conversations.get(telefone)!;
    }

    // Se o cliente digitar 'olá' ou 'menu' em qualquer momento, volta ao START
    if (normalizedInput === "olá" || normalizedInput === "menu" || (normalizedInput === "0" && conv.state !== BotState.MAIN_MENU && conv.state !== BotState.AWAITING_SERVICE_SELECTION)) {
      conv.state = BotState.START;
    }

    // --- Lógica do Estado da Conversa ---
    switch (conv.state) {
      case BotState.START:
        return await handleStart(conv, input); // Chama handleStart para identificar o cliente e direcionar

      case BotState.AWAITING_REGISTRATION_NAME:
        return await handleRegistration(conv, input);

      case BotState.MAIN_MENU:
        return await handleMainMenu(conv, input);

      case BotState.EXISTING_APPOINTMENT_MENU:
        return await handleExistingAppointmentMenu(conv, input);

      case BotState.AWAITING_SERVICE_SELECTION:
        return await handleServiceSelection(conv, input);

      case BotState.AWAITING_DAY_SELECTION:
        return await handleDaySelection(conv, input);

      case BotState.AWAITING_TIME_SELECTION:
        return await handleTimeSelection(conv, input);

      case BotState.CONFIRMATION:
        return await handleConfirmation(conv, input);

      default:
        conv.state = BotState.START;
        return "Desculpe, não entendi. Por favor, digite 'Olá' para começar a usar o menu.";
    }
  } catch (error) {
    console.error(`Erro no processamento da mensagem de ${telefone}:`, error);
    return "Desculpe, houve um erro técnico. Tente novamente mais tarde.";
  }
}
