/**
 * @file Ponto de entrada (entrypoint) para o serviço do bot.
 * @description A única responsabilidade deste arquivo é importar e, consequentemente,
 * executar o módulo de integração do WhatsApp (`whatsappIntegration.ts`).
 * Essa abordagem mantém o ponto de entrada limpo e delega a lógica de inicialização
 * para o módulo apropriado, seguindo o princípio da responsabilidade única.
 */
import './whatsappIntegration';