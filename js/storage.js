export default class Storage {
    constructor(key = 'financeflow_transactions') {
        this.key = key;
        // Chave pras Configurações
        this.settingsKey = 'financeflow_settings';

        if (!localStorage.getItem(this.key)) {
            localStorage.setItem(this.key, JSON.stringify([]));
        }

        // inicializa as configs se nao existirem
        this.initializeSettings();
    }

    getTransactions() {
        const transactions = JSON.parse(localStorage.getItem(this.key)) || [];
        // Ordena por data, da mais recente pra mais antiga
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getTransactionById(id) {
        return this.getTransactions().find(t => t.id === id);
    }

    saveTransaction(transactionData) {
        const transactions = this.getTransactions();
        
        if (transactionData.id) {
            // UPDATE
            const idToUpdate = parseInt(transactionData.id, 10);
            const index = transactions.findIndex(t => t.id === idToUpdate);
            if (index !== -1) {
                transactions[index] = {
                    ...transactions[index], 
                    ...transactionData,     
                    id: idToUpdate,         
                    amount: parseFloat(transactionData.amount) 
                };
            }
        } else {
            // CREATE
            const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
            const newTransaction = {
                ...transactionData,
                id: newId,
                amount: parseFloat(transactionData.amount),
                createdAt: new Date().toISOString()
            };
            transactions.push(newTransaction);
        }
        
        localStorage.setItem(this.key, JSON.stringify(transactions));
    }

    deleteTransaction(id) {
        const idToDelete = parseInt(id, 10);
        let transactions = this.getTransactions();
        transactions = transactions.filter(t => t.id !== idToDelete);
        localStorage.setItem(this.key, JSON.stringify(transactions));
    }
    
    getDefaultSettings() {
        return {
            monthlyGoal: 500, // Meta de R$ 500
            categories: [
                "Alimentação", 
                "Transporte", 
                "Moradia", 
                "Lazer", 
                "Saúde", 
                "Educação", 
                "Trabalho", 
                "Outros"
            ]
        };
    }

    initializeSettings() {
        const settings = localStorage.getItem(this.settingsKey);
        if (!settings) {
            localStorage.setItem(this.settingsKey, JSON.stringify(this.getDefaultSettings()));
        }
    }

    getSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem(this.settingsKey));
            if (!settings) {
                this.initializeSettings();
                return this.getDefaultSettings();
            }
            return settings;
        } catch (e) {
            this.initializeSettings();
            return this.getDefaultSettings();
        }
    }

    saveSettings(settings) {
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    }
}