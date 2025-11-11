# 📅 Fluxo de Agendamento — Sistema para Cabeleireiro

Este documento descreve o fluxo de funcionamento do sistema de agendamento via WhatsApp para cabeleireiros, incluindo regras, entidades, lógica de disponibilidade, comportamento do bot e visão geral das etapas do usuário e administrador.

---

## ✅ Objetivo

Permitir que clientes realizem agendamentos de serviços de forma automatizada via WhatsApp, integrando o cadastro de profissionais, configuração de horários disponíveis, opções de serviço e gerenciamento de compromissos.

---

## ✅ Serviços Disponíveis

Os serviços oferecidos são:

1. Corte
2. Barba
3. Corte + Barba

> Cada serviço utiliza um intervalo padrão de **1 hora** por atendimento.

---

## ✅ Participantes

### 👨‍🔧 Profissional (Admin)
- Cabeleireiro responsável pela agenda
- Pode configurar:
  - Dias da semana que trabalha
  - Horário de início por dia
  - Horário de fim por dia
  - Intervalo de almoço por dia (flexível)

- Pode inserir agendamentos manualmente (casos de clientes sem WhatsApp)

---

### 👤 Cliente
- Realiza agendamento via WhatsApp
- Identificação pelo número do celular
- Nome é solicitado apenas na primeira vez

---

## ✅ Regras Gerais

- Intervalos entre agendamentos: **1h**
- Admin escolhe **quais dias da semana trabalha**
  - Pode incluir sábados e domingos
  - Pode folgar no dia que quiser
- Almoço pode variar por dia
- Cliente pode:
  - Criar novo agendamento
  - Alterar
  - Cancelar
  - Ver compromissos futuros

- Reconhecimento automático do cliente pelo número de celular

---

## ✅ Fluxo do WhatsApp

### 1) Cliente inicia conversa

#### Se já cadastrado:
> “Olá, <nome>! Bem-vindo de volta 👋  
Como posso ajudar hoje?”

#### Se novo:
> “Olá! Bem-vindo ao nosso salão!  
Gostaria de fazer um agendamento?  
1) Sim  
2) Não”

---

### 2) Cadastro / Identificação

Se novo:
- Solicita nome
- Salva no banco

---

### 3) Verifica se já possui agendamento ativo

Se SIM:
> “Você já tem um agendamento:  
📅 <dia>  
⏰ <hora>  
Deseja:  
1) Manter  
2) Remarcar  
3) Cancelar  
4) Novo agendamento”

Se NÃO:
→ Seguir fluxo normal

---

### 4) Escolher serviço

> “Qual serviço deseja realizar?”  
1) Corte  
2) Barba  
3) Corte + Barba  
0) Cancelar

---

### 5) Escolher dia

O sistema exibe apenas dias em que o profissional trabalha.

Exemplo:
> “Escolha o dia:”  
1) Ter (15/11)  
2) Qua (16/11)  
3) Sab (19/11)  
0) Cancelar

---

### 6) Escolher horário

O sistema gera slots de 1h automaticamente, removendo:
- Período de almoço
- Horários já ocupados

> “Horários disponíveis:”  
1) 08:00  
2) 09:00  
3) 14:00  
4) 15:00  
0) Cancelar

---

### 7) Confirmação

> “Confirmando:  
📅 <dia>  
⏰ <hora>  
💈 <serviço>  
Está correto?”  
1) Sim  
2) Não

---

### 8) Finalização

> “✅ Agendamento realizado com sucesso!  
Aguardamos você 😊”

---

## ✅ Inserção Manual (Admin)

O admin pode:

- Criar agendamento
- Cancelar agendamento
- Remarcar
- Gerenciar horários

> Necessário para casos de clientes sem WhatsApp (ex.: idosos)

---

## ✅ Estrutura de Disponibilidade

Para cada dia configurável:

| Campo | Descrição |
|------|-----------|
| Trabalha hoje? | Sim / Não |
| Hora início | Ex.: 08:00 |
| Hora fim | Ex.: 18:00 |
| Almoço início | Ex.: 12:00 |
| Almoço fim | Ex.: 13:00 |

> Se “Trabalha?” for “Não”, o dia não é apresentado ao cliente.

---

## ✅ Geração dos Slots

### Lógica
Para cada dia marcado como ativo:

1. Ler horário de abertura
2. Ler horário de fechamento
3. Criar intervalos de 1h
4. Remover horários dentro do almoço
5. Remover horários já ocupados

Exemplo:
08:00 ✅
09:00 ✅
10:00 ✅
11:00 ✅
12:00 — Almoço
13:00 ✅
14:00 ✅
15:00 ✅
16:00 ✅
17:00 ✅

yaml
Copiar código

---

## ✅ Banco de Dados — Estrutura (resumo)

### 📌 `customers`
| Campo | Tipo |
|-------|------|
| id | uuid |
| name | string |
| phone | string |

---

### 📌 `professionals`
| Campo | Tipo |
|-------|------|
| id | uuid |
| name | string |
| phone | string |

---

### 📌 `professional_schedule`
Configuração de agenda por dia da semana

| Campo | Tipo |
|-------|-----|
| id | uuid |
| professional_id | fk |
| day_of_week | int (0–6) |
| active | bool |
| work_start | time |
| work_end | time |
| lunch_start | time |
| lunch_end | time |

> `day_of_week`  
0 = Domingo  
1 = Segunda  
…  
6 = Sábado

---

### 📌 `appointments`
| Campo | Tipo |
|-------|------|
| id | uuid |
| professional_id | fk |
| customer_id | fk |
| service | enum |
| date | date |
| time | time |
| status | enum(pending, confirmed, canceled) |

---

## ✅ Fluxo Resumido (Texto)

Cliente inicia conversa
│
├─ Já cadastrado?
│ ├─ Sim → cumprimenta
│ └─ Não → pede nome
│
├─ Já possui agendamento ativo?
│ ├─ Sim → oferece opções
│ └─ Não → segue
│
├─ Escolher serviço
├─ Escolher dia (apenas dias ativos)
├─ Escolher horário (slots válidos)
├─ Confirmar
├─ Salvar
└─ Agradecer

yaml
Copiar código

---

## ✅ Possíveis Melhorias Futuras

- Enviar lembrete 24h antes
- Suporte a duração diferente por serviço
- Suporte a múltiplos profissionais
- Bloqueio de horários datas especiais (ex.: feriado)
- Histórico completo de clientes
- Fidelidade / cupons

---

## ✅ Conclusão

Este fluxo cobre:

✔ Interação cliente via WhatsApp  
✔ Controle total de agenda pelo admin  
✔ Serviços básicos (corte / barba)  
✔ Flexibilidade de dias trabalhados (inclui sábado/domingo)  
✔ Intervalos configuráveis  
✔ Inserção manual de agendamento pelo admin  
✔ Registro de clientes  
✔ Evita conflitos de horários  

---

_Fim do documento_
