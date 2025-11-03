export default class TemplateEngine {

    /* icones de categorias */
    getCategoryIcon(category) {
        const iconMap = {
            "Alimentação": "🍔",
            "Transporte": "🚗",
            "Moradia": "🏠",
            "Lazer": "🎉",
            "Saúde": "🩺",
            "Educação": "📚",
            "Trabalho": "💼",
            "Outros": "🛒"
        };
        return iconMap[category] || "🧾";
    }

    renderTransactionList(transactions) {
        if (transactions.length === 0) {
            return "<p>Nenhuma transação encontrada.</p>";
        }
        
        const items = transactions.map(t => {
            const isIncome = t.type === 'income';
            const amountClass = isIncome ? 'transaction-amount-income' : 'transaction-amount-expense';
            const amountSign = isIncome ? '+' : '-';
            const icon = this.getCategoryIcon(t.category);
            const date = new Date(t.date);
            // Corrige fuso horario pra exibicao
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
            const formattedDate = date.toLocaleDateString('pt-BR');

            return `
                <li class="transaction-item card">
                    <div class="transaction-details">
                        <div class="transaction-icon">${icon}</div>
                        <div class="transaction-info">
                            <span class="transaction-description">${t.description}</span>
                            <span class="transaction-category-date">${t.category} • ${formattedDate}</span>
                        </div>
                    </div>
                    
                    <div class="transaction-amount-actions">
                        <span class="transaction-amount ${amountClass}">
                            ${amountSign} R$ ${(parseFloat(t.amount) || 0).toFixed(2)}
                        </span>
                        <div class="transaction-actions">
                            <button class="btn btn-edit" data-id="${t.id}">Editar</button>
                            <button class="btn btn-delete" data-id="${t.id}">Excluir</button>
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        return `
            <ul class="transaction-list">
                ${items}
            </ul>
        `;
    }

    renderDashboardCards(stats) {
        return `
            <div class="card">
                <h3>Receitas (Mês)</h3>
                <p style="color: var(--color-income);">R$ ${(stats.totalIncome || 0).toFixed(2)}</p>
            </div>
            <div class="card">
                <h3>Despesas (Mês)</h3>
                <p style="color: var(--color-expense);">R$ ${(stats.totalExpense || 0).toFixed(2)}</p>
            </div>
            <div class="card">
                <h3>Saldo Atual</h3>
                <p>R$ ${(stats.balance || 0).toFixed(2)}</p>
            </div>
        `;
    }

    renderCharts(chartData) {
        
        let pieHTML = '<h4>Despesas por Categoria (Mês)</h4>';
        const pieData = chartData.pieChartData;

        if (!pieData || pieData.length === 0) {
            pieHTML += '<p>Nenhuma despesa registrada este mês.</p>';
        } else {
            let gradientSegments = [];
            let currentPercentage = 0;
            const colors = ['#c53030', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#d53f8c'];

            const legendItems = pieData.map((item, index) => {
                const color = colors[index % colors.length];
                const start = currentPercentage;
                const end = currentPercentage + item.percentage;
                gradientSegments.push(`${color} ${start}% ${end}%`);
                currentPercentage = end;
                return `
                    <li class="pie-legend-item">
                        <span class="legend-color" style="background-color: ${color};"></span>
                        <span class="legend-label">${item.category} (${item.percentage.toFixed(1)}%)</span>
                        <span class="legend-amount">R$ ${item.amount.toFixed(2)}</span>
                    </li>`;
            }).join('');
            pieHTML += `
                <div class="pie-chart-container">
                    <div class="pie-chart" style="background-image: conic-gradient(${gradientSegments.join(', ')});">
                    </div>
                    <ul class="pie-legend">
                        ${legendItems}
                    </ul>
                </div>
            `;
        }

        let lineHTML = '<h4>Receita vs Despesa (Últimos 6 Meses)</h4>';
        const lineData = chartData.lineChartData;

        if (!lineData || lineData.length === 0) {
            lineHTML += '<p>Dados insuficientes para exibir o gráfico.</p>';
        } else {
            // Encontra o valor maximo para a escala do eixo Y
            const allValues = lineData.flatMap(d => [d.income, d.expense]);
            let maxValue = Math.max(...allValues);
            if (maxValue === 0) maxValue = 100; // Evita divisao por zero
            maxValue = maxValue * 1.1; // Adiciona 10% de margem no topo

            const svgWidth = 300; // Largura base SVG
            const svgHeight = 150; // Altura base SVG
            const padding = 20; // Espaco para labels

            // Funcao para converter (indice, valor) em (x, y) no SVG
            const getCoords = (value, index) => {
                const x = padding + (index * (svgWidth - padding * 2) / (lineData.length - 1));
                const y = (svgHeight - padding) - ((value / maxValue) * (svgHeight - padding * 2));
                return [x, y];
            };

            // Cria os "d" paths para as linhas
            let incomePath = 'M';
            let expensePath = 'M';
            let incomePoints = [];
            let expensePoints = [];
            let xLabels = [];

            lineData.forEach((d, index) => {
                const [incomeX, incomeY] = getCoords(d.income, index);
                const [expenseX, expenseY] = getCoords(d.expense, index);

                incomePath += `${incomeX},${incomeY} L`;
                expensePath += `${expenseX},${expenseY} L`;
                
                incomePoints.push(`<circle cx="${incomeX}" cy="${incomeY}" r="3" class="line-chart-point-income" />`);
                expensePoints.push(`<circle cx="${expenseX}" cy="${expenseY}" r="3" class="line-chart-point-expense" />`);
                xLabels.push(`<text x="${incomeX}" y="${svgHeight - 5}" text-anchor="middle" class="line-chart-label">${d.label}</text>`);
            });

            // Remove o " L" extra do final
            incomePath = incomePath.slice(0, -2);
            expensePath = expensePath.slice(0, -2);

            // Monta o SVG
            lineHTML += `
                <div class="line-chart-container">
                    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" class="line-chart">
                        <line x1="${padding}" y1="${svgHeight - padding}" x2="${svgWidth - padding}" y2="${svgHeight - padding}" class="line-chart-axis" />
                        
                        <path d="${incomePath}" class="line-chart-path-income" fill="none" />
                        <path d="${expensePath}" class="line-chart-path-expense" fill="none" />
                        
                        ${incomePoints.join('')}
                        ${expensePoints.join('')}
                        
                        ${xLabels.join('')}
                    </svg>
                </div>
            `;
        }


        // retorna graficos
        return `
            <div class="card">
                ${pieHTML}
            </div>
            <div class="card">
                ${lineHTML}
            </div>
        `;
    }
    
    renderTransactionForm(transaction = {}, categories = []) {
        const isUpdate = transaction.id != null;
        const title = isUpdate ? "Editar Transação" : "Adicionar Nova Transação";

        const id = transaction.id || '';
        const description = transaction.description || '';
        const amount = transaction.amount || '';
        const type = transaction.type || 'expense';
        const category = transaction.category || '';
        const date = transaction.date || new Date().toISOString().split('T')[0];

        // Gera as <option> das categorias do storage
        const categoryOptions = categories.map(c => 
            `<option value="${c}" ${category === c ? 'selected' : ''}>${c}</option>`
        ).join('');

        return `
            <h3>${title}</h3>
            <form id="form-transaction" novalidate>
                <input type="hidden" id="transaction-id" name="transaction-id" value="${id}">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="description">Descrição</label>
                        <input type="text" id="description" name="description" value="${description}" data-validate="required|min:3" placeholder="Ex: Salário, Aluguel">
                        <span class="validation-message">A descrição deve ter pelo menos 3 caracteres.</span>
                    </div>
                    <div class="form-group">
                        <label for="amount">Valor (R$)</label>
                        <input type="number" id="amount" name="amount" value="${amount}" data-validate="required|positive" step="0.01" placeholder="0.00">
                        <span class="validation-message">O valor deve ser um número positivo.</span>
                    </div>
                    <div class="form-group">
                        <label for="type">Tipo</label>
                        <select id="type" name="type" data-validate="required">
                            <option value="expense" ${type === 'expense' ? 'selected' : ''}>❌ Despesa</option>
                            <option value="income" ${type === 'income' ? 'selected' : ''}>✅ Receita</option>
                        </select>
                        <span class="validation-message">Selecione um tipo.</span>
                    </div>
                    <div class="form-group">
                        <label for="category">Categoria</label>
                        <select id="category" name="category" data-validate="required">
                            <option value="" ${category === '' ? 'selected' : ''} disabled>Selecione...</option>
                            ${categoryOptions}
                        </select>
                        <span class="validation-message">Selecione uma categoria.</span>
                    </div>
                    <div class="form-group">
                        <label for="date">Data</label>
                        <input type="date" id="date" name="date" value="${date}" data-validate="required|pastOrToday">
                        <span class="validation-message">A data não pode ser futura.</span>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">${isUpdate ? 'Atualizar' : 'Salvar'}</button>
                    ${isUpdate ? '<button type="button" id="btn-cancel-update" class="btn">Cancelar</button>' : ''}
                </div>
            </form>
        `;
    }
    
    renderReportsPage(categories = []) {
        
        const categoryOptions = categories.map(c => `<option value="${c}">${c}</option>`).join('');

        return `
            <h2>Relatórios Detalhados</h2>
            <div class="card">
                <form id="form-reports-filter">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="filter-date-start">Data Início</label>
                            <input type="date" id="filter-date-start" name="dateStart">
                        </div>
                        <div class="form-group">
                            <label for="filter-date-end">Data Fim</label>
                            <input type="date" id="filter-date-end" name="dateEnd">
                        </div>
                        <div class="form-group">
                            <label for="filter-type">Tipo</label>
                            <select id="filter-type" name="type">
                                <option value="all">Todos</option>
                                <option value="income">✅ Receitas</option>
                                <option value="expense">❌ Despesas</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="filter-category">Categoria</label>
                            <select id="filter-category" name="category">
                                <option value="all">Todas</option>
                                ${categoryOptions}
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            
            <div class="card" id="reports-results-container">
                <h3>Resultados do Filtro</h3>
                <div id="reports-summary" class="dashboard-cards"></div>
                <div id="reports-list-container" style="margin-top: 2rem;"></div>
            </div>
        `;
    }

    renderSettingsPage(settings) {
        // 1. Gera a lista de categorias existentes com botoes de excluir
        const categoryListHTML = settings.categories.map(category => `
            <li class="category-list-item">
                <span>${category}</span>
                <button class="btn btn-delete btn-delete-category" data-category="${category}">Excluir</button>
            </li>
        `).join('');

        // 2. Monta o HTML da pagina
        return `
            <h2>Configurações</h2>

            <div class="card">
                <h3>Definir Meta de Economia Mensal</h3>
                <form id="form-goal-settings" class="form-grid">
                    <div class="form-group">
                        <label for="monthly-goal">Meta (R$)</label>
                        <input type="number" id="monthly-goal" name="monthlyGoal" step="0.01" 
                               value="${settings.monthlyGoal || 0}" placeholder="500.00">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Salvar Meta</button>
                    </div>
                </form>
            </div>

            <div class="card">
                <h3>Gerenciar Categorias</h3>
                
                <form id="form-category-add" class="form-grid">
                    <div class="form-group">
                        <label for="new-category">Nova Categoria</label>
                        <input type="text" id="new-category" name="newCategory" placeholder="Ex: Investimentos">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Adicionar Categoria</button>
                    </div>
                </form>
                
                <div class="category-list-container" style="margin-top: 2rem;">
                    <h4>Categorias Atuais</h4>
                    <ul id="category-list" class="category-list">
                        ${categoryListHTML}
                    </ul>
                </div>
            </div>
        `;
    }
}