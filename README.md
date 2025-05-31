# ChatFlow

ChatFlow é uma aplicação de chat em tempo real que utiliza arquitetura hexagonal e tecnologias modernas para proporcionar uma experiência de comunicação fluida.

## Requisitos

- Node.js (v16+)
- Docker e Docker Compose
- Git

## Estrutura do Projeto

O projeto é dividido em duas partes principais:

- **Backend**: API RESTful construída com NestJS e WebSockets
- **Frontend**: Interface de usuário construída com React, TypeScript e Tailwind CSS

## Configuração e Execução

### 1. Clonando o Repositório

```bash
git clone https://github.com/seu-usuario/chatflow.git
cd chatflow
```

### 2. Iniciando o Banco de Dados

O banco de dados PostgreSQL é executado em um container Docker:

```bash
cd backend
docker-compose up -d
```

Este comando iniciará dois containers:
- `chatflow-postgres`: Banco de dados principal
- `chatflow-postgres-test`: Banco de dados para testes

### 3. Configurando e Iniciando o Backend

```bash
cd backend
npm install
npm run start:dev
```

O servidor backend estará disponível em `http://localhost:3001/api/v1`.

### 4. Configurando e Iniciando o Frontend

```bash
cd frontend
npm install
npm run dev
```

O aplicativo frontend estará disponível em `http://localhost:5173`.

## Características

- **Autenticação**: Registro e login de usuários
- **Chat em Tempo Real**: Comunicação instantânea entre usuários
- **Arquitetura Hexagonal**: Separação clara entre domínio, aplicação e infraestrutura

## Desenvolvimento

O projeto segue as boas práticas de desenvolvimento, incluindo:

- **Clean Code**: Código limpo e legível
- **SOLID**: Princípios de design de software
- **Design Patterns**: Padrões de projeto como Factory, Adapter, etc.
- **KISS**: Mantenha simples (Keep It Simple, Stupid) 