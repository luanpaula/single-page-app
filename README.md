# FinanceFlow - Gerenciador Financeiro Pessoal

## Sobre a Aplicação

O **FinanceFlow** é uma aplicação web completa do tipo **SPA (Single Page Application)** desenvolvida para o gerenciamento de finanças pessoais. O sistema permite que o usuário cadastre, edite e acompanhe suas receitas e despesas de forma intuitiva, oferecendo um dashboard analítico para visualização de dados.

A aplicação foi construída utilizando **JavaScript puro (Vanilla JS)**, sem o uso de frameworks externos (como React, Vue ou Angular), com foco em demonstrar o domínio de manipulação do DOM, gerenciamento de estado local e modularização de código.

---

## Funcionalidades Principais

A aplicação é dividida em quatro páginas principais, acessíveis sem a necessidade de recarregar o navegador:

1.  **Dashboard:**
    * **Cards de Resumo:** Exibe os totais do mês atual para Receitas, Despesas e o Saldo.
    * **Gráfico de Pizza:** Mostra a distribuição de despesas por categoria no mês corrente.
    * **Gráfico de Linha:** Apresenta a evolução de Receitas (linha verde) vs. Despesas (linha vermelha) ao longo dos últimos 6 meses.

2.  **Transações:**
    * **CRUD Completo:** Permite ao usuário Criar, Ler, Atualizar e Excluir transações.
    * **Validação de Formulário:** O formulário de cadastro possui validação em tempo real (ex: campos obrigatórios, valores positivos) com feedback visual imediato para o usuário.
    * **Lista Dinâmica:** As transações são exibidas em formato de card, com ícones de categoria, facilitando a leitura e a interação em dispositivos móveis.

3.  **Relatórios:**
    * **Filtragem Avançada:** Permite ao usuário filtrar todas as suas transações por um período (data de início e fim), por tipo (receita ou despesa) ou por categoria.
    * **Resumo Dinâmico:** Um balanço (receitas, despesas, saldo) do período filtrado é exibido.
    * **Lista de Resultados:** A lista de transações é atualizada "ao vivo" conforme os filtros são alterados.

4.  **Configurações:**
    * **Gerenciamento de Metas:** O usuário pode definir uma meta de economia mensal, que é salva localmente.
    * **Gerenciamento de Categorias:** O usuário pode adicionar novas categorias ou excluir categorias existentes. Essas categorias são usadas dinamicamente nos formulários de Transação e Relatórios.

5.  **Recursos Adicionais:**
    * **Tema Claro/Escuro:** Um seletor de tema (light/dark mode) que salva a preferência do usuário.
    * **Design Responsivo:** A interface se adapta a todos os tamanhos de tela, desde desktops até dispositivos móveis.

---

## Arquitetura e Métodos Técnicos

O projeto foi estruturado de forma modular para organizar as responsabilidades da aplicação.

### 1. Sistema de SPA (Single Page Application)

* **`navigation.js`:** Atua como o roteador principal da aplicação. Ele monitora o `window.location.hash` (ex: `#dashboard`, `#transactions`) e, ao detectar uma mudança, chama o método apropriado para renderizar a nova página.

### 2. Sistema de Templates JavaScript Próprio

* **`templates.js`:** Funciona como um motor de templates. Nenhum HTML é escrito diretamente no `index.html` (exceto o "shell" principal). Esta classe (`TemplateEngine`) possui métodos (ex: `renderTransactionList`, `renderCharts`) que recebem dados (objetos ou arrays) e retornam o HTML correspondente como *template strings*, que é então injetado no DOM pelo `navigation.js`.

### 3. Persistência de Dados (Armazenamento Local)

* **`storage.js`:** É a única classe que interage com o `localStorage`. Ela gerencia dois itens principais:
    1.  `financeflow_transactions`: Armazena o array de todas as transações do usuário.
    2.  `financeflow_settings`: Armazena um objeto com as categorias personalizadas e a meta de economia.
* Fornece métodos de CRUD (ex: `getTransactions`, `saveTransaction`, `getSettings`, `saveSettings`) para o resto da aplicação.

### 4. Lógica de Negócios

* **`financeManager.js`:** Atua como o "cérebro" analítico. Ele solicita os dados brutos ao `storage.js` e os processa para gerar os dados complexos que o Dashboard precisa (ex: totais mensais, dados agrupados para os gráficos de pizza e linha, e os dados filtrados para os Relatórios).

### 5. Validação de Formulários

* **`validation.js`:** Uma classe reutilizável (`FormValidator`) que se anexa a qualquer formulário. Ela lê atributos `data-validate` (ex: `required|min:3`) nos campos `input`, realiza a validação e controla o feedback visual (mensagens de erro e classes `.invalid`).

### 6. Ponto de Entrada

* **`app.js`:** É o arquivo principal que inicializa a aplicação. Ele aguarda o `DOMContentLoaded`, instancia todas as classes modulares e injeta as dependências (por exemplo, passando a instância do `Storage` para o `FinanceManager`) antes de iniciar o `Navigation`.