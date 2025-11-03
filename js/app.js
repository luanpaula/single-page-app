import Navigation from './navigation.js';
import Storage from './storage.js';
import FinanceManager from './financeManager.js';
import TemplateEngine from './templates.js';
import FormValidator from './validation.js';

// Aguarda o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    
    // Inicializa os modulos
    const storage = new Storage();
    const templates = new TemplateEngine();
    const manager = new FinanceManager(storage);
    const validator = new FormValidator();
    
    // Navigation renderiza as paginas
    const navigation = new Navigation({
        storage: storage,
        templates: templates,
        manager: manager,
        validator: validator
    });

    // Configuracao do Tema
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.innerText = currentTheme === 'light' ? '🌙' : '☀️';

    themeToggle.addEventListener('click', () => {
        let newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggle.innerText = newTheme === 'light' ? '🌙' : '☀️';
        localStorage.setItem('theme', newTheme); // Salva
    });
});