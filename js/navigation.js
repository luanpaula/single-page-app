export default class Navigation {
    constructor(dependencies) {
        this.storage = dependencies.storage;
        this.templates = dependencies.templates;
        this.manager = dependencies.manager;
        this.validator = dependencies.validator;
        
        this.contentTarget = document.getElementById('app-content');
        this.navLinks = document.querySelectorAll('.nav-link');

        window.addEventListener('hashchange', this.handleRouteChange.bind(this));
        window.addEventListener('load', this.handleRouteChange.bind(this));

        this.contentTarget.addEventListener('click', this.handleDynamicEvents.bind(this));
        this.contentTarget.addEventListener('form-valid', this.handleFormSubmit.bind(this));
        
        this.contentTarget.addEventListener('change', (e) => {
            if (e.target.closest('#form-reports-filter')) {
                this.handleReportFilterChange();
            }
        });

        this.contentTarget.addEventListener('submit', this.handleSettingsFormSubmit.bind(this));
    }

    handleRouteChange() {
        const hash = window.location.hash || '#dashboard';
        
        this.contentTarget.innerHTML = '<h1>Carregando...</h1>';
        this.updateActiveLink(hash);

        switch (hash) {
            case '#dashboard':
                this.showDashboard();
                break;
            case '#transactions':
                this.showTransactions();
                break;
            case '#reports':
                this.showReports();
                break;
            case '#settings':
                this.showSettings(); // Atualizado
                break;
            default:
                this.show404();
        }
    }

    updateActiveLink(hash) {
        this.navLinks.forEach(link => {
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // renderiza pags

    showDashboard() {
        const stats = this.manager.getDashboardStats();
        const cardsHTML = this.templates.renderDashboardCards(stats);
        const chartsHTML = this.templates.renderCharts(stats.chartData);
        
        this.contentTarget.innerHTML = `
            <h2>Dashboard</h2>
            <div class="dashboard-cards">${cardsHTML}</div>
            <div class="dashboard-charts">${chartsHTML}</div>
        `;
    }

    showTransactions() {
        this.renderTransactionPage();
    }

    renderTransactionPage(editingTransaction = {}) {
        const transactions = this.storage.getTransactions();
        const settings = this.storage.getSettings();
        const categories = settings.categories;
        
        const formHTML = this.templates.renderTransactionForm(editingTransaction, categories);
        const listHTML = this.templates.renderTransactionList(transactions);
        
        this.contentTarget.innerHTML = `
            <h2>Transações</h2>
            <div class="card" id="form-card">${formHTML}</div>
            <div id="list-card-container" style="margin-top: 2rem;"> 
                ${listHTML}
            </div>
        `;
        
        this.validator.initializeForm('form-transaction');
        this.validator.resetForm();
    }

    // Pag Relatorios
    showReports() {
        const settings = this.storage.getSettings();
        const categories = settings.categories;
        this.contentTarget.innerHTML = this.templates.renderReportsPage(categories);
        
        const dateEndField = document.getElementById('filter-date-end');
        if(dateEndField) {
            dateEndField.value = new Date().toISOString().split('T')[0];
        }

        this.handleReportFilterChange();
    }

    handleReportFilterChange() {
        const form = document.getElementById('form-reports-filter');
        if (!form) return; 

        const formData = new FormData(form);
        const filters = Object.fromEntries(formData.entries());
        filters.dateStart = filters.dateStart || null;
        filters.dateEnd = filters.dateEnd || null;
        filters.type = filters.type || 'all';
        filters.category = filters.category || 'all';

        const reportData = this.manager.getReportData(filters);

        const summaryContainer = document.getElementById('reports-summary');
        if (summaryContainer) {
            summaryContainer.innerHTML = this.templates.renderDashboardCards(reportData.summary);
        }

        const listContainer = document.getElementById('reports-list-container');
        if (listContainer) {
            listContainer.innerHTML = this.templates.renderTransactionList(reportData.transactions);
        }
    }

    // Pagina Configs
    showSettings() {
        const settings = this.storage.getSettings();
        this.contentTarget.innerHTML = this.templates.renderSettingsPage(settings);
    }

    show404() {
        this.contentTarget.innerHTML = '<h2>Erro 404: Página não encontrada</h2>';
    }

    handleFormSubmit(e) {
        const transactionData = e.detail;
        this.storage.saveTransaction(transactionData);
        this.renderTransactionPage();
    }

    handleSettingsFormSubmit(e) {
        // Impede o envio dos forms de Configurações
        if (e.target.id === 'form-goal-settings' || e.target.id === 'form-category-add') {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const settings = this.storage.getSettings();

            // Salva a Meta Mensal
            if (form.id === 'form-goal-settings') {
                settings.monthlyGoal = parseFloat(data.monthlyGoal) || 0;
                this.storage.saveSettings(settings);
                alert('Meta salva com sucesso!');
            }

            // Adicionando nova Categoria
            if (form.id === 'form-category-add') {
                const newCategory = data.newCategory.trim();
                if (newCategory && !settings.categories.includes(newCategory)) {
                    settings.categories.push(newCategory);
                    this.storage.saveSettings(settings);
                    this.showSettings(); // Re-renderiza a pagina para mostrar a nova lista
                } else if (!newCategory) {
                    alert('Por favor, digite um nome para a categoria.');
                } else {
                    alert('Esta categoria ja existe.');
                }
            }
        }
    }

    handleDynamicEvents(e) {
        // Excluir Transacao
        if (e.target.matches('.btn-delete')) {
            const id = e.target.dataset.id;
            if (confirm("Tem certeza que deseja excluir esta transação?")) {
                this.storage.deleteTransaction(id);
                if (window.location.hash === '#transactions') {
                    this.renderTransactionPage();
                } else if (window.location.hash === '#reports') {
                    this.handleReportFilterChange();
                }
            }
        }

        // Editar Transacao
        if (e.target.matches('.btn-edit')) {
            const id = parseInt(e.target.dataset.id, 10);
            const transaction = this.storage.getTransactionById(id);
            if (transaction) {
                window.location.hash = '#transactions';
                this.renderTransactionPage(transaction);
                this.contentTarget.querySelector('#form-card').scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        // Cancelar Edicao
        if (e.target.matches('#btn-cancel-update')) {
            this.renderTransactionPage();
        }

        // Excluir Categoria
        if (e.target.matches('.btn-delete-category')) {
            const categoryToDelete = e.target.dataset.category;
            
            // IMPORTANTE - Adicionar checagem se a categoria esta em uso **************************
            
            if (confirm(`Tem certeza que deseja excluir a categoria "${categoryToDelete}"?`)) {
                const settings = this.storage.getSettings();
                settings.categories = settings.categories.filter(c => c !== categoryToDelete);
                this.storage.saveSettings(settings);
                this.showSettings();
            }
        }
    }
}