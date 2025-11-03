export default class FinanceManager {
    constructor(storage) {
        this.storage = storage;
    }

    getDashboardStats() {
        const transactions = this.storage.getTransactions();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filtro pro Mes Atual
        const monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            tDate.setMinutes(tDate.getMinutes() + tDate.getTimezoneOffset());
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });

        // Calculos dos Cards
        const totalIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        const totalExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            
        const balance = totalIncome - totalExpense;

        // Calculos pro Grafico de Pizza Despesas por Categoria
        const expensesByCategory = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                if (!acc[t.category]) {
                    acc[t.category] = 0;
                }
                acc[t.category] += (parseFloat(t.amount) || 0);
                return acc;
            }, {});

        const pieChartData = Object.keys(expensesByCategory).map(category => {
            const amount = expensesByCategory[category];
            const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
            return { category, amount, percentage };
        }).sort((a, b) => b.amount - a.amount);

        // Calculos Grafico de Linha Receita vs Despesa Mensal
        const lineChartData = [];
        const numMonths = 6; // 6 meses (incluindo o atua)

        for (let i = 0; i < numMonths; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();
            const label = date.toLocaleString('pt-br', { month: 'short' });

            lineChartData.push({
                label: label.charAt(0).toUpperCase() + label.slice(1),
                month: month,
                year: year,
                income: 0,
                expense: 0
            });
        }
        // Coloca em ordem cronologica
        lineChartData.reverse(); 

        for (const t of transactions) {
            const tDate = new Date(t.date);
            tDate.setMinutes(tDate.getMinutes() + tDate.getTimezoneOffset());
            const tMonth = tDate.getMonth();
            const tYear = tDate.getFullYear();

            // mes/ano correspondente
            const monthData = lineChartData.find(m => m.month === tMonth && m.year === tYear);
            
            if (monthData) {
                if (t.type === 'income') {
                    monthData.income += (parseFloat(t.amount) || 0);
                } else {
                    monthData.expense += (parseFloat(t.amount) || 0);
                }
            }
        }

        const chartData = {
            pieChartData: pieChartData,
            lineChartData: lineChartData 
        }; 
        return { totalIncome, totalExpense, balance, chartData };
    }

    getReportData(filters = {}) {
        // todas as transacoes
        let transactions = this.storage.getTransactions();

        // filtro Data Inicio
        if (filters.dateStart) {
            try {
                const startDate = new Date(filters.dateStart);
                startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
                startDate.setHours(0, 0, 0, 0); // Garante que comeca à meia-noite
                
                transactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    tDate.setMinutes(tDate.getMinutes() + tDate.getTimezoneOffset());
                    return tDate >= startDate;
                });
            } catch (e) {
                console.error("Data de inicio invalida:", e);
            }
        }

        // filtro Data Fim
        if (filters.dateEnd) {
             try {
                const endDate = new Date(filters.dateEnd);
                endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
                endDate.setHours(23, 59, 59, 999); //fim do dia
                
                transactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    tDate.setMinutes(tDate.getMinutes() + tDate.getTimezoneOffset());
                    return tDate <= endDate;
                });
            } catch (e) {
                console.error("Data de fim invalida:", e);
            }
        }

        // Aplica filtro de Receita/despesa
        if (filters.type && filters.type !== 'all') {
            transactions = transactions.filter(t => t.type === filters.type);
        }

        // filtro de Categoria
        if (filters.category && filters.category !== 'all') {
            transactions = transactions.filter(t => t.category === filters.category);
        }

        // calcula o resumo
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            
        const balance = totalIncome - totalExpense;

        // Retorna os dados prontos pro template
        return {
            summary: {
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                balance: balance
            },
            transactions: transactions // Lista de transacoes ja filtrada e ordenada
        };
    }
}