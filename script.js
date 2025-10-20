// --- Dados e Estado ---
let filtros = JSON.parse(localStorage.getItem('filtros')) || [];
let historicoConsultas = JSON.parse(localStorage.getItem('historico')) || {};
let perfilUsuario = JSON.parse(localStorage.getItem('perfilUsuario')) || {
    locaisFrequentes: [],
    notificacoesAtivas: false
};

// --- Elementos DOM ---
const elements = {
    localInput: document.getElementById('localInput'),
    addBtn: document.getElementById('addBtn'),
    filtrosList: document.getElementById('filtrosList'),
    emptyState: document.getElementById('emptyState'),
    counter: document.getElementById('counter'),
    toast: document.getElementById('toast'),
    recommendationsSection: document.getElementById('recommendationsSection'),
    recomendacoesList: document.getElementById('recomendacoesList'),
    historySection: document.getElementById('historySection'),
    historicoList: document.getElementById('historicoList'),
    clearHistory: document.getElementById('clearHistory'),
    notificationSettings: document.getElementById('notificationSettings'),
    notificationsToggle: document.getElementById('notificationsToggle')
};

// --- Funções Utilitárias ---
const utils = {
    // Salvar dados no localStorage
    salvarDados: () => {
        localStorage.setItem('filtros', JSON.stringify(filtros));
        localStorage.setItem('historico', JSON.stringify(historicoConsultas));
        localStorage.setItem('perfilUsuario', JSON.stringify(perfilUsuario));
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
    },

    // Registrar acesso a local
    registrarAcesso: (local) => {
        const acessos = JSON.parse(localStorage.getItem('acessosLocais')) || {};
        acessos[local] = (acessos[local] || 0) + 1;
        localStorage.setItem('acessosLocais', JSON.stringify(acessos));
    }
};

// --- Sistema de Histórico ---
const sistemaHistorico = {
    // Registrar consulta
    registrarConsulta: (local, vagasEncontradas = 0) => {
        const hoje = new Date().toISOString().split('T')[0];
        
        if (!historicoConsultas[local]) {
            historicoConsultas[local] = [];
        }
        
        historicoConsultas[local].push({
            data: hoje,
            vagas: vagasEncontradas,
            timestamp: new Date().getTime()
        });
        
        // Manter só últimos 30 dias
        historicoConsultas[local] = historicoConsultas[local]
            .filter(consulta => {
                const dataConsulta = new Date(consulta.timestamp);
                const diffTime = Math.abs(new Date() - dataConsulta);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30;
            });
        
        utils.salvarDados();
        return historicoConsultas[local];
    },

    // Calcular tendência
    getTendencia: (local) => {
        const historicoLocal = historicoConsultas[local] || [];
        if (historicoLocal.length < 2) return 'stable';
        
        const recente = historicoLocal[historicoLocal.length - 1].vagas;
        const anterior = historicoLocal[historicoLocal.length - 2].vagas;
        
        if (recente > anterior) return 'up';
        if (recente < anterior) return 'down';
        return 'stable';
    },

    // Renderizar histórico
    renderHistorico: () => {
        const historicoList = elements.historicoList;
        historicoList.innerHTML = '';

        const todosRegistros = [];
        
        Object.entries(historicoConsultas).forEach(([local, registros]) => {
            registros.forEach(registro => {
                todosRegistros.push({
                    local,
                    ...registro
                });
            });
        });

        // Ordenar por timestamp (mais recente primeiro)
        todosRegistros.sort((a, b) => b.timestamp - a.timestamp);
        
        // Pegar últimos 10 registros
        const ultimosRegistros = todosRegistros.slice(0, 10);

        if (ultimosRegistros.length === 0) {
            historicoList.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">history</span>
                    <h3>Nenhum histórico</h3>
                    <p>Seu histórico de consultas aparecerá aqui</p>
                </div>
            `;
            return;
        }

        ultimosRegistros.forEach(registro => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const dataFormatada = new Date(registro.timestamp).toLocaleDateString('pt-BR');
            const tendencia = sistemaHistorico.getTendencia(registro.local);
            const iconeTendencia = tendencia === 'up' ? '📈' : tendencia === 'down' ? '📉' : '➡️';
            
            historyItem.innerHTML = `
                <div class="history-info">
                    <span class="history-local">${registro.local}</span>
                    <span class="history-details">${dataFormatada} • ${iconeTendencia} ${registro.vagas} vagas</span>
                </div>
                <div class="history-vagas">
                    ${registro.vagas} vagas
                </div>
            `;

            historicoList.appendChild(historyItem);
        });
    },

    // Limpar histórico
    limparHistorico: () => {
        historicoConsultas = {};
        utils.salvarDados();
        sistemaHistorico.renderHistorico();
        utils.showToast('Histórico limpo com sucesso', 'info');
    }
};

// --- Sistema de Recomendações ---
const sistemaRecomendacao = {
    // Analisar padrões do usuário
    analisarPadroes: () => {
        const acessos = JSON.parse(localStorage.getItem('acessosLocais')) || {};
        const locaisFrequentes = Object.entries(acessos)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([local]) => local);
        
        perfilUsuario.locaisFrequentes = locaisFrequentes;
        utils.salvarDados();
        
        return locaisFrequentes;
    },

    // Gerar recomendações
    getRecomendacoes: () => {
        const locaisFrequentes = sistemaRecomendacao.analisarPadroes();
        const recomendacoes = new Set();
        
        // Sugerir locais próximos baseado nos frequentes
        locaisFrequentes.forEach(local => {
            const locaisProximos = sistemaRecomendacao.getLocaisProximos(local);
            locaisProximos.forEach(localProximo => {
                if (!filtros.includes(localProximo)) {
                    recomendacoes.add(localProximo);
                }
            });
        });

        return Array.from(recomendacoes).slice(0, 3); // Máximo 3 recomendações
    },

    // Mapeamento de locais próximos
    getLocaisProximos: (local) => {
        const regioes = {
            'Osasco': ['Barueri', 'Carapicuíba', 'São Paulo - Zona Oeste', 'Santana de Parnaíba'],
            'São Paulo': ['Guarulhos', 'Osasco', 'Santo André', 'São Bernardo do Campo', 'Diadema'],
            'Campinas': ['Valinhos', 'Hortolândia', 'Sumaré', 'Indaiatuba', 'Paulínia'],
            'Rio de Janeiro': ['Niterói', 'Duque de Caxias', 'São Gonçalo', 'Nova Iguaçu'],
            'Belo Horizonte': ['Contagem', 'Betim', 'Ribeirão das Neves', 'Sabará'],
            'Porto Alegre': ['Canoas', 'Novo Hamburgo', 'São Leopoldo', 'Gravataí'],
            'Salvador': ['Lauro de Freitas', 'Camaçari', 'Simões Filho', 'Candeias']
        };
        
        return regioes[local] || [];
    },

    // Renderizar recomendações
    renderRecomendacoes: () => {
        const recomendacoes = sistemaRecomendacao.getRecomendacoes();
        const recomendacoesList = elements.recomendacoesList;
        
        if (recomendacoes.length === 0 || filtros.length === 0) {
            elements.recommendationsSection.style.display = 'none';
            return;
        }

        elements.recommendationsSection.style.display = 'block';
        recomendacoesList.innerHTML = '';

        recomendacoes.forEach(local => {
            const card = document.createElement('div');
            card.className = 'location-card recommended';
            card.innerHTML = `
                <div class="card-content">
                    <div class="location-info">
                        <span class="location-name">
                            ${local}
                            <span class="trend-indicator trend-up">💡 Recomendado</span>
                        </span>
                        <a href="${mainFunctions.gerarLink(local)}" 
                           target="_blank" 
                           class="location-link"
                           onclick="event.stopPropagation()">
                            <span class="material-icons">open_in_new</span>
                            Ver vagas
                        </a>
                    </div>
                    <button class="remove-btn" onclick="event.stopPropagation(); sistemaRecomendacao.adicionarRecomendacao('${local}')">
                        <span class="material-icons">add</span>
                    </button>
                </div>
            `;

            card.addEventListener('click', () => {
                window.open(mainFunctions.gerarLink(local), '_blank');
            });

            recomendacoesList.appendChild(card);
        });
    },

    // Adicionar recomendação aos filtros
    adicionarRecomendacao: (local) => {
        if (!filtros.includes(local)) {
            filtros.push(local);
            utils.salvarDados();
            mainFunctions.renderFiltros();
            sistemaRecomendacao.renderRecomendacoes();
            utils.showToast(`"${local}" adicionado às monitorias!`, 'success');
        }
    }
};

// --- Sistema de Notificações ---
const sistemaNotificacoes = {
    ultimaVerificacao: localStorage.getItem('ultimaVerificacao') || null,
    
    init: () => {
        // Configurar toggle de notificações
        if (elements.notificationsToggle) {
            elements.notificationsToggle.checked = perfilUsuario.notificacoesAtivas;
            elements.notificationsToggle.addEventListener('change', (e) => {
                perfilUsuario.notificacoesAtivas = e.target.checked;
                utils.salvarDados();
                
                if (e.target.checked) {
                    sistemaNotificacoes.pedirPermissao();
                    utils.showToast('Notificações ativadas', 'success');
                } else {
                    utils.showToast('Notificações desativadas', 'info');
                }
            });
        }

        // Iniciar verificações agendadas se notificações estão ativas
        if (perfilUsuario.notificacoesAtivas) {
            sistemaNotificacoes.agendarVerificacao();
        }
    },
    
    pedirPermissao: () => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    utils.showToast('Permissão para notificações concedida!', 'success');
                }
            });
        }
    },
    
    verificarMudancas: () => {
        if (!perfilUsuario.notificacoesAtivas) return;
        
        const agora = new Date().getTime();
        const dozeHoras = 12 * 60 * 60 * 1000;
        
        if (!this.ultimaVerificacao || (agora - this.ultimaVerificacao) > dozeHoras) {
            this.mostrarLembrete();
            this.ultimaVerificacao = agora;
            localStorage.setItem('ultimaVerificacao', agora);
        }
    },
    
    mostrarLembrete: () => {
        if (filtros.length > 0 && this.podeNotificar()) {
            const localAleatorio = filtros[Math.floor(Math.random() * filtros.length)];
            
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("📋 Monitor Carrefour", {
                    body: `Hora de verificar vagas em ${localAleatorio}! 🕒`,
                    icon: "/assets/favicon.png",
                    tag: "lembrete-vagas"
                });
            } else {
                // Fallback para toast
                utils.showToast(`💡 Lembrete: Verifique vagas em ${localAleatorio}`, 'info');
            }
            
            localStorage.setItem('ultimaNotificacao', new Date().getTime());
        }
    },
    
    podeNotificar: () => {
        const ultimaNotificacao = localStorage.getItem('ultimaNotificacao');
        if (!ultimaNotificacao) return true;
        
        const umaHora = 60 * 60 * 1000;
        return (new Date().getTime() - ultimaNotificacao) > umaHora;
    },
    
    agendarVerificacao: () => {
        // Verificar a cada 30 minutos
        setInterval(() => this.verificarMudancas(), 30 * 60 * 1000);
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
            utils.salvarDados();
            mainFunctions.renderFiltros();
            elements.localInput.value = '';
            
            // Simular encontro de vagas (número aleatório entre 1-20)
            const vagasEncontradas = Math.floor(Math.random() * 20) + 1;
            sistemaHistorico.registrarConsulta(local, vagasEncontradas);
            utils.registrarAcesso(local);
            
            utils.showToast(`"${local}" adicionado! Encontramos ${vagasEncontradas} vagas.`, 'success');
            elements.addBtn.classList.remove('loading');
            
            // Atualizar recomendações
            sistemaRecomendacao.renderRecomendacoes();
        }, 500);
    },

    // Remover local
    removerLocal: (index) => {
        const localRemovido = filtros[index];
        filtros.splice(index, 1);
        utils.salvarDados();
        mainFunctions.renderFiltros();
        sistemaRecomendacao.renderRecomendacoes();
        utils.showToast(`"${localRemovido}" removido`, 'warning');
    },

    // Renderizar lista de filtros
    renderFiltros: () => {
        elements.filtrosList.innerHTML = '';
        
        filtros.forEach((filtro, index) => {
            const card = document.createElement('div');
            card.className = 'location-card';
            
            const historicoLocal = historicoConsultas[filtro] || [];
            const ultimaConsulta = historicoLocal[historicoLocal.length - 1];
            const vagasUltimaConsulta = ultimaConsulta ? ultimaConsulta.vagas : 0;
            const tendencia = sistemaHistorico.getTendencia(filtro);
            
            const iconeTendencia = tendencia === 'up' ? '📈' : 
                                 tendencia === 'down' ? '📉' : '➡️';
            const classeTendencia = `trend-indicator trend-${tendencia}`;
            
            card.innerHTML = `
                <div class="card-content">
                    <div class="location-info">
                        <span class="location-name">
                            ${filtro}
                            ${vagasUltimaConsulta > 0 ? 
                                `<span class="${classeTendencia}">${iconeTendencia} ${vagasUltimaConsulta}</span>` : 
                                ''
                            }
                        </span>
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
                utils.registrarAcesso(filtro);
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
    
    // Limpar histórico
    if (elements.clearHistory) {
        elements.clearHistory.addEventListener('click', sistemaHistorico.limparHistorico);
    }
    
    // Foco no input ao carregar a página
    elements.localInput.focus();
};

// --- Inicialização ---
const init = () => {
    setupEventListeners();
    mainFunctions.renderFiltros();
    sistemaHistorico.renderHistorico();
    sistemaRecomendacao.renderRecomendacoes();
    sistemaNotificacoes.init();
    utils.toggleEmptyState();
    
    // Verificar se deve mostrar notificação inicial
    setTimeout(() => {
        if (filtros.length > 0 && perfilUsuario.notificacoesAtivas) {
            sistemaNotificacoes.verificarMudancas();
        }
    }, 2000);
};

// Iniciar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);

// Tornar funções globais para uso nos event listeners do HTML
window.mainFunctions = mainFunctions;
window.sistemaRecomendacao = sistemaRecomendacao;
window.sistemaHistorico = sistemaHistorico;