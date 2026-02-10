let livros = [];
let statusSelecionado = 'todos';

const statusMap = {
    'WANT_TO_READ': { front: 'desejado', label: 'Desejado', color: 'desejado' },
    'READING': { front: 'lendo', label: 'Lendo', color: 'lendo' },
    'READ': { front: 'lido', label: 'Lido', color: 'lido' },
    'BORROWED': { front: 'emprestado', label: 'Emprestado', color: 'emprestado' }
};

document.addEventListener('DOMContentLoaded', function() {
    inicializarEventos();
    inicializarLivros();
    atualizarEstatisticas();
    adicionarFiltros();
});

function inicializarLivros() {
    const livrosSalvos = localStorage.getItem('bookHubLivrosNovos');

    if (livrosSalvos) {
        livros = JSON.parse(livrosSalvos);

        renderizarNovosLivros();
    } else {
        livros = [];
    }

    adicionarControlesLivrosHTML();
}

function adicionarControlesLivrosHTML() {
    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');

    livrosHTML.forEach(cartao => {
        const capaContainer = cartao.querySelector('.capa-container');

        if (capaContainer && !capaContainer.querySelector('.controles-livro')) {
            const controlesHTML = `
                <div class="controles-livro">
                    <button class="btn-controle btn-mudar-status" title="Mudar status">
                        <i class="bi bi-arrow-repeat"></i>
                    </button>
                </div>
            `;

            capaContainer.insertAdjacentHTML('beforeend', controlesHTML);

            const btnMudarStatus = capaContainer.querySelector('.btn-mudar-status');
            if (btnMudarStatus) {
                btnMudarStatus.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const etiqueta = capaContainer.querySelector('.etiqueta-status');
                    if (etiqueta) {
                        mudarStatusLivroHTML(etiqueta);
                    }
                });
            }
        }
    });
}

function mudarStatusLivroHTML(etiqueta) {
    const statusOrder = ['lendo', 'lido', 'desejado', 'emprestado'];
    const statusAtual = etiqueta.className.split(' ')[1]; // Pega a segunda classe
    const currentIndex = statusOrder.indexOf(statusAtual);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const novoStatus = statusOrder[nextIndex];

    // Atualizar classe e texto
    etiqueta.className = `etiqueta-status ${novoStatus}`;

    // Atualizar texto baseado no status
    const statusLabels = {
        'lendo': 'Lendo',
        'lido': 'Lido',
        'desejado': 'Desejado',
        'emprestado': 'Emprestado'
    };

    etiqueta.textContent = statusLabels[novoStatus] || 'Lendo';

    // Atualizar estatísticas
    atualizarEstatisticas();
}

// Configurar eventos
function inicializarEventos() {
    // Botões de status no modal
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-status').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('statusLivro').value = this.dataset.status;
        });
    });

    // Formulário de adicionar livro
    const formulario = document.getElementById('formularioLivro');
    if (formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault();

            const titulo = document.getElementById('tituloLivro').value.trim();
            const autor = document.getElementById('autorLivro').value.trim();
            const status = document.getElementById('statusLivro').value;
            const capa = document.getElementById('capaLivro').value.trim();

            if (!titulo || !autor) {
                alert('Por favor, preencha título e autor');
                return;
            }

            // Mapear status do front para back
            const statusBackend = mapearStatusParaBackend(status);
            const statusInfo = mapearStatusParaFront(statusBackend);

            const novoLivro = {
                id: Date.now(), // ID único baseado no timestamp
                titulo: titulo,
                autor: autor,
                status: statusBackend,
                statusFront: status,
                statusLabel: statusInfo.label,
                statusColor: statusInfo.color,
                coverUrl: capa || null
            };

            adicionarLivro(novoLivro);

            // Resetar formulário
            this.reset();
            document.querySelector('.btn-status[data-status="lendo"]').click();

            // Fechar modal
            const modalEl = document.getElementById('modalLivro');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            }
        });
    }
}

// Funções auxiliares
function mapearStatusParaBackend(statusFront) {
    const map = {
        'desejado': 'WANT_TO_READ',
        'lendo': 'READING',
        'lido': 'READ',
        'emprestado': 'BORROWED',
    };
    return map[statusFront] || 'WANT_TO_READ';
}

function mapearStatusParaFront(statusBackend) {
    return statusMap[statusBackend] || { front: 'desejado', label: 'Desejado', color: 'desejado' };
}

// Renderizar APENAS os novos livros (adicionados pelo JS)
function renderizarNovosLivros() {
    const container = document.getElementById('gradeLivrosRecentes');
    if (!container) return;

    // Filtrar livros (para mostrar apenas os relevantes quando houver filtros)
    const livrosFiltrados = statusSelecionado === 'todos'
        ? livros
        : livros.filter(l => {
            return l.statusFront === statusSelecionado;
        });

    // Remover apenas os livros adicionados pelo JS (não os do HTML)
    document.querySelectorAll('.cartao-livro[data-id-js]').forEach(el => {
        el.remove();
    });

    // Se não houver livros filtrados, não fazer nada
    if (livrosFiltrados.length === 0) {
        return;
    }

    // Renderizar cada novo livro
    livrosFiltrados.forEach(livro => {
        const livroElement = criarElementoLivroJS(livro);
        container.appendChild(livroElement);
    });
}

// Criar elemento HTML para novo livro (adicionado pelo JS)
function criarElementoLivroJS(livro) {
    const div = document.createElement('div');
    div.className = 'cartao-livro';
    div.setAttribute('data-id-js', livro.id); // Marca como livro do JS

    // Determinar URL da capa
    let capaHTML;
    if (livro.coverUrl && livro.coverUrl !== '') {
        capaHTML = `<img src="${livro.coverUrl}" alt="${livro.titulo}" class="capa-imagem">`;
    } else {
        const tituloAbreviado = livro.titulo.length > 15 ? livro.titulo.substring(0, 15) + '...' : livro.titulo;
        capaHTML = `<div class="capa-padrao">${tituloAbreviado}</div>`;
    }

    div.innerHTML = `
        <div class="capa-container">
            ${capaHTML}
            <span class="etiqueta-status ${livro.statusColor}">
                ${livro.statusLabel}
            </span>
            <div class="controles-livro">
                <button class="btn-controle btn-mudar-status-js" title="Mudar status">
                    <i class="bi bi-arrow-repeat"></i>
                </button>
                <button class="btn-controle btn-remover-js" title="Remover livro">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
        <div class="detalhes-livro">
            <h6 class="titulo-livro">${livro.titulo}</h6>
            <p class="autor-livro">${livro.autor}</p>
        </div>
    `;

    // Configurar fallback para imagem quebrada
    if (livro.coverUrl && livro.coverUrl !== '') {
        const img = div.querySelector('img');
        if (img) {
            img.onerror = function() {
                const tituloAbreviado = livro.titulo.length > 15 ? livro.titulo.substring(0, 15) + '...' : livro.titulo;
                this.parentElement.innerHTML = `<div class="capa-padrao">${tituloAbreviado}</div>`;
            };
        }
    }

    // Adicionar eventos aos botões
    div.querySelector('.btn-mudar-status-js').addEventListener('click', (e) => {
        e.stopPropagation();
        mudarStatusLivroJS(livro.id);
    });

    div.querySelector('.btn-remover-js').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja remover este livro?')) {
            removerLivroJS(livro.id);
        }
    });

    return div;
}

// Funções CRUD para livros do JS
function adicionarLivro(livro) {
    livros.unshift(livro);
    salvarNoLocalStorage();
    atualizarEstatisticas();
    renderizarNovosLivros();
}

function mudarStatusLivroJS(id) {
    const livro = livros.find(l => l.id === id);
    if (!livro) return;

    // Rotacionar status
    const statusOrder = ['desejado', 'lendo', 'lido', 'emprestado'];
    const currentIndex = statusOrder.indexOf(livro.statusFront);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const novoStatusFront = statusOrder[nextIndex];

    // Atualizar objeto
    livro.statusFront = novoStatusFront;
    livro.status = mapearStatusParaBackend(novoStatusFront);

    const statusInfo = mapearStatusParaFront(livro.status);
    livro.statusLabel = statusInfo.label;
    livro.statusColor = statusInfo.color;

    salvarNoLocalStorage();
    atualizarEstatisticas();
    renderizarNovosLivros();
}

function removerLivroJS(id) {
    const index = livros.findIndex(l => l.id === id);
    if (index !== -1) {
        livros.splice(index, 1);
        salvarNoLocalStorage();
        atualizarEstatisticas();
        renderizarNovosLivros();
    }
}

function salvarNoLocalStorage() {
    localStorage.setItem('bookHubLivrosNovos', JSON.stringify(livros));
}

// Adicionar filtros de status
function adicionarFiltros() {
    const cabecalho = document.querySelector('.painel-cabecalho h3');
    if (!cabecalho) return;

    const filtrosExistentes = document.querySelector('.filtros-status');
    if (filtrosExistentes) {
        filtrosExistentes.remove();
    }

    const filtrosHTML = `
        <div class="filtros-status mt-3">
            <span class="filtro-status ${statusSelecionado === 'todos' ? 'active' : ''}" data-filtro="todos">Todos</span>
            <span class="filtro-status ${statusSelecionado === 'lendo' ? 'active' : ''}" data-filtro="lendo">Lendo</span>
            <span class="filtro-status ${statusSelecionado === 'lido' ? 'active' : ''}" data-filtro="lido">Lidos</span>
            <span class="filtro-status ${statusSelecionado === 'emprestado' ? 'active' : ''}" data-filtro="emprestado">Emprestados</span>
            <span class="filtro-status ${statusSelecionado === 'desejado' ? 'active' : ''}" data-filtro="desejado">Desejados</span>
        </div>
    `;

    cabecalho.insertAdjacentHTML('afterend', filtrosHTML);

    // Eventos dos filtros
    document.querySelectorAll('.filtro-status').forEach(filtro => {
        filtro.addEventListener('click', function() {
            statusSelecionado = this.dataset.filtro;
            document.querySelectorAll('.filtro-status').forEach(f => f.classList.remove('active'));
            this.classList.add('active');

            // Aplicar filtro tanto aos livros do HTML quanto do JS
            aplicarFiltroLivros();
        });
    });
}

// Aplicar filtro a todos os livros (HTML + JS)
function aplicarFiltroLivros() {
    // Primeiro, mostrar/esconder livros do HTML
    const todosLivrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');

    todosLivrosHTML.forEach(cartao => {
        const etiqueta = cartao.querySelector('.etiqueta-status');
        if (etiqueta) {
            const statusLivro = etiqueta.className.split(' ')[1]; // Pega a classe de status

            if (statusSelecionado === 'todos' || statusLivro === statusSelecionado) {
                cartao.style.display = 'block';
            } else {
                cartao.style.display = 'none';
            }
        }
    });

    // Depois, renderizar livros do JS com o filtro
    renderizarNovosLivros();
}

// Atualizar estatísticas (contando livros do HTML + JS)
function atualizarEstatisticas() {
    // Contar livros do HTML
    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');

    let totalHTML = livrosHTML.length;
    let lendoHTML = 0;
    let lidoHTML = 0;
    let desejadoHTML = 0;
    let emprestadoHTML = 0;

    livrosHTML.forEach(cartao => {
        const etiqueta = cartao.querySelector('.etiqueta-status');
        if (etiqueta) {
            const statusClass = etiqueta.className.split(' ')[1];

            switch(statusClass) {
                case 'lendo': lendoHTML++; break;
                case 'lido': lidoHTML++; break;
                case 'desejado': desejadoHTML++; break;
                case 'emprestado': emprestadoHTML++; break;
            }
        }
    });

    // Contar livros do JS
    const lendoJS = livros.filter(l => l.statusFront === 'lendo').length;
    const lidoJS = livros.filter(l => l.statusFront === 'lido').length;
    const desejadoJS = livros.filter(l => l.statusFront === 'desejado').length;
    const emprestadoJS = livros.filter(l => l.statusFront === 'emprestado').length;

    // Totais combinados
    const total = totalHTML + livros.length;
    const lendoTotal = lendoHTML + lendoJS;
    const desejadoTotal = desejadoHTML + desejadoJS;

    document.getElementById('totalLivros').textContent = total;
    document.getElementById('lendoAgora').textContent = lendoTotal;
    document.getElementById('listaDesejos').textContent = desejadoTotal;
    document.getElementById('emprestimosAtivos').textContent = '0';
}

console.log('Book Hub iniciado com sucesso! Mantendo livros do HTML intactos.');