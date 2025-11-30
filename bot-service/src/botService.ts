import { api, AppointmentConflictError, TimeSlot } from "./api-client";
import moment from "moment";

/**
 * @description Armazena o estado da conversa para cada usuário (identificado pelo telefone).
 * Usar um `Map` em memória é uma solução simples para prototipagem, mas para produção,
 * uma solução persistente como Redis ou um banco de dados seria mais robusta.
 */
export const conversations = new Map<string, Conversation>();

/**
 * @enum BotState
 * @description Define os possíveis estados em que uma conversa pode estar.
 * Isso transforma o bot em uma máquina de estados finita, tornando o fluxo de conversa
 * mais previsível e fácil de gerenciar.
 */
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



/**
 * @interface Conversation
 * @description Modela todos os dados necessários para manter o contexto de uma conversa com um usuário.
 * Isso inclui o estado atual, informações do cliente e dados temporários do agendamento.
 */
export interface Conversation {
  state: BotState;
  clienteId: number | null;
  clienteNome: string | null;
  telefone: string;
  isExistingUser: boolean;
  selectedService: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  activeAppointment: any | null;
  availableDates: string[];
  availableTimes: TimeSlot[];
}

// Constantes que ajudam a padronizar e formatar as respostas do bot.
export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];


// Função auxiliar para buscar serviços e formatar o menu
async function getServicesMenu(): Promise<string> {
  try {
    const services = await api.getServices();
    if (services.length === 0) return "Nenhum serviço disponível no momento.";

    let msg = "Qual serviço deseja realizar? Digite o número:\n";
    services.forEach((s: any, index: number) => {
      msg += `${index + 1}) ${s.nome} - R$ ${s.preco}\n`;
    });
    msg += "0) Cancelar";
    return msg;
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return "Erro ao carregar serviços. Tente novamente mais tarde.";
  }
}

/**
 * @function handleStart
 * @description Ponto de entrada para cada nova interação. Decide o fluxo inicial com base
 * no status do cliente (novo, existente, com agendamento ativo).
 */
async function handleStart(conv: Conversation, input: string): Promise<string> {
  // Se o cliente não está no banco de dados, inicia o fluxo de cadastro.
  if (!conv.clienteId) {
    conv.state = BotState.AWAITING_REGISTRATION_NAME;
    return "Olá! Bem-vindo ao nosso salão! Para fazermos o seu primeiro agendamento, preciso do seu nome completo:";
  }

  // Se o cliente já é conhecido, verifica se ele tem um agendamento futuro.
  conv.activeAppointment = await api.getActiveAppointment(conv.clienteId);
  console.log(`[handleStart] Active appointment para cliente ${conv.clienteId}:`, conv.activeAppointment);

  // Se houver um agendamento ativo, oferece opções específicas (manter, remarcar, etc.).
  if (conv.activeAppointment) {
    conv.state = BotState.EXISTING_APPOINTMENT_MENU;
    const dataHora = new Date(conv.activeAppointment.dataHora).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    });

    return `Olá, ${conv.clienteNome}! Você já tem um agendamento:
📅 ${dataHora}
💈 ${conv.activeAppointment.servico}
Deseja:
1) Manter
2) Remarcar
3) Cancelar
4) Novo agendamento`;
  } else {
    // Se não houver agendamento, mostra o menu principal.
    conv.state = BotState.MAIN_MENU;
    return `Olá, ${conv.clienteNome}! Qual serviço deseja realizar hoje?
1) Fazer um Novo Agendamento
2) Ver Agendamentos Futuros (Consulta)
0) Encerrar`;
  }
}

// Função auxiliar para reutilizar a mensagem do menu principal.
async function showMainMenu(conv: Conversation): Promise<string> {
  conv.state = BotState.MAIN_MENU;
  return `Olá, ${conv.clienteNome}! Bem-vindo de volta 👋
Como posso ajudar hoje? Digite o número da opção:
1) Fazer um Novo Agendamento
2) Ver Agendamentos Futuros (Consulta)
0) Encerrar`;
}

/**
 * @function handleMainMenu
 * @description Processa a escolha do usuário no menu principal.
 */
async function handleMainMenu(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 1) {
    // Novo Agendamento
    conv.state = BotState.AWAITING_SERVICE_SELECTION;
    return await getServicesMenu();
  } else if (selection === 2) {
    // Ver Agendamentos
    const appointments = await api.getFutureAppointments(conv.clienteId!);
    if (appointments.length === 0) {
      return `Você não possui agendamentos futuros. ${await showMainMenu(conv)}`;
    }
    let msg = "Seus agendamentos futuros:\n";
    appointments.forEach((a: any, index: number) => {
      const dataHora = new Date(a.dataHora).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      });
      msg += `${index + 1}. ${a.servico} em ${dataHora}\n`;
    });
    return `${msg}\n${await showMainMenu(conv)}`;
  } else if (selection === 0) {
    // Encerrar
    conv.state = BotState.START;
    return "Conversa encerrada. Aguardamos você! 👋";
  }
  return `Opção inválida. Digite 1, 2 ou 0. ${await showMainMenu(conv)}`;
}

/**
 * @function handleRegistration
 * @description Processa o nome fornecido pelo novo usuário e o cadastra via API.
 */
async function handleRegistration(conv: Conversation, input: string): Promise<string> {
  const nome = input.trim();

  // Uma verificação de segurança caso o estado da conversa se torne inconsistente.
  if (conv.isExistingUser) {
    conv.state = BotState.MAIN_MENU;
    return `Olá, ${conv.clienteNome}! Parece que você já está cadastrado. Como posso ajudar hoje? Digite o número da opção:
1) Fazer um Novo Agendamento
2) Ver Agendamentos Futuros (Consulta)
0) Encerrar`;
  }

  if (nome.length < 2) {
    return "Por favor, digite um nome válido para o cadastro.";
  }

  try {
    const result = await api.createCliente(nome, conv.telefone);
    conv.clienteId = result.cliente.id;
    conv.clienteNome = result.cliente.nome;

    conv.state = BotState.AWAITING_SERVICE_SELECTION; // Avança para o agendamento
    const servicesMenu = await getServicesMenu();
    return `✅ Ótimo, ${conv.clienteNome}! Seu cadastrado foi realizado com sucesso. Agora, vamos agendar.

${servicesMenu}`;
  } catch (error: any) {
    console.error(`Erro ao criar cliente para ${conv.telefone}:`, error.response?.data || error.message);
    // Trata o caso de o cliente já existir no banco de dados (conflito 409).
    if (
      (error.response && error.response.status === 409) ||
      (error.response?.data?.message && error.response.data.message.includes("já existe"))
    ) {
      conv.state = BotState.MAIN_MENU;
      const clienteData = await api.getClienteByTelefone(conv.telefone);
      if (clienteData) {
        conv.clienteId = clienteData.id;
        conv.clienteNome = clienteData.nome;
      }
      return `Parece que você já está cadastrado, ${conv.clienteNome || "caro cliente"
        }! Redirecionando para o menu principal. Como posso ajudar hoje? Digite o número da opção:
1) Fazer um Novo Agendamento
2) Ver Agendamentos Futuros (Consulta)
0) Encerrar`;
    }
    conv.state = BotState.START;
    return "Desculpe, houve um problema ao tentar realizar seu cadastro. Por favor, tente novamente mais tarde ou digite 'Olá' para recomeçar.";
  }
}

/**
 * @function handleExistingAppointmentMenu
 * @description Gerencia as opções do usuário em relação a um agendamento que ele já possui.
 */
async function handleExistingAppointmentMenu(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 1) {
    // Manter
    conv.state = BotState.START;
    return `Seu agendamento foi mantido. Até breve!`;
  } else if (selection === 2) {
    // Remarcar (cancela o antigo e inicia um novo fluxo)
    await api.cancelAgendamento(conv.activeAppointment.id);
    conv.activeAppointment = null;
    conv.state = BotState.AWAITING_SERVICE_SELECTION;
    const servicesMenu = await getServicesMenu();
    return `Entendido. Agendamento anterior cancelado. Por favor, escolha o serviço para remarcar:
${servicesMenu}`;
  } else if (selection === 3) {
    // Cancelar
    await api.cancelAgendamento(conv.activeAppointment.id);
    conv.activeAppointment = null;
    return `✅ Agendamento cancelado com sucesso. ${conv.clienteNome}, se quiser continuar com o atendimento, favor escolher opções abaixo: 
1) Fazer um Novo Agendamento
2) Ver Agendamentos Futuros (Consulta)
0) Encerrar`;
  } else if (selection === 4) {
    // Novo agendamento (mantendo o antigo)
    conv.state = BotState.AWAITING_SERVICE_SELECTION;
    const servicesMenu = await getServicesMenu();
    return `Certo, vamos para um novo agendamento.
${servicesMenu}`;
  } else {
    return "Opção inválida. Escolha entre 1, 2, 3 ou 4.";
  }
}

/**
 * @function handleServiceSelection
 * @description Após o usuário escolher o serviço, busca e exibe os dias disponíveis.
 */
async function handleServiceSelection(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 0) return await showMainMenu(conv);

  const services = await api.getServices();
  if (isNaN(selection) || selection < 1 || selection > services.length) {
    return "Serviço inválido. Por favor, escolha uma das opções.";
  }

  const selectedService = services[selection - 1];
  conv.selectedService = selectedService.nome;

  const activeDates = await api.getAvailableDates();
  conv.availableDates = activeDates.map((date: string) => date.split("T")[0] as string).slice(0, 8); // Pega apenas os 8 primeiros dias

  if (conv.availableDates.length === 0) {
    return `Desculpe, não temos dias disponíveis no momento. ${await showMainMenu(conv)}`;
  }

  // Monta a mensagem com os dias formatados para o usuário.
  let datesMessage = "Escolha o dia (temos estes próximos 8 dias disponíveis):\n";
  conv.availableDates.forEach((dateStr, index) => {
    const dateObj = new Date(dateStr + "T00:00:00Z");
    const dayOfWeek = DIAS_SEMANA[dateObj.getUTCDay()];
    const formattedDate = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
    datesMessage += `${index + 1}) ${dayOfWeek} (${formattedDate})\n`;
  });
  datesMessage += "0) Voltar ao Menu Principal";

  conv.state = BotState.AWAITING_DAY_SELECTION;
  return datesMessage;
}

/**
 * @function handleDaySelection
 * @description Após o usuário escolher o dia, busca e exibe os horários disponíveis (slots).
 */
async function handleDaySelection(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 0) return await showMainMenu(conv);
  if (isNaN(selection) || selection < 1 || selection > conv.availableDates.length) {
    return `Dia inválido. Por favor, escolha um número de 1 a ${conv.availableDates.length}.`;
  }

  const selectedDate = conv.availableDates[selection - 1]!;
  conv.selectedDate = selectedDate;

  const slots = await api.getAvailableSlots(selectedDate);
  conv.availableTimes = slots;

  if (slots.length === 0) {
    return `❌ Não há horários de trabalho configurados para o dia ${new Date(
      selectedDate + "T00:00:00Z"
    ).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })}. Por favor, tente outro dia.`;
  }

  // Monta a mensagem com os horários e seus status (disponível/ocupado).
  let timesMessage = "Escolha um horário abaixo:\n";
  slots.forEach((slot, index) => {
    const statusEmoji = slot.status === "disponivel" ? "✅" : "❌";
    const statusText = slot.status === "disponivel" ? "Disponível" : "Ocupado";
    timesMessage += `${index + 1}) ${slot.time} (${statusText}) ${statusEmoji}\n`;
  });
  timesMessage += "0) Voltar ao Menu Principal";

  conv.state = BotState.AWAITING_TIME_SELECTION;
  return timesMessage;
}

/**
 * @function handleTimeSelection
 * @description Valida a escolha de horário do usuário e o leva para a confirmação final.
 * Crucialmente, impede que o usuário selecione um horário já ocupado.
 */
async function handleTimeSelection(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 0) return await showMainMenu(conv);
  if (isNaN(selection) || selection < 1 || selection > conv.availableTimes.length) {
    return `Horário inválido. Por favor, escolha um número de 1 a ${conv.availableTimes.length}.`;
  }

  const selectedSlot = conv.availableTimes[selection - 1]!;

  // Regra de negócio importante: não permitir a seleção de um slot ocupado.
  if (selectedSlot.status === "ocupado") {
    let timesMessage = `❌ O horário ${selectedSlot.time} está ocupado. Por favor, escolha outro horário da lista abaixo:\n`;
    conv.availableTimes.forEach((slot, index) => {
      const statusEmoji = slot.status === "disponivel" ? "✅" : "❌";
      const statusText = slot.status === "disponivel" ? "Disponível" : "Ocupado";
      timesMessage += `${index + 1}) ${slot.time} (${statusText}) ${statusEmoji}\n`;
    });
    timesMessage += "0) Voltar ao Menu Principal";
    return timesMessage;
  }

  conv.selectedTime = selectedSlot.time;

  const dateObj = new Date(conv.selectedDate + "T00:00:00Z");
  const formattedDate = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  const dataHoraFormatada = `${formattedDate} às ${conv.selectedTime}`;

  conv.state = BotState.CONFIRMATION;
  return `Confirmando:
📅 ${dataHoraFormatada}
💈 ${conv.selectedService}
Favor conferir a data, podemos Confirmar? 
1) Sim
2) Não (Voltar ao menu)`;
}

/**
 * @function handleConfirmation
 * @description Processa a confirmação final do usuário e tenta criar o agendamento via API.
 * Lida com o caso de "conflito de agendamento" (race condition).
 */
async function handleConfirmation(conv: Conversation, input: string): Promise<string> {
  const selection = parseInt(input);

  if (selection === 2) return await showMainMenu(conv);
  if (selection !== 1) return "Opção inválida. Digite 1 para confirmar ou 2 para voltar ao Menu Principal.";

  if (!conv.clienteId || !conv.selectedDate || !conv.selectedTime || !conv.selectedService) {
    conv.state = BotState.START;
    return "Erro interno: Dados incompletos para o agendamento. Digite 'Olá' para recomeçar.";
  }

  const fullDateTime = `${conv.selectedDate}T${conv.selectedTime}:00`;
  const newAppointmentData = {
    profissionalId: api.getProfissionalId(),
    clienteId: conv.clienteId,
    dataHora: new Date(fullDateTime).toISOString(),
    servico: conv.selectedService,
  };

  try {
    const result = await api.createAgendamento(newAppointmentData);
    // Limpa o estado da conversa após o sucesso.
    conv.state = BotState.START;
    conv.selectedDate = null;
    conv.selectedTime = null;
    conv.selectedService = null;

    return `✅ Agendamento realizado com sucesso!
Detalhes:
📅 ${new Date(result.agendamento.dataHora).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    })}
💈 ${result.agendamento.servico}
Aguardamos você, ${conv.clienteNome}! 😊`;
  } catch (error) {
    // Tratamento especializado para o erro de conflito, oferecendo ao usuário
    // uma nova lista de horários para o mesmo dia.
    if (error instanceof AppointmentConflictError) {
      const freshSlots = await api.getAvailableSlots(conv.selectedDate!);
      conv.availableTimes = freshSlots;
      const availableCount = freshSlots.filter((s) => (s as any).status === "disponivel").length;

      if (availableCount === 0) {
        conv.state = BotState.AWAITING_DAY_SELECTION;
        return `❌ Ops! Parece que outra pessoa agendou neste mesmo horário. E não há mais horários para este dia. Por favor, escolha outro dia.`;
      }

      let timesMessage = `❌ Ops! Parece que outra pessoa agendou neste mesmo horário. Mas ainda temos estes horários disponíveis para o dia ${new Date(
        conv.selectedDate! + "T00:00:00Z"
      ).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })}:\n`;
      freshSlots.forEach((slot: any, index) => {
        const statusEmoji = slot.status === "disponivel" ? "✅" : "❌";
        const statusText = slot.status === "disponivel" ? "Disponível" : "Ocupado";
        timesMessage += `${index + 1}) ${slot.time} (${statusText}) ${statusEmoji}\n`;
      });
      timesMessage += "0) Voltar ao Menu Principal";

      conv.state = BotState.AWAITING_TIME_SELECTION; // Volta para a seleção de horário.
      return timesMessage;
    }
    throw error; // Relança outros erros para serem tratados pelo handler principal.
  }
}

/**
 * @function handleIncomingMessage
 * @description É o "cérebro" do bot. Orquestra todo o processo: gerencia o estado da conversa,
 * chama a função de handler apropriada com base no estado atual e trata erros de forma genérica.
 */
export async function handleIncomingMessage(telefone: string, message: string): Promise<string> {
  try {
    let conv: Conversation;
    const input = message.trim();
    const normalizedInput = input.toLowerCase();

    // Se é a primeira mensagem do usuário, cria um novo objeto de conversa.
    if (!conversations.has(telefone)) {
      console.log(`[handleIncomingMessage] Iniciando nova conversa para telefone: ${telefone}`);
      const clienteData = await api.getClienteByTelefone(telefone);
      console.log(`[handleIncomingMessage] Resultado de getClienteByTelefone para ${telefone}:`, clienteData);

      conv = {
        state: BotState.START,
        clienteId: clienteData?.id || null,
        clienteNome: clienteData?.nome || null,
        telefone: telefone,
        isExistingUser: !!clienteData?.id,
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
      console.log(
        `[handleIncomingMessage] Conversa existente encontrada para telefone: ${telefone}, estado: ${conv.state}`
      );
    }

    // Permite que o usuário reinicie a conversa a qualquer momento.
    if (
      normalizedInput === "olá" ||
      normalizedInput === "menu" ||
      (normalizedInput === "0" &&
        conv.state !== BotState.MAIN_MENU &&
        conv.state !== BotState.AWAITING_SERVICE_SELECTION)
    ) {
      conv.state = BotState.START;
    }

    // O `switch` é o coração da máquina de estados, direcionando a entrada do usuário
    // para a função de tratamento correta.
    switch (conv.state) {
      case BotState.START:
        return await handleStart(conv, input);
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
