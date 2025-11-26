import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { handleIncomingMessage } from './botService'; 
import { api } from './api-client'; 

/**
 * @file Responsável pela inicialização e gerenciamento do cliente WhatsApp.
 * Este módulo atua como a ponte entre a biblioteca `whatsapp-web.js` e a lógica de negócio do bot.
 */

// Instancia o cliente do WhatsApp.
// `LocalAuth` é usado para persistir a sessão de autenticação em disco,
// evitando a necessidade de escanear o QR code a cada reinicialização.
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'agendamento_barber_bot' }),
});

console.log('[WHATSAPP] Inicializando cliente...');

/**
 * @event qr
 * @description Acionado quando o QR code para autenticação é gerado.
 * O código é exibido no terminal para que o usuário possa escanear com o app do WhatsApp.
 */
client.on('qr', (qr) => {
    console.log('\n--- ESCANEIE O QR CODE NO SEU WHATSAPP ---\n');
    qrcode.generate(qr, { small: true });
    console.log('\n-----------------------------------------\n');
});

/**
 * @event ready
 * @description Acionado quando o cliente se conecta com sucesso e está pronto para operar.
 * Neste ponto, o bot realiza o login no backend para obter o token de autenticação
 * necessário para as chamadas de API subsequentes.
 */
client.on('ready', async () => { 
    console.log(`\n✅ [WHATSAPP] Cliente conectado e pronto para receber mensagens!`);
    console.log(`🤖 Bot associado ao número: ${client.info.wid.user}`);

    // Realiza o login do profissional no backend para autenticar as requisições da API.
    // IMPORTANTE: Em produção, estas credenciais devem vir de variáveis de ambiente seguras.
    await api.loginProfissional('camilo@gmail.com', '123456');
});

/**
 * @event disconnected
 * @description Trata eventos de desconexão. Implementa uma lógica simples de
 * retentativa para restabelecer a conexão automaticamente.
 */
client.on('disconnected', (reason) => {
    console.error(`\n❌ [WHATSAPP] Cliente desconectado. Motivo: ${reason}`);
    // Tenta reiniciar o cliente após um breve intervalo para se recuperar de falhas de rede.
    setTimeout(() => client.initialize(), 5000); 
});

/**
 * @event auth_failure
 * @description Lida com falhas de autenticação, que geralmente indicam que a sessão
 * armazenada localmente foi invalidada ou corrompida.
 */
client.on('auth_failure', (msg) => {
    console.error(`\n❌ [WHATSAPP] Falha na autenticação: ${msg}. A sessão pode estar corrompida.`);
    console.log('Por favor, delete a pasta ".wwebjs_auth" e tente novamente.');
});

/**
 * @event message_create
 * @description Este é o coração do bot, onde cada nova mensagem é recebida e processada.
 * Ele extrai as informações relevantes da mensagem e as repassa para o `botService`,
 * que contém a máquina de estados e a lógica de conversação.
 */
client.on('message_create', async (msg: Message) => {
    // Filtra mensagens irrelevantes, como atualizações de status ou mensagens enviadas pelo próprio bot.
    if (msg.isStatus || msg.fromMe) return;

    // Normaliza o número de telefone para servir como um ID único para a conversa.
    const telefone = msg.from.replace('@c.us', '').replace('@g.us', ''); 
    const mensagem = msg.body;

    // Ignora mensagens que não contêm texto (ex: apenas mídia).
    if (!mensagem || msg.hasMedia) return;

    console.log(`\n<- [${telefone}] Recebido: ${mensagem}`);

    try {
        // Delega o processamento da mensagem para a lógica principal do bot.
        const botResponse = await handleIncomingMessage(telefone, mensagem);

        // Se o `botService` retornar uma resposta, ela é enviada de volta ao usuário.
        if (botResponse) {
            await client.sendMessage(msg.from, botResponse);
            console.log(`-> [Bot para ${telefone}] Enviado: ${botResponse.split('\n')[0]}...`);
        }
    } catch (error) {
        console.error(`Erro ao processar mensagem de ${telefone}:`, error);
        // Envia uma mensagem de erro genérica para o usuário para não expor detalhes técnicos.
        await client.sendMessage(msg.from, "⚠️ Desculpe, houve um erro inesperado no sistema. Tente novamente mais tarde.");
    }
});

// Inicia o processo de conexão do cliente com o WhatsApp.
client.initialize();