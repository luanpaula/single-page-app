export class TransactionService {

    constructor(storageService) {
        this.storage = storageService;
        this.STORAGE_KEY = 'financialApp_transactions'; // Chave principal no localStorage

        // Garante q existe um array vazio no storage se for o primeiro acesso
        if (this.storage.getItem(this.STORAGE_KEY) === null) {
            this.storage.setItem(this.STORAGE_KEY, []);
        }
    }

    /* Read */
    getAllTransactions() {
        return this.storage.getItem(this.STORAGE_KEY) || [];
    }

    getTransactionById(id) {
        const transactions = this.getAllTransactions();
        // Converte o ID para numero para garantir a comparacao correta
        const numericId = parseInt(id);
        return transactions.find(tx => tx.id === numericId);
    }

    /* create */
    addTransaction(transactionData) {
        const transactions = this.getAllTransactions();
        
        // gera ID unico baseado no timestamp
        const newTransaction = {
            id: Date.now(), 
            ...transactionData 
        };

        transactions.push(newTransaction);
        this.storage.setItem(this.STORAGE_KEY, transactions);
        
        console.log('Transacao adicionada:', newTransaction);
        return newTransaction;
    }

    /* delete */
    deleteTransaction(id) {
        let transactions = this.getAllTransactions();
        const numericId = parseInt(id); // Garante q é numero
        
        // Filtra o array, escondendo id para deletar
        const updatedTransactions = transactions.filter(tx => tx.id !== numericId);
        
        this.storage.setItem(this.STORAGE_KEY, updatedTransactions);
        console.log('Transacao removida:', id);
    }

    /* Update */
    updateTransaction(id, updatedData) {
        let transactions = this.getAllTransactions();
        const numericId = parseInt(id);

        // Usa .map() pra criar um novo array atualizado
        const updatedTransactions = transactions.map(tx => {
            if (tx.id === numericId) {
                // Se for a transacao, mescla os dados antigos com os novos
                return { ...tx, ...updatedData };
            }
            // Senao, retorna a transacao original
            return tx;
        });

        this.storage.setItem(this.STORAGE_KEY, updatedTransactions);
        console.log('Transacao atualizada:', id);
    }
}