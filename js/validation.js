export default class FormValidator {
    constructor() {
        this.form = null;
    }

    initializeForm(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) return;

        // Validacao em tempo real (ao sair do campo)
        this.form.querySelectorAll("[data-validate]").forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
        });

        // Validacao no envio
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                // Coleta dados e dispara evento customizado.
                const formData = new FormData(this.form);
                const data = Object.fromEntries(formData.entries());
                
                // Converte os IDs do form pros nomes corretos do objeto
                const transactionData = {
                    id: data['transaction-id'] || null, // Pega o ID ocult
                    description: data.description,
                    amount: data.amount,
                    type: data.type,
                    category: data.category,
                    date: data.date
                };

                const event = new CustomEvent('form-valid', { 
                    bubbles: true, // Permite o evento "borbulha" ate o #app-content
                    detail: transactionData 
                });
                this.form.dispatchEvent(event);
            }
        });
    }

    validateForm() {
        let isValid = true;
        this.form.querySelectorAll("[data-validate]").forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        return isValid;
    }

    validateField(field) {
        const rules = field.dataset.validate.split('|');
        let isValid = true;
        
        for (const rule of rules) {
            const [ruleName, param] = rule.split(':');
            isValid = this.applyRule(field, ruleName, param);
            if (!isValid) break; // Para no primeiro err
        }
        
        this.toggleError(field, !isValid);
        return isValid;
    }

    applyRule(field, rule, param) {
        const value = field.value.trim();

        switch (rule) {
            case 'required':
                return value !== '';
            case 'min':
                return value.length >= parseInt(param, 10);
            case 'positive':
                return parseFloat(value) > 0;
            case 'pastOrToday':
                const today = new Date();
                today.setHours(23, 59, 59, 999); // Fim do dia de hoje
                const inputDate = new Date(value);
                // Adiciona o fuso horario pra evitar problemas de "um dia a menos"
                inputDate.setMinutes(inputDate.getMinutes() + inputDate.getTimezoneOffset());
                return inputDate <= today;
            default:
                return true;
        }
    }

    toggleError(field, show) {
        const message = field.nextElementSibling; // <span class="validation-message">
        if (show) {
            field.classList.add('invalid');
            if (message) message.style.display = 'block';
        } else {
            field.classList.remove('invalid');
            if (message) message.style.display = 'none';
        }
    }

    resetForm() {
        if (!this.form) return;
        this.form.reset();
        this.form.querySelectorAll("[data-validate]").forEach(field => {
            this.toggleError(field, false);
        });
        // Reseta o campo de ID oculto
        this.form.querySelector("#transaction-id").value = '';
    }
}