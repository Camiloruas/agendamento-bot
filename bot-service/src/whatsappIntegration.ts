// bot-service/src/whatsappIntegration.ts

import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { handleIncomingMessage } from './botService'; // Importa a lógica principal do bot
import { loginProfissional } from './api-client'; // Adicionar esta linha

/**
 * Módulo de Inicialização e Integração com o WhatsApp (via whatsapp-web.js)
 * * Este arquivo é o "gateway" entre o WhatsApp e a lógica de agendamento.
 */

// ----------------------------------------------------------------------
// 1. CONFIGURAÇÃO DO CLIENTE WHATSAPP
// ----------------------------------------------------------------------

// Inicializa o cliente, usando LocalAuth para salvar a sessão no disco.
// Isso evita que você precise escanear o QR Code toda vez.
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'agendamento_barber_bot' }),
    // Nota: Em ambientes Ubuntu/Linux, certifique-se de que o Puppeteer
    // (dependência do whatsapp-web.js) tenha as bibliotecas necessárias instaladas.
    // Geralmente: sudo apt install -y chromium-browser
    puppeteer: {
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

console.log('[WHATSAPP] Inicializando cliente...');

// ----------------------------------------------------------------------
// 2. EVENTOS DE CONEXÃO
// ----------------------------------------------------------------------

/**
 * Evento QR Code: Exibe o código no terminal para autenticação.
 */
client.on('qr', (qr) => {
    console.log('\n--- ESCANEIE O QR CODE NO SEU WHATSAPP ---\n');
    qrcode.generate(qr, { small: true });
    console.log('\n-----------------------------------------\n');
});

/**
 * Evento READY: Indica que a sessão foi carregada com sucesso.
 */
client.on('ready', async () => { // Marcar como async
    console.log(`\n✅ [WHATSAPP] Cliente conectado e pronto para receber mensagens!`);
    // Exibe o número do bot para referência
    console.log(`🤖 Bot associado ao número: ${client.info.wid.user}`);

    // **IMPORTANTE**: SUBSTITUA com as credenciais de um profissional VÁLIDO no seu BD
    await loginProfissional('camilo@gmail.com', '123456');
});

/**
 * Evento DISCONNECT: Trata a perda de conexão.
 */
client.on('disconnected', (reason) => {
    console.error(`\n❌ [WHATSAPP] Cliente desconectado. Motivo: ${reason}`);
    // Tenta reiniciar após 5 segundos
    setTimeout(() => client.initialize(), 5000); 
});

/**
 * Evento AUTH_FAILURE: Falha na autenticação (sessão corrompida).
 */
client.on('auth_failure', (msg) => {
    console.error(`\n❌ [WHATSAPP] Falha na autenticação: ${msg}. A sessão pode estar corrompida.`);
    console.log('Por favor, delete a pasta "sessions" e tente novamente.');
});


// ----------------------------------------------------------------------
// 3. PROCESSAMENTO DE MENSAGENS E INTEGRAÇÃO COM O BOT
// ----------------------------------------------------------------------

/**
 * Evento MESSAGE_CREATE: Processa cada nova mensagem recebida.
 */
client.on('message_create', async (msg: Message) => {
    // Ignora mensagens de status e mensagens enviadas pelo próprio bot.
    if (msg.isStatus || msg.fromMe) return;

    // Remove o sufixo @c.us ou @g.us e formata para o padrão esperado pelo bot (telefone)
    const telefone = msg.from.replace('@c.us', '').replace('@g.us', ''); 
    const mensagem = msg.body;

    // Ignora mensagens vazias ou não-texto
    if (!mensagem || msg.hasMedia) return;

    console.log(`\n<- [${telefone}] Recebido: ${mensagem}`);

    try {
        // Chama a lógica principal do bot, que gerencia o estado da conversa e a API.
        const botResponse = await handleIncomingMessage(telefone, mensagem);

        if (botResponse) {
            // Envia a resposta de volta ao cliente
            await client.sendMessage(msg.from, botResponse);
            console.log(`-> [Bot para ${telefone}] Enviado: ${botResponse.split('\n')[0]}...`);
        }
    } catch (error) {
        console.error(`Erro ao processar mensagem de ${telefone}:`, error);
        // Resposta de erro genérica para o usuário
        await client.sendMessage(msg.from, "⚠️ Desculpe, houve um erro inesperado no sistema. Tente novamente mais tarde.");
    }
});

// ----------------------------------------------------------------------
// 4. INICIALIZAÇÃO
// ----------------------------------------------------------------------

client.initialize();