let livros = [];
let statusSelecionado = 'todos';
let generoSelecionado = 'todos';
let livroSelecionadoParaAvaliacao = null;

const statusMap = {
    'WANT_TO_READ': {front: 'desejado', label: 'Desejado', color: 'desejado'},
    'READING': {front: 'lendo', label: 'Lendo', color: 'lendo'},
    'READ': {front: 'lido', label: 'Lido', color: 'lido'},
    'BORROWED': {front: 'emprestado', label: 'Emprestado', color: 'emprestado'}
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    inicializarEventos();
    inicializarLivros();
    processarLivrosHTMLExistentes();
    atualizarTodasEstatisticas(); // Usar uma única função para atualizar tudo
    adicionarFiltros();
    adicionarFiltrosGenero();
    inicializarPerfilUsuario();
    adicionarBuscaAutomaticaAoFormulario();
    adicionarBuscaPorISBN();
    inicializarModalSinopse();
    inicializarSistemaAvaliacao();
    iniciarObservadorDeLivros();
    console.log('📚 BookHub carregado com estatísticas corrigidas!');
});

// ============================================
// FUNÇÃO CORRIGIDA: RENDERIZAR ESTRELAS
// ============================================

function renderizarEstrelas(avaliacao = 0) {
    let estrelasHTML = '<div class="estrelas-pequenas">';
    for (let i = 1; i <= 5; i++) {
        if (i <= avaliacao) {
            estrelasHTML += '<i class="bi bi-star-fill"></i>';
        } else {
            estrelasHTML += '<i class="bi bi-star"></i>';
        }
    }
    estrelasHTML += '</div>';
    return estrelasHTML;
}

// ============================================
// FUNÇÃO CORRIGIDA: OBTER TODOS OS LIVROS (SEM DUPLICAÇÃO)
// ============================================

function obterTodosOsLivros() {
    // Usar apenas o array livros como fonte da verdade
    // O array livros já contém todos os livros (tanto HTML quanto JS)
    return livros.map(livro => ({
        ...livro,
        // Garantir que todos os campos necessários existam
        statusFront: livro.statusFront || 'lendo',
        avaliacao: livro.avaliacao || 0,
        genero: livro.genero || 'Outros',
        ano: livro.ano || new Date().getFullYear()
    }));
}

// ============================================
// FUNÇÃO CORRIGIDA: PROCESSAR LIVROS HTML
// ============================================

function processarLivrosHTMLExistentes() {
    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-processado])');

    livrosHTML.forEach((cartao, index) => {
        // Verificar se já foi processado
        if (cartao.hasAttribute('data-processado')) return;

        cartao.setAttribute('data-processado', 'true');
        cartao.setAttribute('data-tipo', 'html');

        // Gerar ID único
        const livroId = `html-${Date.now()}-${index}-${Math.random()}`;
        cartao.setAttribute('data-id', livroId);

        // Extrair informações
        const titulo = cartao.querySelector('.detalhes-livro h6')?.textContent?.trim() || 'Título desconhecido';
        const autor = cartao.querySelector('.detalhes-livro p')?.textContent?.trim() || 'Autor desconhecido';

        // Tentar encontrar o gênero em diferentes lugares
        let genero = 'Outros';
        const generoElement = cartao.querySelector('.genero-livro');
        if (generoElement) {
            genero = generoElement.textContent?.trim() || 'Outros';
        }

        const capa = cartao.querySelector('.capa-imagem')?.src || '';

        // Determinar status
        const etiqueta = cartao.querySelector('.etiqueta-status');
        let statusAtual = 'lendo';
        let statusLabel = 'Lendo';

        if (etiqueta) {
            if (etiqueta.classList.contains('lido')) {
                statusAtual = 'lido';
                statusLabel = 'Lido';
            } else if (etiqueta.classList.contains('desejado')) {
                statusAtual = 'desejado';
                statusLabel = 'Desejado';
            } else if (etiqueta.classList.contains('emprestado')) {
                statusAtual = 'emprestado';
                statusLabel = 'Emprestado';
            }
        }

        // Verificar se já existe no array (evitar duplicação)
        const existe = livros.some(l => l.id === livroId ||
            (l.titulo === titulo && l.autor === autor && l.isHTML));

        if (!existe) {
            const livroObj = {
                id: livroId,
                titulo: titulo,
                autor: autor,
                statusFront: statusAtual,
                statusLabel: statusLabel,
                statusColor: statusAtual,
                status: mapearStatusParaBackend(statusAtual),
                coverUrl: capa || null,
                genero: genero,
                avaliacao: 0,
                isHTML: true,
                ano: new Date().getFullYear() - Math.floor(Math.random() * 5) // Ano variado para teste
            };
            livros.push(livroObj);
        }

        modificarEstruturaCardSemEstrelas(cartao, livroObj);
    });
}

// ============================================
// FUNÇÃO CORRIGIDA: MODIFICAR ESTRUTURA DO CARD
// ============================================

function modificarEstruturaCardSemEstrelas(cartao, livro) {
    const capaContainer = cartao.querySelector('.capa-container');
    const detalhesLivro = cartao.querySelector('.detalhes-livro');

    if (!capaContainer || !detalhesLivro) return;

    // Remover controles antigos
    const controlesAntigos = capaContainer.querySelector('.controles-livro');
    if (controlesAntigos) controlesAntigos.remove();

    // Adicionar novos controles
    const controlesHTML = `
        <div class="controles-livro">
            <button class="btn-controle btn-mudar-status-html" title="Mudar status">
                <i class="bi bi-arrow-repeat"></i>
            </button>
            <button class="btn-controle btn-avaliar-html" title="Avaliar livro">
                <i class="bi bi-star"></i>
            </button>
            <button class="btn-controle btn-remover-html" title="Remover livro">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    capaContainer.insertAdjacentHTML('beforeend', controlesHTML);

    // Adicionar botão de sinopse
    let sinopseBtn = capaContainer.querySelector('.btn-sinopse');
    if (!sinopseBtn) {
        sinopseBtn = document.createElement('button');
        sinopseBtn.className = 'btn-sinopse';
        sinopseBtn.title = 'Ver sinopse';
        sinopseBtn.innerHTML = '<i class="bi bi-file-text"></i>';
        sinopseBtn.style.position = 'absolute';
        sinopseBtn.style.top = '10px';
        sinopseBtn.style.right = '10px';
        sinopseBtn.style.left = 'auto';
        sinopseBtn.style.bottom = 'auto';
        capaContainer.appendChild(sinopseBtn);
    }

    // Adicionar container de estrelas
    let estrelasContainer = detalhesLivro.querySelector('.estrelas-container');
    if (!estrelasContainer) {
        estrelasContainer = document.createElement('div');
        estrelasContainer.className = 'estrelas-container';
        estrelasContainer.style.marginBottom = '8px';
        estrelasContainer.style.display = 'flex';
        estrelasContainer.style.justifyContent = 'center';

        const titulo = detalhesLivro.querySelector('h6');
        if (titulo) {
            titulo.parentNode.insertBefore(estrelasContainer, titulo);
        } else {
            detalhesLivro.insertBefore(estrelasContainer, detalhesLivro.firstChild);
        }
    }
    estrelasContainer.innerHTML = renderizarEstrelas(livro.avaliacao || 0);

    // Event listeners
    capaContainer.querySelector('.btn-mudar-status-html').addEventListener('click', (e) => {
        e.stopPropagation();
        mudarStatusLivroHTML(cartao, livro);
    });

    capaContainer.querySelector('.btn-avaliar-html').addEventListener('click', (e) => {
        e.stopPropagation();
        livroSelecionadoParaAvaliacao = livro.id;
        const modal = new bootstrap.Modal(document.getElementById('modalAvaliacao'));
        modal.show();
    });

    capaContainer.querySelector('.btn-remover-html').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Tem certeza que deseja remover "${livro.titulo}"?`)) {
            removerLivroHTML(cartao, livro.id);
        }
    });

    sinopseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirSinopse(
            livro.titulo,
            livro.autor,
            livro.coverUrl,
            livro.genero,
            livro.statusLabel
        );
    });
}

// ============================================
// SISTEMA DE AVALIAÇÃO POR ESTRELAS
// ============================================

function inicializarSistemaAvaliacao() {
    document.querySelectorAll('#estrelasModal i').forEach(estrela => {
        estrela.addEventListener('click', function () {
            const nota = parseInt(this.dataset.nota);
            selecionarEstrelas(nota);
        });

        estrela.addEventListener('mouseover', function () {
            const nota = parseInt(this.dataset.nota);
            destacarEstrelas(nota);
        });

        estrela.addEventListener('mouseout', function () {
            restaurarEstrelas();
        });
    });

    const btnSalvar = document.getElementById('salvarAvaliacao');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', function () {
            salvarAvaliacao();
        });
    }

    const modalAvaliacao = document.getElementById('modalAvaliacao');
    if (modalAvaliacao) {
        modalAvaliacao.addEventListener('show.bs.modal', function () {
            carregarAvaliacaoNoModal();
        });
    }
}

function selecionarEstrelas(nota) {
    const estrelas = document.querySelectorAll('#estrelasModal i');
    estrelas.forEach((estrela, index) => {
        if (index < nota) {
            estrela.className = 'bi bi-star-fill';
        } else {
            estrela.className = 'bi bi-star';
        }
    });

    document.getElementById('estrelasModal').dataset.notaSelecionada = nota;
}

function destacarEstrelas(nota) {
    const estrelas = document.querySelectorAll('#estrelasModal i');
    estrelas.forEach((estrela, index) => {
        if (index < nota) {
            estrela.style.color = '#ffd700';
        } else {
            estrela.style.color = '#ddd';
        }
    });
}

function restaurarEstrelas() {
    const estrelas = document.querySelectorAll('#estrelasModal i');
    const notaSelecionada = document.getElementById('estrelasModal').dataset.notaSelecionada;

    estrelas.forEach((estrela, index) => {
        if (notaSelecionada && index < parseInt(notaSelecionada)) {
            estrela.style.color = '#ffd700';
        } else {
            estrela.style.color = '#ddd';
        }
    });
}

function carregarAvaliacaoNoModal() {
    if (!livroSelecionadoParaAvaliacao) return;

    const livro = livros.find(l => l.id === livroSelecionadoParaAvaliacao);
    if (!livro) return;

    const titulo = livro.titulo;
    const avaliacaoAtual = livro.avaliacao || 0;

    const estrelas = document.querySelectorAll('#estrelasModal i');
    estrelas.forEach((estrela, index) => {
        if (index < avaliacaoAtual) {
            estrela.className = 'bi bi-star-fill';
        } else {
            estrela.className = 'bi bi-star';
        }
    });

    document.getElementById('estrelasModal').dataset.notaSelecionada = avaliacaoAtual;
    document.getElementById('avaliacaoLivroAtual').innerHTML = `
        <strong>${titulo}</strong><br>
        <small class="text-muted">Avaliação atual: ${avaliacaoAtual}/5</small>
    `;
}

function salvarAvaliacao() {
    if (!livroSelecionadoParaAvaliacao) return;

    const notaSelecionada = parseInt(document.getElementById('estrelasModal').dataset.notaSelecionada || '0');
    const livro = livros.find(l => l.id === livroSelecionadoParaAvaliacao);

    if (livro) {
        livro.avaliacao = notaSelecionada;

        // Atualizar UI
        const card = document.querySelector(`[data-id="${livroSelecionadoParaAvaliacao}"]`);
        if (card) {
            const estrelasContainer = card.querySelector('.estrelas-container');
            if (estrelasContainer) {
                estrelasContainer.innerHTML = renderizarEstrelas(notaSelecionada);
            }
        }

        salvarNoLocalStorage();
        atualizarTodasEstatisticas();
        mostrarToast(`✅ Livro avaliado com ${notaSelecionada} estrela${notaSelecionada !== 1 ? 's' : ''}!`);
    }
}

function atualizarAvaliacaoMedia() {
    const todosLivros = obterTodosOsLivros();
    const livrosComAvaliacao = todosLivros.filter(l => l.avaliacao && l.avaliacao > 0);

    if (livrosComAvaliacao.length === 0) {
        document.getElementById('avaliacaoMedia').textContent = '0';
        return;
    }

    const soma = livrosComAvaliacao.reduce((acc, livro) => acc + livro.avaliacao, 0);
    const media = (soma / livrosComAvaliacao.length).toFixed(1);
    document.getElementById('avaliacaoMedia').textContent = media;
}

function mostrarToast(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-success position-fixed bottom-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.style.animation = 'slideIn 0.3s ease';
    toast.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${mensagem}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// FUNÇÕES PARA LIVROS HTML
// ============================================

function mudarStatusLivroHTML(cartao, livro) {
    const statusOrder = ['lendo', 'lido', 'desejado', 'emprestado'];
    const statusLabels = {'lendo': 'Lendo', 'lido': 'Lido', 'desejado': 'Desejado', 'emprestado': 'Emprestado'};

    const nextIndex = (statusOrder.indexOf(livro.statusFront) + 1) % statusOrder.length;
    const novoStatus = statusOrder[nextIndex];

    livro.statusFront = novoStatus;
    livro.statusLabel = statusLabels[novoStatus];
    livro.statusColor = novoStatus;
    livro.status = mapearStatusParaBackend(novoStatus);

    const etiqueta = cartao.querySelector('.etiqueta-status');
    if (etiqueta) {
        etiqueta.className = `etiqueta-status ${novoStatus}`;
        etiqueta.textContent = statusLabels[novoStatus];
    }

    salvarNoLocalStorage();
    atualizarTodasEstatisticas();
    mostrarToast(`📖 Status alterado para: ${statusLabels[novoStatus]}`);
}

function removerLivroHTML(cartao, livroId) {
    const index = livros.findIndex(l => l.id === livroId);
    if (index !== -1) {
        livros.splice(index, 1);
    }

    cartao.remove();

    salvarNoLocalStorage();
    atualizarTodasEstatisticas();
    atualizarFiltrosGenero();

    mostrarToast('🗑️ Livro removido com sucesso!');
}

// ============================================
// FUNÇÕES PRINCIPAIS DE LIVROS (JS)
// ============================================

function inicializarLivros() {
    const livrosSalvos = localStorage.getItem('bookHubLivrosNovos');
    if (livrosSalvos) {
        try {
            livros = JSON.parse(livrosSalvos);
        } catch (e) {
            livros = [];
        }
    } else {
        livros = [];
    }

    livros = livros.map(livro => ({
        ...livro,
        avaliacao: livro.avaliacao || 0,
        ano: livro.ano || new Date().getFullYear() - Math.floor(Math.random() * 5),
        statusFront: livro.statusFront || livro.status || 'lendo',
        statusLabel: livro.statusLabel || (livro.status === 'READ' ? 'Lido' :
            livro.status === 'READING' ? 'Lendo' :
                livro.status === 'BORROWED' ? 'Emprestado' : 'Desejado'),
        statusColor: livro.statusColor || livro.statusFront || 'lendo'
    }));

    renderizarNovosLivros();
}

function inicializarEventos() {
    document.querySelectorAll('.btn-status').forEach(btn => btn.addEventListener('click', function () {
        document.querySelectorAll('.btn-status').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('statusLivro').value = this.dataset.status;
    }));

    const formulario = document.getElementById('formularioLivro');
    if (formulario) {
        formulario.addEventListener('submit', function (e) {
            e.preventDefault();
            const titulo = document.getElementById('tituloLivro').value.trim();
            const autor = document.getElementById('autorLivro').value.trim();
            const status = document.getElementById('statusLivro').value;
            const capa = document.getElementById('capaLivro').value.trim();
            const genero = document.getElementById('generoLivro')?.value || 'Outros';

            if (!titulo || !autor) {
                alert('Por favor, preencha título e autor');
                return;
            }

            const statusBackend = mapearStatusParaBackend(status);
            const statusInfo = mapearStatusParaFront(statusBackend);

            const novoLivro = {
                id: Date.now(),
                titulo,
                autor,
                status: statusBackend,
                statusFront: status,
                statusLabel: statusInfo.label,
                statusColor: statusInfo.color,
                coverUrl: capa || null,
                genero: genero,
                avaliacao: 0,
                isHTML: false,
                ano: new Date().getFullYear()
            };

            adicionarLivro(novoLivro);

            this.reset();
            document.querySelector('.btn-status[data-status="lendo"]').click();

            const modalEl = document.getElementById('modalLivro');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        });
    }
}

function mapearStatusParaBackend(statusFront) {
    const map = {'desejado': 'WANT_TO_READ', 'lendo': 'READING', 'lido': 'READ', 'emprestado': 'BORROWED'};
    return map[statusFront] || 'WANT_TO_READ';
}

function mapearStatusParaFront(statusBackend) {
    return statusMap[statusBackend] || {front: 'desejado', label: 'Desejado', color: 'desejado'};
}

// ============================================
// FUNÇÃO CORRIGIDA: CRIAR ELEMENTO LIVRO JS
// ============================================

function criarElementoLivroJS(livro) {
    const div = document.createElement('div');
    div.className = 'cartao-livro';
    div.setAttribute('data-id-js', livro.id);
    div.setAttribute('data-id', livro.id);
    div.setAttribute('data-genero', livro.genero || 'Outros');
    div.setAttribute('data-tipo', 'js');
    div.setAttribute('data-processado', 'true');

    let capaHTML;
    if (livro.coverUrl && livro.coverUrl !== '') {
        capaHTML = `<img src="${livro.coverUrl}" alt="${livro.titulo}" class="capa-imagem">`;
    } else {
        const tituloAbreviado = livro.titulo.length > 15 ? livro.titulo.substring(0, 15) + '...' : livro.titulo;
        capaHTML = `<div class="capa-padrao">${tituloAbreviado}</div>`;
    }

    div.innerHTML = `
        <div class="capa-container" style="position: relative;">
            ${capaHTML}
            <span class="etiqueta-status ${livro.statusColor}">${livro.statusLabel}</span>
            <div class="controles-livro">
                <button class="btn-controle btn-mudar-status-js" title="Mudar status">
                    <i class="bi bi-arrow-repeat"></i>
                </button>
                <button class="btn-controle btn-avaliar-js" title="Avaliar livro">
                    <i class="bi bi-star"></i>
                </button>
                <button class="btn-controle btn-remover-js" title="Remover livro">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            <button class="btn-sinopse" title="Ver sinopse" style="position: absolute; top: 10px; right: 10px; left: auto; bottom: auto;">
                <i class="bi bi-file-text"></i>
            </button>
        </div>
        <div class="detalhes-livro" style="text-align: center; padding: 10px 5px;">
            <div class="estrelas-container" style="margin-bottom: 8px; display: flex; justify-content: center;">
                ${renderizarEstrelas(livro.avaliacao)}
            </div>
            <h6 class="titulo-livro" style="text-align: center; margin-bottom: 5px;">${livro.titulo}</h6>
            <p class="autor-livro" style="text-align: center; margin-bottom: 8px;">${livro.autor}</p>
            ${livro.genero ? `<span class="genero-livro">${livro.genero}</span>` : ''}
        </div>
    `;

    if (livro.coverUrl && livro.coverUrl !== '') {
        const img = div.querySelector('img');
        if (img) {
            img.onerror = function () {
                const tituloAbreviado = livro.titulo.length > 15 ? livro.titulo.substring(0, 15) + '...' : livro.titulo;
                this.parentElement.innerHTML = `<div class="capa-padrao">${tituloAbreviado}</div>`;
            };
        }
    }

    div.querySelector('.btn-mudar-status-js').addEventListener('click', (e) => {
        e.stopPropagation();
        mudarStatusLivroJS(livro.id);
    });

    div.querySelector('.btn-avaliar-js').addEventListener('click', (e) => {
        e.stopPropagation();
        livroSelecionadoParaAvaliacao = livro.id;
        const modal = new bootstrap.Modal(document.getElementById('modalAvaliacao'));
        modal.show();
    });

    div.querySelector('.btn-remover-js').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja remover este livro?')) removerLivroJS(livro.id);
    });

    div.querySelector('.btn-sinopse').addEventListener('click', (e) => {
        e.stopPropagation();
        abrirSinopse(
            livro.titulo,
            livro.autor,
            livro.coverUrl,
            livro.genero || 'Não especificado',
            livro.statusLabel
        );
    });

    return div;
}

function renderizarNovosLivros() {
    const container = document.getElementById('gradeLivrosRecentes');
    if (!container) return;

    const livrosJS = livros.filter(l => !l.isHTML);

    const livrosFiltrados = livrosJS.filter(livro => {
        const statusMatch = statusSelecionado === 'todos' || livro.statusFront === statusSelecionado;
        const generoMatch = generoSelecionado === 'todos' || (livro.genero && livro.genero.toLowerCase() === generoSelecionado.toLowerCase());
        return statusMatch && generoMatch;
    });

    document.querySelectorAll('.cartao-livro[data-tipo="js"]').forEach(el => el.remove());

    livrosFiltrados.forEach(livro => {
        const card = criarElementoLivroJS(livro);
        container.appendChild(card);
    });
}

function adicionarLivro(livro) {
    livro.avaliacao = 0;
    livro.ano = new Date().getFullYear();
    livro.isHTML = false;
    livros.unshift(livro);
    salvarNoLocalStorage();
    renderizarNovosLivros();
    atualizarTodasEstatisticas();
    atualizarFiltrosGenero();
}

function mudarStatusLivroJS(id) {
    const livro = livros.find(l => l.id === id);
    if (!livro) return;

    const statusOrder = ['desejado', 'lendo', 'lido', 'emprestado'];
    const nextIndex = (statusOrder.indexOf(livro.statusFront) + 1) % statusOrder.length;
    const novoStatusFront = statusOrder[nextIndex];

    livro.statusFront = novoStatusFront;
    livro.status = mapearStatusParaBackend(novoStatusFront);
    const statusInfo = mapearStatusParaFront(livro.status);
    livro.statusLabel = statusInfo.label;
    livro.statusColor = statusInfo.color;

    salvarNoLocalStorage();
    renderizarNovosLivros();
    atualizarTodasEstatisticas();

    mostrarToast(`📖 Status alterado para: ${statusInfo.label}`);
}

function removerLivroJS(id) {
    const index = livros.findIndex(l => l.id === id);
    if (index !== -1) {
        livros.splice(index, 1);
        salvarNoLocalStorage();
        renderizarNovosLivros();
        atualizarTodasEstatisticas();
        atualizarFiltrosGenero();
        mostrarToast('🗑️ Livro removido com sucesso!');
    }
}

function salvarNoLocalStorage() {
    localStorage.setItem('bookHubLivrosNovos', JSON.stringify(livros));
}

// ============================================
// FILTROS E ESTATÍSTICAS CORRIGIDOS
// ============================================

function adicionarFiltros() {
    const cabecalho = document.querySelector('.painel-cabecalho h3');
    if (!cabecalho) return;

    const filtrosExistentes = document.querySelector('.filtros-status');
    if (filtrosExistentes) filtrosExistentes.remove();

    const filtrosHTML = `<div class="filtros-status mt-3">
        <span class="filtro-status ${statusSelecionado === 'todos' ? 'active' : ''}" data-filtro="todos">Todos</span>
        <span class="filtro-status ${statusSelecionado === 'lendo' ? 'active' : ''}" data-filtro="lendo">Lendo</span>
        <span class="filtro-status ${statusSelecionado === 'lido' ? 'active' : ''}" data-filtro="lido">Lidos</span>
        <span class="filtro-status ${statusSelecionado === 'emprestado' ? 'active' : ''}" data-filtro="emprestado">Emprestados</span>
        <span class="filtro-status ${statusSelecionado === 'desejado' ? 'active' : ''}" data-filtro="desejado">Desejados</span>
    </div>`;

    cabecalho.insertAdjacentHTML('afterend', filtrosHTML);

    document.querySelectorAll('.filtro-status').forEach(filtro => {
        filtro.addEventListener('click', function () {
            statusSelecionado = this.dataset.filtro;
            document.querySelectorAll('.filtro-status').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            aplicarFiltroLivros();
        });
    });
}

function adicionarFiltrosGenero() {
    const container = document.querySelector('.filtros-container');
    if (!container) return;

    const filtrosGeneroExistentes = document.querySelector('.filtros-genero');
    if (filtrosGeneroExistentes) filtrosGeneroExistentes.remove();

    const generosDisponiveis = obterGenerosDisponiveis();

    let filtrosHTML = `<div class="filtros-genero mt-3">
        <h6 class="mb-2">Filtrar por Gênero:</h6>
        <div class="filtros-genero-botoes">
            <span class="filtro-genero ${generoSelecionado === 'todos' ? 'active' : ''}" data-genero="todos">Todos</span>`;

    generosDisponiveis.forEach(genero => {
        filtrosHTML += `<span class="filtro-genero ${generoSelecionado === genero ? 'active' : ''}" data-genero="${genero}">${genero}</span>`;
    });

    filtrosHTML += `</div></div>`;
    container.insertAdjacentHTML('beforeend', filtrosHTML);

    document.querySelectorAll('.filtro-genero').forEach(filtro => {
        filtro.addEventListener('click', function () {
            generoSelecionado = this.dataset.genero;
            document.querySelectorAll('.filtro-genero').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            aplicarFiltroLivros();
        });
    });
}

function obterGenerosDisponiveis() {
    const generosSet = new Set();

    livros.forEach(livro => {
        if (livro.genero && livro.genero !== '') {
            generosSet.add(livro.genero);
        }
    });

    return Array.from(generosSet).sort();
}

function atualizarFiltrosGenero() {
    adicionarFiltrosGenero();
}

function aplicarFiltroLivros() {
    // Filtrar livros HTML
    document.querySelectorAll('#gradeLivrosRecentes .cartao-livro[data-tipo="html"]').forEach(cartao => {
        const id = cartao.getAttribute('data-id');
        const livro = livros.find(l => l.id === id);

        if (livro) {
            const statusMatch = statusSelecionado === 'todos' || livro.statusFront === statusSelecionado;
            const generoMatch = generoSelecionado === 'todos' || livro.genero === generoSelecionado;
            cartao.style.display = (statusMatch && generoMatch) ? 'block' : 'none';
        }
    });

    // Filtrar livros JS
    renderizarNovosLivros();
}

function atualizarEstatisticas() {
    const todosLivros = obterTodosOsLivros();

    // Log para debug
    console.log('Total de livros únicos:', todosLivros.length);
    console.log('Livros:', todosLivros.map(l => l.titulo));

    let total = todosLivros.length;
    let lendo = 0, lido = 0, desejado = 0, emprestado = 0;

    todosLivros.forEach(livro => {
        const status = livro.statusFront || 'lendo';
        if (status === 'lendo') lendo++;
        else if (status === 'lido') lido++;
        else if (status === 'desejado') desejado++;
        else if (status === 'emprestado') emprestado++;
    });

    // Atualizar elementos do DOM
    const totalEl = document.getElementById('totalLivros');
    const lendoEl = document.getElementById('lendoAgora');
    const desejadoEl = document.getElementById('listaDesejos');
    const emprestadoEl = document.getElementById('emprestimosAtivos');

    if (totalEl) totalEl.textContent = total;
    if (lendoEl) lendoEl.textContent = lendo;
    if (desejadoEl) desejadoEl.textContent = desejado;
    if (emprestadoEl) emprestadoEl.textContent = emprestado;

    atualizarAvaliacaoMedia();
}

// ============================================
// PERFIL DO USUÁRIO - ESTATÍSTICAS CORRIGIDAS
// ============================================

function inicializarPerfilUsuario() {
    carregarDadosPerfil();
    configurarEventosPerfil();
    calcularEstatisticasPerfil();
    atualizarFiltroAno();
    atualizarFiltroGeneroPerfil();
}

function carregarDadosPerfil() {
    const perfilSalvo = localStorage.getItem('bookHubPerfil');
    if (perfilSalvo) {
        try {
            const perfil = JSON.parse(perfilSalvo);
            if (perfil.bio) document.getElementById('bioUsuario').textContent = perfil.bio;
            if (perfil.metaAnual) document.getElementById('metaAnual').textContent = perfil.metaAnual;
        } catch (e) {
            // Ignorar erro
        }
    } else {
        const perfilPadrao = {bio: 'Apaixonado(a) por leitura! 📚', metaAnual: 12};
        localStorage.setItem('bookHubPerfil', JSON.stringify(perfilPadrao));
        document.getElementById('bioUsuario').textContent = perfilPadrao.bio;
        document.getElementById('metaAnual').textContent = perfilPadrao.metaAnual;
    }
}

function configurarEventosPerfil() {
    const btnEditarBio = document.getElementById('btnEditarBio');
    const bioUsuario = document.getElementById('bioUsuario');
    if (btnEditarBio && bioUsuario) {
        btnEditarBio.addEventListener('click', () => editarBioUsuario());
        bioUsuario.addEventListener('click', () => editarBioUsuario());
    }

    document.querySelectorAll('.filtro-ano-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filtro-ano-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filtrarLivrosPorAno(this.dataset.ano);
        });
    });

    document.querySelectorAll('.filtro-genero-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filtro-genero-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filtrarGeneros(this.dataset.genero);
        });
    });

    const btnAlterarFoto = document.querySelector('.btn-alterar-foto');
    if (btnAlterarFoto) {
        btnAlterarFoto.addEventListener('click', () => alert('Funcionalidade de alterar foto será implementada em breve!'));
    }
}

function editarBioUsuario() {
    const bioUsuario = document.getElementById('bioUsuario');
    const textarea = document.createElement('textarea');
    textarea.value = bioUsuario.textContent;
    textarea.className = 'form-control entrada-estilizada';
    textarea.rows = 3;
    bioUsuario.replaceWith(textarea);
    textarea.focus();
    textarea.addEventListener('blur', () => salvarBioUsuario(textarea.value));
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            salvarBioUsuario(textarea.value);
        }
    });
}

function salvarBioUsuario(novaBio) {
    const textarea = document.querySelector('textarea.entrada-estilizada');
    let bioUsuario = document.getElementById('bioUsuario');
    if (!bioUsuario && textarea) {
        bioUsuario = document.createElement('p');
        bioUsuario.id = 'bioUsuario';
        bioUsuario.className = 'bio-usuario';
        bioUsuario.textContent = novaBio || 'Apaixonado(a) por leitura! 📚';
        textarea.replaceWith(bioUsuario);
    } else if (bioUsuario) {
        bioUsuario.textContent = novaBio || 'Apaixonado(a) por leitura! 📚';
    }
    let perfil = JSON.parse(localStorage.getItem('bookHubPerfil')) || {};
    perfil.bio = novaBio || 'Apaixonado(a) por leitura! 📚';
    localStorage.setItem('bookHubPerfil', JSON.stringify(perfil));
}

function calcularEstatisticasPerfil() {
    const todosLivros = obterTodosOsLivros();
    const totalLivros = todosLivros.length;
    const livrosLidos = todosLivros.filter(l => l.statusFront === 'lido').length;

    const tempoMedioEl = document.getElementById('tempoMedio');
    const totalPerfilEl = document.getElementById('totalLivrosPerfil');
    const lidosEl = document.getElementById('livrosLidos');
    const paginasEl = document.getElementById('paginasLidas');
    const mesAtivoEl = document.getElementById('mesAtivo');

    if (tempoMedioEl) tempoMedioEl.textContent = livrosLidos > 0 ? Math.round(365 / livrosLidos) : 0;
    if (totalPerfilEl) totalPerfilEl.textContent = totalLivros;
    if (lidosEl) lidosEl.textContent = livrosLidos;
    if (paginasEl) paginasEl.textContent = (livrosLidos * 300).toLocaleString();
    if (mesAtivoEl) mesAtivoEl.textContent = 'Jan';

    const perfil = JSON.parse(localStorage.getItem('bookHubPerfil')) || {};
    const metaAnual = perfil.metaAnual || 12;
    const progresso = Math.min(Math.round((livrosLidos / metaAnual) * 100), 100);
    const progressoAnual = document.getElementById('progressoAnual');
    const metaAnualEl = document.getElementById('metaAnual');

    if (progressoAnual) {
        progressoAnual.style.width = `${progresso}%`;
        progressoAnual.textContent = `${progresso}%`;
    }
    if (metaAnualEl) metaAnualEl.textContent = metaAnual;
}

// ============================================
// FILTRO POR ANO CORRIGIDO
// ============================================

function atualizarFiltroAno() {
    const todosLivros = obterTodosOsLivros();
    const anosMap = new Map();

    todosLivros.forEach(livro => {
        const ano = livro.ano || new Date().getFullYear();
        anosMap.set(ano, (anosMap.get(ano) || 0) + 1);
    });

    const anosArray = Array.from(anosMap.entries())
        .map(([ano, quantidade]) => ({ ano: ano.toString(), quantidade }))
        .sort((a, b) => b.ano.localeCompare(a.ano));

    const container = document.getElementById('livrosPorAno');
    if (!container) return;

    if (anosArray.length === 0) {
        container.innerHTML = `<div class="sem-dados"><i class="bi bi-calendar-x"></i><p>Nenhum livro adicionado</p></div>`;
        return;
    }

    let html = '<div class="grafico-barras">';
    anosArray.slice(0, 6).forEach(item => {
        const altura = Math.min(item.quantidade * 30, 150);
        html += `<div class="barra-ano" style="height: ${altura}px" title="${item.quantidade} livros em ${item.ano}">
            <span class="barra-valor">${item.quantidade}</span>
            <span class="barra-label">${item.ano}</span>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function filtrarLivrosPorAno(ano) {
    const container = document.getElementById('livrosPorAno');
    const todosLivros = obterTodosOsLivros();

    if (ano === 'todos') {
        atualizarFiltroAno();
        return;
    }

    let livrosFiltrados;

    if (ano === 'anteriores') {
        livrosFiltrados = todosLivros.filter(l => (l.ano || new Date().getFullYear()) < 2022);
    } else {
        livrosFiltrados = todosLivros.filter(l => (l.ano || new Date().getFullYear()).toString() === ano);
    }

    if (livrosFiltrados.length === 0) {
        container.innerHTML = `<div class="sem-dados"><i class="bi bi-calendar-x"></i><p>Nenhum livro encontrado para ${ano}</p></div>`;
        return;
    }

    let html = '<div class="ano-lista">';
    livrosFiltrados.slice(0, 5).forEach(livro => {
        html += `<div class="ano-livro-item">
            ${livro.coverUrl ?
            `<img src="${livro.coverUrl}" alt="${livro.titulo}" class="ano-livro-capa">` :
            `<div class="ano-livro-capa capa-padrao" style="width:40px;height:60px;font-size:0.7rem;">${livro.titulo.substring(0, 2)}</div>`
        }
            <div class="ano-livro-info">
                <h6>${livro.titulo.length > 20 ? livro.titulo.substring(0, 20) + '...' : livro.titulo}</h6>
                <span>${livro.autor}</span>
                <small>${livro.ano || new Date().getFullYear()}</small>
            </div>
        </div>`;
    });
    if (livrosFiltrados.length > 5) {
        html += `<div class="mais-livros">+ ${livrosFiltrados.length - 5} mais</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// DISTRIBUIÇÃO POR GÊNERO CORRIGIDA
// ============================================

function atualizarFiltroGeneroPerfil() {
    const generos = detectarGenerosLivros();
    const container = document.getElementById('livrosPorGeneros');
    if (!container) return;

    if (!generos?.length) {
        container.innerHTML = `<div class="sem-dados"><i class="bi bi-info-circle"></i><p>Adicione livros para ver a distribuição por gênero</p></div>`;
        return;
    }

    generos.sort((a, b) => b.quantidade - a.quantidade);
    const topGeneros = generos.slice(0, 5);
    const maxQuantidade = Math.max(...topGeneros.map(g => g.quantidade), 1);

    let html = '<div class="grafico-barras">';
    topGeneros.forEach(genero => {
        const altura = Math.round((genero.quantidade / maxQuantidade) * 150);
        html += `<div class="barra-genero" style="height: ${altura}px" title="${genero.quantidade} livros de ${genero.nome}">
            <span class="barra-valor">${genero.quantidade}</span>
            <span class="barra-label">${genero.nome.substring(0, 10)}${genero.nome.length > 10 ? '...' : ''}</span>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function filtrarGeneros(genero) {
    const container = document.getElementById('livrosPorGeneros');
    if (genero === 'todos') {
        atualizarFiltroGeneroPerfil();
        return;
    }

    const todosLivros = obterTodosOsLivros();
    const livrosFiltrados = todosLivros.filter(l => l.genero === genero);

    if (livrosFiltrados.length === 0) {
        container.innerHTML = `<div class="sem-dados"><i class="bi bi-book"></i><p>Nenhum livro encontrado para ${genero}</p></div>`;
        return;
    }

    let html = '<div class="genero-lista">';
    livrosFiltrados.slice(0, 5).forEach(livro => {
        html += `<div class="genero-livro-item">
            ${livro.coverUrl && livro.coverUrl !== '' ?
            `<img src="${livro.coverUrl}" alt="${livro.titulo}" class="genero-livro-capa">` :
            `<div class="genero-livro-capa capa-padrao" style="width:40px;height:60px;font-size:0.7rem;">${livro.titulo.substring(0, 2)}</div>`
        }
            <div class="genero-livro-info">
                <h6>${livro.titulo.length > 20 ? livro.titulo.substring(0, 20) + '...' : livro.titulo}</h6>
                <span>${livro.autor}</span>
            </div>
        </div>`;
    });
    if (livrosFiltrados.length > 5) {
        html += `<div class="mais-livros">+ ${livrosFiltrados.length - 5} mais</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

function renderizarGeneros(generos) {
    const container = document.getElementById('generosPreferidos');
    if (!container) return;

    if (!generos?.length) {
        container.innerHTML = `<div class="sem-dados"><i class="bi bi-info-circle"></i><p>Adicione livros para ver suas preferências</p></div>`;
        return;
    }

    let html = '';
    generos.sort((a, b) => b.quantidade - a.quantidade).slice(0, 6).forEach(genero => {
        html += `<div class="genero-tag"><span>${genero.nome}</span><span class="contador">${genero.quantidade}</span></div>`;
    });
    container.innerHTML = html;
}

function detectarGenerosLivros() {
    const contadorGeneros = {};

    livros.forEach(livro => {
        if (livro.genero && livro.genero !== '') {
            contadorGeneros[livro.genero] = (contadorGeneros[livro.genero] || 0) + 1;
        }
    });

    const generosArray = Object.entries(contadorGeneros).map(([nome, quantidade]) => ({nome, quantidade}));

    let perfil = JSON.parse(localStorage.getItem('bookHubPerfil')) || {};
    perfil.generos = generosArray;
    localStorage.setItem('bookHubPerfil', JSON.stringify(perfil));

    renderizarGeneros(generosArray);
    return generosArray;
}

function atualizarTodasEstatisticas() {
    console.log('Atualizando todas as estatísticas...');
    console.log('Livros no array:', livros.length);

    atualizarEstatisticas();
    calcularEstatisticasPerfil();
    detectarGenerosLivros();
    atualizarFiltroGeneroPerfil();
    atualizarFiltroAno();
}

// ============================================
// MODAL DE SINOPSE
// ============================================

let modalSinopseInstance = null;

function inicializarModalSinopse() {
    const modalSinopseEl = document.getElementById('modalSinopse');
    if (modalSinopseEl) {
        modalSinopseInstance = new bootstrap.Modal(modalSinopseEl);
    }
}

async function abrirSinopse(titulo, autor, capa, genero, status) {
    try {
        document.getElementById('sinopseCapa').innerHTML = `<div class="sinopse-loading"><div class="spinner-border spinner-border-sm"></div></div>`;
        document.getElementById('sinopseInfo').innerHTML = `<h3>${titulo}</h3><p>${autor}</p>`;
        document.getElementById('sinopseConteudo').innerHTML = `
            <div class="sinopse-loading">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                <span>Buscando sinopse...</span>
            </div>
        `;

        if (!modalSinopseInstance) {
            modalSinopseInstance = new bootstrap.Modal(document.getElementById('modalSinopse'));
        }
        modalSinopseInstance.show();

        const livroInfo = await buscarLivroInfo(titulo, autor);

        let capaHTML = '';
        if (capa && capa !== '') {
            capaHTML = `<img src="${capa}" alt="${titulo}" onerror="this.onerror=null; this.src='https://via.placeholder.com/80x120?text=Sem+Capa';">`;
        } else if (livroInfo?.capaPrincipal) {
            capaHTML = `<img src="${livroInfo.capaPrincipal}" alt="${titulo}" onerror="this.onerror=null; this.src='https://via.placeholder.com/80x120?text=Sem+Capa';">`;
        } else {
            capaHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg,#6c5ce7,#a29bfe);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${titulo.substring(0, 2)}</div>`;
        }
        document.getElementById('sinopseCapa').innerHTML = capaHTML;

        document.getElementById('sinopseInfo').innerHTML = `
            <h3>${titulo}</h3>
            <p><i class="bi bi-pencil"></i> ${autor}</p>
            <span style="display:inline-block;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px;font-size:0.8rem;">
                <i class="bi bi-tag"></i> ${genero || 'Não especificado'}
            </span>
            <span style="display:inline-block;background:${getStatusColor(status)};padding:4px 12px;border-radius:20px;font-size:0.8rem;margin-left:8px;">
                <i class="bi bi-bookmark"></i> ${status}
            </span>
        `;

        let sinopseHTML = '';
        if (livroInfo?.sinopse) {
            sinopseHTML = `<div class="sinopse-texto">${livroInfo.sinopse}</div>`;

            if (livroInfo.googleBooksId) {
                sinopseHTML += `<div class="fonte-badge"><i class="bi bi-google"></i> Fonte: Google Books</div>`;
            } else if (livroInfo.openLibraryId) {
                sinopseHTML += `<div class="fonte-badge"><i class="bi bi-book"></i> Fonte: Open Library</div>`;
            }

            if (livroInfo.isbn) {
                sinopseHTML += `<div style="margin-top:10px;font-size:0.8rem;color:#636e72;"><i class="bi bi-upc-scan"></i> ISBN: ${livroInfo.isbn}</div>`;
            }
        } else {
            sinopseHTML = `<div class="sinopse-texto text-muted"><i class="bi bi-info-circle"></i> Sinopse não disponível para este livro.</div>`;
        }

        document.getElementById('sinopseConteudo').innerHTML = sinopseHTML;

    } catch (error) {
        console.error('Erro ao buscar sinopse:', error);
        document.getElementById('sinopseConteudo').innerHTML = `
            <div class="sinopse-texto text-muted">
                <i class="bi bi-exclamation-triangle"></i> 
                Erro ao carregar sinopse. Tente novamente.
            </div>
        `;
    }
}

function getStatusColor(status) {
    const cores = {
        'Lendo': '#6c5ce7',
        'Lido': '#00b894',
        'Emprestado': '#0984e3',
        'Desejado': '#e17055'
    };
    return cores[status] || '#6c5ce7';
}

// ============================================
// INTEGRAÇÃO COM APIs (mantido igual)
// ============================================

const API_CONFIG = {
    GOOGLE_BOOKS: {
        BASE_URL: 'https://www.googleapis.com/books/v1',
        MAX_RESULTS: 5
    },
    OPEN_LIBRARY: {
        COVERS: 'https://covers.openlibrary.org/b',
        SEARCH: 'https://openlibrary.org/search.json',
        BOOKS: 'https://openlibrary.org/books',
        WORKS: 'https://openlibrary.org/works'
    }
};

let cacheLivros = {};

async function buscarLivroInfo(titulo, autor) {
    const chaveCache = `${titulo}-${autor}`.toLowerCase().trim();
    if (cacheLivros[chaveCache]) return cacheLivros[chaveCache];

    try {
        const [googleResult, openLibraryResult] = await Promise.allSettled([
            buscarGoogleBooks(titulo, autor),
            buscarOpenLibrary(titulo, autor)
        ]);

        const resultadoCombinado = {
            titulo, autor, capas: [], sinopse: '', isbn: '',
            googleBooks: googleResult.status === 'fulfilled' ? googleResult.value : null,
            openLibrary: openLibraryResult.status === 'fulfilled' ? openLibraryResult.value : null
        };

        if (googleResult.status === 'fulfilled' && googleResult.value) {
            resultadoCombinado.capas.push(...googleResult.value.capas);
            resultadoCombinado.sinopse = googleResult.value.sinopse || resultadoCombinado.sinopse;
            resultadoCombinado.isbn = googleResult.value.isbn || resultadoCombinado.isbn;
            resultadoCombinado.googleBooksId = googleResult.value.id;
        }

        if (openLibraryResult.status === 'fulfilled' && openLibraryResult.value) {
            resultadoCombinado.capas.push(...openLibraryResult.value.capas);
            resultadoCombinado.sinopse = resultadoCombinado.sinopse || openLibraryResult.value.sinopse;
            resultadoCombinado.isbn = resultadoCombinado.isbn || openLibraryResult.value.isbn;
            resultadoCombinado.openLibraryId = openLibraryResult.value.id;
            resultadoCombinado.openLibraryKey = openLibraryResult.value.key;
        }

        resultadoCombinado.capas = [...new Set(resultadoCombinado.capas)];
        resultadoCombinado.capaPrincipal = resultadoCombinado.capas[0] || null;
        cacheLivros[chaveCache] = resultadoCombinado;
        return resultadoCombinado;
    } catch (error) {
        return null;
    }
}

async function buscarGoogleBooks(titulo, autor) {
    try {
        const url = `${API_CONFIG.GOOGLE_BOOKS.BASE_URL}/volumes?q=${encodeURIComponent(`${titulo} ${autor}`)}&maxResults=${API_CONFIG.GOOGLE_BOOKS.MAX_RESULTS}&langRestrict=pt&printType=books`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        const data = await response.json();
        if (!data.items?.length) return null;

        const livro = data.items[0];
        const volumeInfo = livro.volumeInfo || {};
        const capas = [];

        if (volumeInfo.imageLinks) {
            if (volumeInfo.imageLinks.thumbnail) capas.push(volumeInfo.imageLinks.thumbnail.replace('http:', 'https:').replace('zoom=1', 'zoom=0'));
            if (volumeInfo.imageLinks.smallThumbnail) capas.push(volumeInfo.imageLinks.smallThumbnail.replace('http:', 'https:'));
            if (volumeInfo.imageLinks.medium) capas.push(volumeInfo.imageLinks.medium.replace('http:', 'https:'));
            if (volumeInfo.imageLinks.large) capas.push(volumeInfo.imageLinks.large.replace('http:', 'https:'));
            if (volumeInfo.imageLinks.extraLarge) capas.push(volumeInfo.imageLinks.extraLarge.replace('http:', 'https:'));
        }

        let isbn = '';
        if (volumeInfo.industryIdentifiers) {
            const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13');
            const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_10');
            isbn = isbn13 ? isbn13.identifier : (isbn10 ? isbn10.identifier : '');
        }

        return {
            id: livro.id,
            titulo: volumeInfo.title || titulo,
            autor: volumeInfo.authors?.[0] || autor,
            sinopse: volumeInfo.description || '',
            capas,
            isbn,
            paginaCount: volumeInfo.pageCount,
            dataPublicacao: volumeInfo.publishedDate,
            editora: volumeInfo.publisher,
            categoria: volumeInfo.categories?.[0] || ''
        };
    } catch (error) {
        return null;
    }
}

async function buscarOpenLibrary(titulo, autor) {
    try {
        let query = encodeURIComponent(`${titulo} ${autor}`);
        let url = `${API_CONFIG.OPEN_LIBRARY.SEARCH}?q=${query}&limit=5&language=por&fields=key,title,author_name,cover_i,isbn,first_publish_year,subject,description`;
        let response = await fetch(url);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        let data = await response.json();

        if (!data.docs?.length) {
            query = encodeURIComponent(titulo);
            url = `${API_CONFIG.OPEN_LIBRARY.SEARCH}?q=${query}&limit=5&language=por`;
            response = await fetch(url);
            data = await response.json();
        }

        if (!data.docs?.length) return null;

        const livro = data.docs[0];
        const capas = [];
        if (livro.cover_i) {
            capas.push(`${API_CONFIG.OPEN_LIBRARY.COVERS}/id/${livro.cover_i}-L.jpg`);
            capas.push(`${API_CONFIG.OPEN_LIBRARY.COVERS}/id/${livro.cover_i}-M.jpg`);
            capas.push(`${API_CONFIG.OPEN_LIBRARY.COVERS}/id/${livro.cover_i}-S.jpg`);
        }

        let isbn = '';
        if (livro.isbn?.length) {
            const isbn13 = livro.isbn.find(i => i.length === 13);
            isbn = isbn13 || livro.isbn[0];
        }

        return {
            id: livro.key,
            key: livro.key,
            titulo: livro.title || titulo,
            autor: livro.author_name?.[0] || autor,
            sinopse: livro.description || '',
            capas,
            isbn,
            anoPublicacao: livro.first_publish_year,
            generos: livro.subject ? livro.subject.slice(0, 3) : []
        };
    } catch (error) {
        return null;
    }
}

// ============================================
// BUSCA AUTOMÁTICA (mantido igual)
// ============================================

function adicionarBuscaAutomaticaAoFormulario() {
    const formulario = document.getElementById('formularioLivro');
    if (!formulario || document.getElementById('resultadoBuscaContainer')) return;

    const resultadoBuscaHTML = `
        <div id="resultadoBuscaContainer" class="mb-3" style="display: none;">
            <label class="form-label">Resultados da Busca Automática</label>
            <div id="resultadoBusca" class="p-3 bg-light rounded"></div>
        </div>
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <label class="form-label">Buscar Informações Automaticamente</label>
                <button type="button" id="btnBuscarInfo" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-search"></i> Buscar
                </button>
            </div>
            <small class="text-muted">Clique no botão para buscar capa, sinopse e ISBN automaticamente</small>
        </div>
    `;

    document.getElementById('autorLivro').insertAdjacentHTML('afterend', resultadoBuscaHTML);

    document.getElementById('btnBuscarInfo').addEventListener('click', async function () {
        const titulo = document.getElementById('tituloLivro').value.trim();
        const autor = document.getElementById('autorLivro').value.trim();
        if (!titulo || !autor) {
            alert('Por favor, preencha o título e autor primeiro');
            return;
        }

        this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Buscando...';
        this.disabled = true;

        try {
            const livroInfo = await buscarLivroInfo(titulo, autor);
            const resultadoContainer = document.getElementById('resultadoBuscaContainer');
            const resultadoDiv = document.getElementById('resultadoBusca');

            if (livroInfo && (livroInfo.capaPrincipal || livroInfo.sinopse || livroInfo.isbn)) {
                let html = '<div class="row">';
                if (livroInfo.capaPrincipal) {
                    html += `<div class="col-md-4 text-center">
                        <img src="${livroInfo.capaPrincipal}" alt="Capa" class="img-fluid rounded shadow-sm" style="max-height: 150px;" onerror="this.onerror=null; this.src='https://via.placeholder.com/128x192?text=Sem+Capa';">
                        <div class="mt-2">
                            <button type="button" class="btn btn-sm btn-primary usar-capa-btn" data-capa="${livroInfo.capaPrincipal}">Usar esta capa</button>
                        </div>
                    </div>`;
                }
                html += '<div class="col-md-8">';
                if (livroInfo.sinopse) html += `<p><strong>Sinopse:</strong> ${livroInfo.sinopse.length > 200 ? livroInfo.sinopse.substring(0, 200) + '...' : livroInfo.sinopse}</p>`;
                if (livroInfo.isbn) html += `<p><strong>ISBN:</strong> ${livroInfo.isbn}</p>`;
                if (livroInfo.googleBooksId) html += `<p><small class="text-muted">Fonte: Google Books</small></p>`;
                else if (livroInfo.openLibraryId) html += `<p><small class="text-muted">Fonte: Open Library</small></p>`;
                html += `<div class="mt-2">
                    <button type="button" class="btn btn-sm btn-success" id="preencherDadosBtn">
                        <i class="bi bi-check-lg"></i> Preencher Dados
                    </button>
                </div>`;
                html += '</div></div>';
                resultadoDiv.innerHTML = html;
                resultadoContainer.style.display = 'block';

                const usarCapaBtn = resultadoDiv.querySelector('.usar-capa-btn');
                if (usarCapaBtn) {
                    usarCapaBtn.addEventListener('click', function () {
                        document.getElementById('capaLivro').value = this.dataset.capa;
                        alert('✅ URL da capa adicionada ao campo!');
                    });
                }

                document.getElementById('preencherDadosBtn').addEventListener('click', function () {
                    if (livroInfo.capaPrincipal) document.getElementById('capaLivro').value = livroInfo.capaPrincipal;
                    resultadoContainer.style.display = 'none';
                    alert('✅ Dados do livro preenchidos automaticamente!');
                });
            } else {
                resultadoDiv.innerHTML = `<div class="alert alert-warning mb-0">
                    <i class="bi bi-exclamation-triangle"></i> Nenhuma informação encontrada para este livro.<br>
                    <small>Tente buscar com o ISBN ou verifique se o título/autores estão corretos.</small>
                </div>`;
                resultadoContainer.style.display = 'block';
            }
        } catch (error) {
            alert('❌ Erro ao buscar informações do livro. Tente novamente.');
        } finally {
            this.innerHTML = '<i class="bi bi-search"></i> Buscar';
            this.disabled = false;
        }
    });
}

// ============================================
// BUSCA POR ISBN (mantido igual)
// ============================================

async function buscarPorISBN(isbn) {
    try {
        const isbnLimpo = isbn.replace(/[-\s]/g, '');
        const googleUrl = `${API_CONFIG.GOOGLE_BOOKS.BASE_URL}/volumes?q=isbn:${isbnLimpo}`;
        const googleResponse = await fetch(googleUrl);
        const googleData = await googleResponse.json();

        if (googleData.items?.length) {
            const livro = googleData.items[0].volumeInfo;
            return {
                titulo: livro.title,
                autor: livro.authors?.[0] || '',
                capa: livro.imageLinks?.thumbnail?.replace('http:', 'https:'),
                sinopse: livro.description,
                fonte: 'Google Books (ISBN)'
            };
        }

        const openUrl = `${API_CONFIG.OPEN_LIBRARY.BOOKS}.json?bibkeys=ISBN:${isbnLimpo}&format=json&jscmd=data`;
        const openResponse = await fetch(openUrl);
        const openData = await openResponse.json();
        const livroKey = `ISBN:${isbnLimpo}`;

        if (openData[livroKey]) {
            const livro = openData[livroKey];
            return {
                titulo: livro.title,
                autor: livro.authors?.[0]?.name || '',
                capa: livro.cover?.large || livro.cover?.medium,
                sinopse: livro.description,
                fonte: 'Open Library (ISBN)'
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

function adicionarBuscaPorISBN() {
    const formulario = document.getElementById('formularioLivro');
    if (!formulario) return;

    const isbnHTML = `
        <div class="mb-3">
            <label class="form-label">ISBN (Opcional)</label>
            <div class="input-group">
                <input type="text" class="form-control entrada-estilizada" id="isbnLivro" placeholder="Ex: 9788535902778">
                <button class="btn btn-outline-secondary" type="button" id="btnBuscarISBN">
                    <i class="bi bi-upc-scan"></i> Buscar
                </button>
            </div>
            <small class="text-muted">Buscar livro pelo código ISBN</small>
        </div>
    `;

    document.getElementById('generoLivro').parentElement.insertAdjacentHTML('afterend', isbnHTML);

    document.getElementById('btnBuscarISBN').addEventListener('click', async function () {
        const isbn = document.getElementById('isbnLivro').value.trim();
        if (!isbn) {
            alert('Por favor, digite um ISBN');
            return;
        }

        this.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        this.disabled = true;

        try {
            const livro = await buscarPorISBN(isbn);
            if (livro) {
                document.getElementById('tituloLivro').value = livro.titulo || '';
                document.getElementById('autorLivro').value = livro.autor || '';
                document.getElementById('capaLivro').value = livro.capa || '';
                if (livro.sinopse) alert(`📖 Sinopse encontrada!\n\n${livro.sinopse.substring(0, 150)}...`);
            } else {
                alert('❌ Nenhum livro encontrado com este ISBN');
            }
        } catch (error) {
            alert('❌ Erro ao buscar por ISBN');
        } finally {
            this.innerHTML = '<i class="bi bi-upc-scan"></i> Buscar';
            this.disabled = false;
        }
    });
}

// ============================================
// OBSERVADOR PARA NOVOS LIVROS (CORRIGIDO)
// ============================================

function iniciarObservadorDeLivros() {
    const gradeLivros = document.getElementById('gradeLivrosRecentes');
    if (gradeLivros) {
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function (node) {
                        if (node.nodeType === 1 && node.classList?.contains('cartao-livro')) {
                            if (!node.hasAttribute('data-processado')) {
                                setTimeout(() => {
                                    processarLivrosHTMLExistentes();
                                    atualizarTodasEstatisticas();
                                }, 100);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(gradeLivros, {childList: true, subtree: true});
    }
}

// ============================================
// UTILIDADES
// ============================================

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

console.log('✅ Book Hub iniciado com sucesso! Estatísticas corrigidas!');