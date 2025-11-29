# Como Cadastrar Serviços no Sistema

O bot precisa de **serviços cadastrados** no banco de dados para funcionar. Você configurou os **horários de trabalho** (segunda a sábado), mas ainda não cadastrou os **serviços** (Corte, Barba, etc.).

## Opção 1: Via SQL (Mais Rápido)

Execute estes comandos SQL no seu banco de dados MariaDB:

```sql
USE agendamento_bot;

INSERT INTO servicos (id, nome, descricao, preco, duracao, createdAt, updatedAt) VALUES
(UUID(), 'Corte de Cabelo', 'Corte masculino tradicional', 50.00, 60, NOW(), NOW()),
(UUID(), 'Barba', 'Aparar e modelar barba', 30.00, 30, NOW(), NOW()),
(UUID(), 'Corte + Barba', 'Combo completo de corte e barba', 70.00, 90, NOW(), NOW());

SELECT * FROM servicos;
```

## Opção 2: Via API (Usando cURL)

```bash
# Serviço 1: Corte de Cabelo
curl -X POST http://localhost:3001/api/servicos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Corte de Cabelo",
    "descricao": "Corte masculino tradicional",
    "preco": 50.00,
    "duracao": 60
  }'

# Serviço 2: Barba
curl -X POST http://localhost:3001/api/servicos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Barba",
    "descricao": "Aparar e modelar barba",
    "preco": 30.00,
    "duracao": 30
  }'

# Serviço 3: Corte + Barba
curl -X POST http://localhost:3001/api/servicos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Corte + Barba",
    "descricao": "Combo completo",
    "preco": 70.00,
    "duracao": 90
  }'
```

## Opção 3: Via Postman/Insomnia

1. **URL:** `POST http://localhost:3001/api/servicos`
2. **Headers:** `Content-Type: application/json`
3. **Body (JSON):**

```json
{
  "nome": "Corte de Cabelo",
  "descricao": "Corte masculino tradicional",
  "preco": 50.00,
  "duracao": 60
}
```

Repita para cada serviço que você quiser oferecer.

## Verificar se os Serviços foram Cadastrados

```bash
# Via cURL
curl http://localhost:3001/api/servicos

# Ou via SQL
SELECT * FROM servicos;
```

## Depois de Cadastrar

Após cadastrar os serviços, teste novamente no WhatsApp. O bot agora deve mostrar:

```
Qual serviço deseja realizar? Digite o número:
1) Corte de Cabelo - R$ 50
2) Barba - R$ 30
3) Corte + Barba - R$ 70
0) Cancelar
```

## Personalizar Serviços

Você pode adicionar quantos serviços quiser! Exemplos:

- Hidratação Capilar
- Coloração
- Luzes
- Progressiva
- Sobrancelha
- etc.

Basta usar o mesmo formato acima com os dados do seu serviço.
