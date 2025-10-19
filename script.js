// --- Dados e Estado ---
let filtros = JSON.parse(localStorage.getItem('filtros')) || [];

// --- Elementos DOM ---
const elements = {
    localInput: document.getElementById('localInput'),
    addBtn: document.getElementById('addBtn'),
    filtrosList: document.getElementById('filtrosList'),
    emptyState: document.getElementById('emptyState'),
    counter: document.getElementById('counter'),
    toast: document.getElementById('toast')
};

// --- Funções Utilitárias ---
const utils = {
    // Salvar filtros no localStorage
    salvarFiltros: () => {
        localStorage.setItem('filtros', JSON.stringify(filtros));
    },

    // Mostrar notificação toast
    showToast: (message, type = 'success') => {
        const toast = elements.toast;
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    // Validar input
    validarLocal: (local) => {
        if (!local.trim()) {
            utils.showToast('Por favor, digite um local', 'error');
            return false;
        }
        
        if (filtros.includes(local.trim())) {
            utils.showToast('Este local já foi adicionado', 'error');
            return false;
        }
        
        return true;
    },

    // Atualizar contador
    atualizarContador: () => {
        elements.counter.textContent = filtros.length;
    },

    // Alternar empty state
    toggleEmptyState: () => {
        if (filtros.length === 0) {
            elements.emptyState.style.display = 'block';
            elements.filtrosList.style.display = 'none';
        } else {
            elements.emptyState.style.display = 'none';
            elements.filtrosList.style.display = 'grid';
        }
    }
};

// --- Funções Principais ---
const mainFunctions = {
    // Adicionar local
    adicionarLocal: () => {
        const local = elements.localInput.value.trim();
        
        if (!utils.validarLocal(local)) return;
        
        // Simular loading
        elements.addBtn.classList.add('loading');
        
        setTimeout(() => {
            filtros.push(local);
            utils.salvarFiltros();
            mainFunctions.renderFiltros();
            elements.localInput.value = '';
            utils.showToast(`"${local}" adicionado com sucesso!`);
            elements.addBtn.classList.remove('loading');
        }, 500);
    },

    // Remover local
    removerLocal: (index) => {
        const localRemovido = filtros[index];
        filtros.splice(index, 1);
        utils.salvarFiltros();
        mainFunctions.renderFiltros();
        utils.showToast(`"${localRemovido}" removido`, 'warning');
    },

    // Renderizar lista de filtros
    renderFiltros: () => {
        elements.filtrosList.innerHTML = '';
        
        filtros.forEach((filtro, index) => {
            const card = document.createElement('div');
            card.className = 'location-card';
            card.innerHTML = `
                <div class="card-content">
                    <div class="location-info">
                        <span class="location-name">${filtro}</span>
                        <a href="${mainFunctions.gerarLink(filtro)}" 
                           target="_blank" 
                           class="location-link"
                           onclick="event.stopPropagation()">
                            <span class="material-icons">open_in_new</span>
                            Ver vagas
                        </a>
                    </div>
                    <button class="remove-btn" onclick="event.stopPropagation(); mainFunctions.removerLocal(${index})">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `;

            // Clique no card abre o link
            card.addEventListener('click', () => {
                window.open(mainFunctions.gerarLink(filtro), '_blank');
            });

            elements.filtrosList.appendChild(card);
        });

        utils.atualizarContador();
        utils.toggleEmptyState();
    },

    // Gerar link da vaga
    gerarLink: (local) => {
        return `https://grupocarrefourbrasil.pandape.infojobs.com.br/?Keywords=${encodeURIComponent(local)}&Salary=null&SalaryUpper=true&Deficiency=2`;
    }
};

// --- Event Listeners ---
const setupEventListeners = () => {
    // Botão adicionar
    elements.addBtn.addEventListener('click', mainFunctions.adicionarLocal);
    
    // Enter no input
    elements.localInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            mainFunctions.adicionarLocal();
        }
    });
    
    // Foco no input ao carregar a página
    elements.localInput.focus();
};

// --- Inicialização ---
const init = () => {
    setupEventListeners();
    mainFunctions.renderFiltros();
    utils.toggleEmptyState();
};

// Iniciar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);

// Tornar funções globais para uso nos event listeners do HTML
window.mainFunctions = mainFunctions;