
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { handleIncomingMessage } from './botService'; 
import { api } from './api-client'; 

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'agendamento_barber_bot' }),
});

console.log('[WHATSAPP] Inicializando cliente...');

client.on('qr', (qr) => {
    console.log('\n--- ESCANEIE O QR CODE NO SEU WHATSAPP ---\n');
    qrcode.generate(qr, { small: true });
    console.log('\n-----------------------------------------\n');
});

client.on('ready', async () => { 
    console.log(`\n✅ [WHATSAPP] Cliente conectado e pronto para receber mensagens!`);
    
    console.log(`🤖 Bot associado ao número: ${client.info.wid.user}`);

    
    await api.loginProfissional('camilo@gmail.com', '123456');
});

client.on('disconnected', (reason) => {
    console.error(`\n❌ [WHATSAPP] Cliente desconectado. Motivo: ${reason}`);
    
    setTimeout(() => client.initialize(), 5000); 
});

client.on('auth_failure', (msg) => {
    console.error(`\n❌ [WHATSAPP] Falha na autenticação: ${msg}. A sessão pode estar corrompida.`);
    console.log('Por favor, delete a pasta "sessions" e tente novamente.');
});

client.on('message_create', async (msg: Message) => {
    
    if (msg.isStatus || msg.fromMe) return;

    
    const telefone = msg.from.replace('@c.us', '').replace('@g.us', ''); 
    const mensagem = msg.body;

    
    if (!mensagem || msg.hasMedia) return;

    console.log(`\n<- [${telefone}] Recebido: ${mensagem}`);

    try {
        
        const botResponse = await handleIncomingMessage(telefone, mensagem);

        if (botResponse) {
            
            await client.sendMessage(msg.from, botResponse);
            console.log(`-> [Bot para ${telefone}] Enviado: ${botResponse.split('\n')[0]}...`);
        }
    } catch (error) {
        console.error(`Erro ao processar mensagem de ${telefone}:`, error);
        
        await client.sendMessage(msg.from, "⚠️ Desculpe, houve um erro inesperado no sistema. Tente novamente mais tarde.");
    }
});

client.initialize();