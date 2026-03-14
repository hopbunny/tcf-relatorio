# 📊 TCF -- Relatório de Serviços Técnicos

Sistema web desenvolvido para **gerenciar e visualizar relatórios de
serviços realizados por técnicos**. A aplicação permite registrar
atendimentos, visualizar técnicos, organizar serviços e gerar relatórios
de forma simples e eficiente.

O objetivo do projeto é facilitar o **controle das atividades
técnicas**, centralizando informações como atendimentos realizados,
técnicos responsáveis e detalhes dos serviços executados.

------------------------------------------------------------------------

# 🚀 Funcionalidades

-   📋 Cadastro e visualização de **serviços técnicos**
-   👨‍🔧 Gerenciamento de **técnicos**
-   🗺️ Visualização de **localização e rotas**
-   📊 Organização de **relatórios de serviços**
-   📄 Geração de **relatórios em PDF**
-   🧭 Planejamento de rotas para atendimentos
-   🎨 Interface moderna e responsiva

------------------------------------------------------------------------

# 🏗️ Estrutura do Projeto

O projeto está dividido em três partes principais:

    client/   → Interface do usuário (Frontend)
    server/   → API e lógica do sistema (Backend)
    shared/   → Tipos e utilidades compartilhadas

### Frontend

Localizado em:

    client/src

Responsável por:

-   Interface do sistema
-   Componentes visuais
-   Dashboard
-   Listagem de técnicos e serviços
-   Planejamento de rotas

Tecnologias principais:

-   React
-   TypeScript
-   Vite

------------------------------------------------------------------------

### Backend

Localizado em:

    server/

Responsável por:

-   API do sistema
-   Processamento de dados
-   Integrações
-   Autenticação
-   Comunicação com banco de dados

------------------------------------------------------------------------

### Banco de Dados

Gerenciado através do **Drizzle ORM**.

Arquivos localizados em:

    drizzle/

Incluem:

-   Schema do banco
-   Migrações
-   Relações entre tabelas

------------------------------------------------------------------------

# 🛠️ Tecnologias Utilizadas

-   React
-   TypeScript
-   Vite
-   Node.js
-   tRPC
-   Drizzle ORM
-   PostgreSQL / SQLite
-   Tailwind CSS

------------------------------------------------------------------------

# ⚙️ Instalação

Clone o repositório:

``` bash
git clone https://github.com/seu-usuario/seu-repositorio.git
```

Entre na pasta do projeto:

``` bash
cd tcf-relatorio-tecnico
```

Instale as dependências:

``` bash
pnpm install
```

------------------------------------------------------------------------

# ▶️ Executar o Projeto

Para iniciar o projeto em modo desenvolvimento:

``` bash
pnpm dev
```

O sistema iniciará normalmente em:

    http://localhost:5173

------------------------------------------------------------------------

# 📁 Arquivos Importantes

    package.json → dependências do projeto
    vite.config.ts → configuração do Vite
    tsconfig.json → configuração do TypeScript
    drizzle.config.ts → configuração do banco de dados

------------------------------------------------------------------------

# 📌 Objetivo do Projeto

Este projeto foi criado para **melhorar o controle e organização de
serviços técnicos**, permitindo que empresas acompanhem:

-   atendimentos realizados
-   técnicos responsáveis
-   localização dos serviços
-   relatórios detalhados

------------------------------------------------------------------------

# 📄 Licença

Este projeto pode ser utilizado para fins de estudo e desenvolvimento
interno.
