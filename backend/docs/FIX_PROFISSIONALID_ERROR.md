# Correção do Erro: Field 'profissionalId' doesn't have a default value

## Problema
A tabela `servicos` no banco de dados tem uma coluna `profissionalId` que não está definida no modelo Sequelize, causando erro ao tentar inserir novos serviços.

## Solução

Execute este comando SQL para remover a coluna `profissionalId` da tabela `servicos`:

```sql
USE agendamento_bot;
ALTER TABLE servicos DROP COLUMN profissionalId;
```

## Alternativa (se você quiser manter a coluna)

Se você quiser que os serviços sejam vinculados a profissionais específicos, execute:

```sql
USE agendamento_bot;
ALTER TABLE servicos MODIFY COLUMN profissionalId CHAR(36) NULL;
```

Isso tornará a coluna opcional (NULL).

## Depois de Executar

Reinicie o backend e tente cadastrar o serviço novamente:

```bash
curl -X POST http://localhost:3001/api/servicos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Corte de Cabelo",
    "descricao": "Corte masculino tradicional",
    "preco": 50.00,
    "duracao": 60,
    "ativo": true
  }'
```

## Recomendação

**Remova a coluna `profissionalId`** se os serviços são globais (todos os profissionais oferecem os mesmos serviços). Essa é a abordagem mais simples para o seu caso de uso atual.
