// bot-service/src/botService.ts

/**
 * Lógica principal do bot de agendamento.
 * 
 * Esta função é o "cérebro" do bot. Ela recebe a mensagem do usuário,
 * gerencia o estado da conversa (ex: o usuário está escolhendo um serviço, data ou horário?)
 * e interage com a API do backend para consultar ou registrar informações.
 *
 * @param userPhone O número de telefone do usuário (ex: '5511999998888').
 * @param message A mensagem de texto enviada pelo usuário.
 * @returns Uma string contendo a resposta que o bot deve enviar de volta ao usuário.
 */
export async function handleIncomingMessage(userPhone: string, message: string): Promise<string> {
    console.log(`[Bot Service] Processando mensagem de ${userPhone}: "${message}"`);

    // TODO: Implementar a lógica real do bot aqui.
    // Este é um placeholder para resolver o erro de importação.

    // Exemplo de lógica simples:
    if (message.toLowerCase().includes('olá')) {
        return 'Olá! Bem-vindo ao serviço de agendamento. Como posso ajudar?';
    }

    return 'Não entendi. Por favor, diga "olá" para começar.';
}
