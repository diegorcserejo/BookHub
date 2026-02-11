let livros = [];
let statusSelecionado = 'todos';
let generoSelecionado = 'todos';

const statusMap = {
    'WANT_TO_READ': { front: 'desejado', label: 'Desejado', color: 'desejado' },
    'READING': { front: 'lendo', label: 'Lendo', color: 'lendo' },
    'READ': { front: 'lido', label: 'Lido', color: 'lido' },
    'BORROWED': { front: 'emprestado', label: 'Emprestado', color: 'emprestado' }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    inicializarEventos();
    inicializarLivros();
    atualizarEstatisticas();
    adicionarFiltros();
    adicionarFiltrosGenero();
    inicializarPerfilUsuario();
    adicionarBuscaAutomaticaAoFormulario();
    adicionarBuscaPorISBN();
    inicializarModalSinopse();
    console.log('📚 BookHub carregado com botão de sinopse!');
});

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
        // Mostrar loading
        document.getElementById('sinopseCapa').innerHTML = `<div class="sinopse-loading"><div class="spinner-border spinner-border-sm"></div></div>`;
        document.getElementById('sinopseInfo').innerHTML = `<h3>${titulo}</h3><p>${autor}</p>`;
        document.getElementById('sinopseConteudo').innerHTML = `
            <div class="sinopse-loading">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                <span>Buscando sinopse...</span>
            </div>
        `;

        modalSinopseInstance.show();

        // Buscar sinopse
        const livroInfo = await buscarLivroInfo(titulo, autor);

        // Atualizar capa
        let capaHTML = '';
        if (capa && capa !== '') {
            capaHTML = `<img src="${capa}" alt="${titulo}" onerror="this.onerror=null; this.src='https://via.placeholder.com/80x120?text=Sem+Capa';">`;
        } else if (livroInfo?.capaPrincipal) {
            capaHTML = `<img src="${livroInfo.capaPrincipal}" alt="${titulo}" onerror="this.onerror=null; this.src='https://via.placeholder.com/80x120?text=Sem+Capa';">`;
        } else {
            capaHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg,#6c5ce7,#a29bfe);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${titulo.substring(0,2)}</div>`;
        }
        document.getElementById('sinopseCapa').innerHTML = capaHTML;

        // Atualizar informações
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

        // Atualizar sinopse
        let sinopseHTML = '';
        if (livroInfo?.sinopse) {
            sinopseHTML = `<div class="sinopse-texto">${livroInfo.sinopse}</div>`;

            // Adicionar fonte
            if (livroInfo.googleBooksId) {
                sinopseHTML += `<div class="fonte-badge"><i class="bi bi-google"></i> Fonte: Google Books</div>`;
            } else if (livroInfo.openLibraryId) {
                sinopseHTML += `<div class="fonte-badge"><i class="bi bi-book"></i> Fonte: Open Library</div>`;
            }

            // Adicionar ISBN se tiver
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
// FUNÇÕES PRINCIPAIS DE LIVROS
// ============================================

function inicializarLivros() {
    const livrosSalvos = localStorage.getItem('bookHubLivrosNovos');
    livros = livrosSalvos ? JSON.parse(livrosSalvos) : [];
    renderizarNovosLivros();
    adicionarControlesLivrosHTML();
}

function adicionarControlesLivrosHTML() {
    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');
    livrosHTML.forEach(cartao => {
        const capaContainer = cartao.querySelector('.capa-container');
        if (capaContainer && !capaContainer.querySelector('.controles-livro')) {
            const controlesHTML = `<div class="controles-livro">
                <button class="btn-controle btn-mudar-status" title="Mudar status">
                    <i class="bi bi-arrow-repeat"></i>
                </button>
            </div>`;
            capaContainer.insertAdjacentHTML('beforeend', controlesHTML);

            const btnMudarStatus = capaContainer.querySelector('.btn-mudar-status');
            if (btnMudarStatus) {
                btnMudarStatus.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const etiqueta = capaContainer.querySelector('.etiqueta-status');
                    if (etiqueta) mudarStatusLivroHTML(etiqueta);
                });
            }
        }

        // Adicionar botão de sinopse se não existir
        if (capaContainer && !capaContainer.querySelector('.btn-sinopse')) {
            const sinopseBtn = document.createElement('button');
            sinopseBtn.className = 'btn-sinopse';
            sinopseBtn.title = 'Ver sinopse';
            sinopseBtn.innerHTML = '<i class="bi bi-file-text"></i>';

            sinopseBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const titulo = cartao.querySelector('.titulo-livro, .detalhes-livro h6, h6')?.textContent?.trim() || 'Título desconhecido';
                const autor = cartao.querySelector('.autor-livro, p')?.textContent?.trim() || 'Autor desconhecido';
                const capa = cartao.querySelector('.capa-imagem')?.src || '';
                const genero = cartao.querySelector('.genero-livro')?.textContent || 'Não especificado';
                const statusEl = cartao.querySelector('.etiqueta-status');
                const status = statusEl?.textContent?.trim() || 'Desconhecido';

                abrirSinopse(titulo, autor, capa, genero, status);
            });

            capaContainer.appendChild(sinopseBtn);
        }
    });
}

function mudarStatusLivroHTML(etiqueta) {
    const statusOrder = ['lendo', 'lido', 'desejado', 'emprestado'];
    const statusAtual = etiqueta.className.split(' ')[1];
    const nextIndex = (statusOrder.indexOf(statusAtual) + 1) % statusOrder.length;
    const novoStatus = statusOrder[nextIndex];
    etiqueta.className = `etiqueta-status ${novoStatus}`;
    const statusLabels = {'lendo':'Lendo','lido':'Lido','desejado':'Desejado','emprestado':'Emprestado'};
    etiqueta.textContent = statusLabels[novoStatus];
    atualizarEstatisticas();
    atualizarTodasEstatisticas();
}

function inicializarEventos() {
    document.querySelectorAll('.btn-status').forEach(btn => btn.addEventListener('click', function() {
        document.querySelectorAll('.btn-status').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('statusLivro').value = this.dataset.status;
    }));

    const formulario = document.getElementById('formularioLivro');
    if (formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault();
            const titulo = document.getElementById('tituloLivro').value.trim();
            const autor = document.getElementById('autorLivro').value.trim();
            const status = document.getElementById('statusLivro').value;
            const capa = document.getElementById('capaLivro').value.trim();
            const genero = document.getElementById('generoLivro')?.value || '';
            if (!titulo || !autor) {
                alert('Por favor, preencha título e autor');
                return;
            }
            const statusBackend = mapearStatusParaBackend(status);
            const statusInfo = mapearStatusParaFront(statusBackend);
            const novoLivro = {
                id: Date.now(), titulo, autor, status: statusBackend,
                statusFront: status, statusLabel: statusInfo.label,
                statusColor: statusInfo.color, coverUrl: capa || null,
                genero: genero || 'Outros'
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
    const map = {'desejado':'WANT_TO_READ','lendo':'READING','lido':'READ','emprestado':'BORROWED'};
    return map[statusFront] || 'WANT_TO_READ';
}

function mapearStatusParaFront(statusBackend) {
    return statusMap[statusBackend] || { front: 'desejado', label: 'Desejado', color: 'desejado' };
}

function renderizarNovosLivros() {
    const container = document.getElementById('gradeLivrosRecentes');
    if (!container) return;
    const livrosFiltrados = livros.filter(livro => {
        const statusMatch = statusSelecionado === 'todos' || livro.statusFront === statusSelecionado;
        const generoMatch = generoSelecionado === 'todos' || (livro.genero && livro.genero.toLowerCase() === generoSelecionado.toLowerCase());
        return statusMatch && generoMatch;
    });
    document.querySelectorAll('.cartao-livro[data-id-js]').forEach(el => el.remove());
    if (livrosFiltrados.length === 0) return;
    livrosFiltrados.forEach(livro => container.appendChild(criarElementoLivroJS(livro)));
}

function criarElementoLivroJS(livro) {
    const div = document.createElement('div');
    div.className = 'cartao-livro';
    div.setAttribute('data-id-js', livro.id);
    div.setAttribute('data-genero', livro.genero || 'Outros');

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
            <span class="etiqueta-status ${livro.statusColor}">${livro.statusLabel}</span>
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
            ${livro.genero ? `<span class="genero-livro">${livro.genero}</span>` : ''}
        </div>
    `;

    if (livro.coverUrl && livro.coverUrl !== '') {
        const img = div.querySelector('img');
        if (img) {
            img.onerror = function() {
                const tituloAbreviado = livro.titulo.length > 15 ? livro.titulo.substring(0, 15) + '...' : livro.titulo;
                this.parentElement.innerHTML = `<div class="capa-padrao">${tituloAbreviado}</div>`;
            };
        }
    }

    // Adicionar botão de sinopse
    const capaContainer = div.querySelector('.capa-container');
    const sinopseBtn = document.createElement('button');
    sinopseBtn.className = 'btn-sinopse';
    sinopseBtn.title = 'Ver sinopse';
    sinopseBtn.innerHTML = '<i class="bi bi-file-text"></i>';

    sinopseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirSinopse(
            livro.titulo,
            livro.autor,
            livro.coverUrl,
            livro.genero || 'Não especificado',
            livro.statusLabel
        );
    });

    capaContainer.appendChild(sinopseBtn);

    // Eventos dos botões
    div.querySelector('.btn-mudar-status-js').addEventListener('click', (e) => {
        e.stopPropagation();
        mudarStatusLivroJS(livro.id);
    });

    div.querySelector('.btn-remover-js').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja remover este livro?')) removerLivroJS(livro.id);
    });

    return div;
}

function adicionarLivro(livro) {
    livros.unshift(livro);
    salvarNoLocalStorage();
    atualizarEstatisticas();
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
    atualizarEstatisticas();
    renderizarNovosLivros();
    atualizarTodasEstatisticas();
}

function removerLivroJS(id) {
    const index = livros.findIndex(l => l.id === id);
    if (index !== -1) {
        livros.splice(index, 1);
        salvarNoLocalStorage();
        atualizarEstatisticas();
        renderizarNovosLivros();
        atualizarTodasEstatisticas();
        atualizarFiltrosGenero();
    }
}

function salvarNoLocalStorage() {
    localStorage.setItem('bookHubLivrosNovos', JSON.stringify(livros));
}

// ============================================
// FILTROS E ESTATÍSTICAS
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
        filtro.addEventListener('click', function() {
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
        filtro.addEventListener('click', function() {
            generoSelecionado = this.dataset.genero;
            document.querySelectorAll('.filtro-genero').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            aplicarFiltroLivros();
        });
    });
}

function obterGenerosDisponiveis() {
    const generosSet = new Set();
    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');
    livrosHTML.forEach(cartao => {
        const generoTag = cartao.querySelector('.genero-livro')?.textContent;
        if (generoTag) generosSet.add(generoTag);
    });
    livros.forEach(livro => {
        if (livro.genero) generosSet.add(livro.genero);
    });
    return Array.from(generosSet).sort();
}

function atualizarFiltrosGenero() {
    const generosDisponiveis = obterGenerosDisponiveis();
    let perfil = JSON.parse(localStorage.getItem('bookHubPerfil')) || {};
    perfil.generosDisponiveis = generosDisponiveis;
    localStorage.setItem('bookHubPerfil', JSON.stringify(perfil));
    adicionarFiltrosGenero();
}

function aplicarFiltroLivros() {
    const todosLivrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');
    todosLivrosHTML.forEach(cartao => {
        const etiqueta = cartao.querySelector('.etiqueta-status');
        const generoDoLivro = cartao.querySelector('.genero-livro')?.textContent || 'Outros';
        if (etiqueta) {
            const statusLivro = etiqueta.className.split(' ')[1];
            const statusMatch = statusSelecionado === 'todos' || statusLivro === statusSelecionado;
            const generoMatch = generoSelecionado === 'todos' || generoDoLivro.toLowerCase() === generoSelecionado.toLowerCase();
            cartao.style.display = (statusMatch && generoMatch) ? 'block' : 'none';
        }
    });
    renderizarNovosLivros();
}

function atualizarEstatisticas() {
    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');
    let totalHTML = livrosHTML.length, lendoHTML = 0, lidoHTML = 0, desejadoHTML = 0, emprestadoHTML = 0;

    livrosHTML.forEach(cartao => {
        const etiqueta = cartao.querySelector('.etiqueta-status');
        if (etiqueta) {
            const statusClass = etiqueta.className.split(' ')[1];
            if (statusClass === 'lendo') lendoHTML++;
            else if (statusClass === 'lido') lidoHTML++;
            else if (statusClass === 'desejado') desejadoHTML++;
            else if (statusClass === 'emprestado') emprestadoHTML++;
        }
    });

    const lendoJS = livros.filter(l => l.statusFront === 'lendo').length;
    const lidoJS = livros.filter(l => l.statusFront === 'lido').length;
    const desejadoJS = livros.filter(l => l.statusFront === 'desejado').length;
    const emprestadoJS = livros.filter(l => l.statusFront === 'emprestado').length;

    document.getElementById('totalLivros').textContent = totalHTML + livros.length;
    document.getElementById('lendoAgora').textContent = lendoHTML + lendoJS;
    document.getElementById('listaDesejos').textContent = desejadoHTML + desejadoJS;
    document.getElementById('emprestimosAtivos').textContent = emprestadoHTML + emprestadoJS;
}

// ============================================
// PERFIL DO USUÁRIO
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
        const perfil = JSON.parse(perfilSalvo);
        if (perfil.bio) document.getElementById('bioUsuario').textContent = perfil.bio;
        if (perfil.metaAnual) document.getElementById('metaAnual').textContent = perfil.metaAnual;
        if (perfil.generos?.length) renderizarGeneros(perfil.generos);
    } else {
        const perfilPadrao = { bio: 'Apaixonado(a) por leitura! 📚', metaAnual: 12, generos: [] };
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
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filtro-ano-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filtrarLivrosPorAno(this.dataset.ano);
        });
    });

    document.querySelectorAll('.filtro-genero-btn').forEach(btn => {
        btn.addEventListener('click', function() {
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
    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');
    const totalLivros = livrosHTML.length + livros.length;
    let livrosLidosHTML = 0;
    livrosHTML.forEach(cartao => {
        if (cartao.querySelector('.etiqueta-status')?.className.includes('lido')) livrosLidosHTML++;
    });
    const livrosLidos = livrosLidosHTML + livros.filter(l => l.statusFront === 'lido').length;

    document.getElementById('tempoMedio').textContent = livrosLidos > 0 ? Math.round(365 / livrosLidos) : 0;
    document.getElementById('avaliacaoMedia').textContent = livrosLidos > 0 ? '4.2' : '0.0';
    document.getElementById('totalLivrosPerfil').textContent = totalLivros;
    document.getElementById('livrosLidos').textContent = livrosLidos;
    document.getElementById('paginasLidas').textContent = (livrosLidos * 300).toLocaleString();
    document.getElementById('mesAtivo').textContent = 'Jan';

    const perfil = JSON.parse(localStorage.getItem('bookHubPerfil')) || {};
    const metaAnual = perfil.metaAnual || 12;
    const progresso = Math.min(Math.round((livrosLidos / metaAnual) * 100), 100);
    const progressoAnual = document.getElementById('progressoAnual');

    if (progressoAnual) {
        progressoAnual.style.width = `${progresso}%`;
        progressoAnual.textContent = `${progresso}%`;
        document.getElementById('metaAnual').textContent = metaAnual;
    }
}

function atualizarFiltroAno() {
    const anos = [
        { ano: '2024', quantidade: 8 },
        { ano: '2023', quantidade: 12 },
        { ano: '2022', quantidade: 10 },
        { ano: '2021', quantidade: 6 },
        { ano: '2020', quantidade: 4 }
    ];
    const container = document.getElementById('livrosPorAno');
    if (!container) return;

    let html = '<div class="grafico-barras">';
    anos.forEach(item => {
        html += `<div class="barra-ano" style="height: ${Math.min(item.quantidade * 15, 150)}px" title="${item.quantidade} livros em ${item.ano}">
            <span class="barra-valor">${item.quantidade}</span>
            <span class="barra-label">${item.ano}</span>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function filtrarLivrosPorAno(ano) {
    const container = document.getElementById('livrosPorAno');
    if (ano === 'todos') {
        atualizarFiltroAno();
        return;
    }

    const livrosExemplo = {
        '2024': [
            { titulo: 'Heartstopper - Volume 4', autor: 'Alice Oseman', capa: 'imgs/Heartstopper4.jpg' },
            { titulo: 'A Empregada - Livro 2', autor: 'Freida McFadden', capa: 'imgs/A Empregada 2.jpg' },
            { titulo: 'Harry Potter e as Relíquias da Morte', autor: 'J.K. Rowling', capa: 'imgs/Harry7.jpg' }
        ],
        '2023': [
            { titulo: 'Heartstopper - Volume 3', autor: 'Alice Oseman', capa: 'imgs/Heartstopper3.jpg' },
            { titulo: 'A Empregada - Livro 1', autor: 'Freida McFadden', capa: 'imgs/A Empregada.jpg' }
        ],
        '2022': [
            { titulo: 'Heartstopper - Volume 1', autor: 'Alice Oseman', capa: 'imgs/Heartstopper1.jpg' },
            { titulo: 'Heartstopper - Volume 2', autor: 'Alice Oseman', capa: 'imgs/Heartstopper2.png' }
        ],
        '2025': [
            { titulo: '13 Reasons Why', autor: 'Jay Asher', capa: 'imgs/13reasonswhy.jpg' },
            { titulo: 'Heartstopper - Volume 5', autor: 'Alice Oseman', capa: 'imgs/Heartstopper5.jpg' }
        ],
        '2026': [
            { titulo: 'Harry Potter e o Cálice de Fogo', autor: 'J.K. Rowling', capa: 'imgs/Harry4.jpg' },
            { titulo: 'Harry Potter e a Ordem da Fênix', autor: 'J.K. Rowling', capa: 'imgs/Harry5.jpg' }
        ],
        'anteriores': [
            { titulo: 'Harry Potter e a Pedra Filosofal', autor: 'J.K. Rowling', capa: 'imgs/Harry1.jpg' },
            { titulo: 'Harry Potter e a Câmara Secreta', autor: 'J.K. Rowling', capa: 'imgs/Harry2.jpg' },
            { titulo: 'Harry Potter e o Prisioneiro de Azkaban', autor: 'J.K. Rowling', capa: 'imgs/Harry3.jpg' }
        ]
    };

    const livrosAno = livrosExemplo[ano] || [];

    if (livrosAno.length === 0) {
        container.innerHTML = `<div class="sem-dados"><i class="bi bi-calendar-x"></i><p>Nenhum livro encontrado para ${ano}</p></div>`;
        return;
    }

    let html = '<div class="ano-lista">';
    livrosAno.forEach(livro => {
        html += `<div class="ano-livro-item">
            ${livro.capa ?
            `<img src="${livro.capa}" alt="${livro.titulo}" class="ano-livro-capa">` :
            `<div class="ano-livro-capa capa-padrao" style="width:40px;height:60px;font-size:0.7rem;">${livro.titulo.substring(0, 2)}</div>`
        }
            <div class="ano-livro-info">
                <h6>${livro.titulo.length > 20 ? livro.titulo.substring(0, 20) + '...' : livro.titulo}</h6>
                <span>${livro.autor}</span>
            </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

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
    const maxQuantidade = Math.max(...topGeneros.map(g => g.quantidade));

    let html = '<div class="grafico-barras">';
    topGeneros.forEach(genero => {
        const altura = maxQuantidade > 0 ? Math.round((genero.quantidade / maxQuantidade) * 150) : 0;
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

    const livrosFiltrados = [];

    document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])').forEach(cartao => {
        const generoTag = cartao.querySelector('.genero-livro')?.textContent || '';
        if (generoTag === genero) {
            const titulo = cartao.querySelector('.titulo-livro, .detalhes-livro h6, h6')?.textContent || '';
            const autor = cartao.querySelector('.autor-livro, p')?.textContent || '';
            const capa = cartao.querySelector('.capa-imagem')?.src || '';
            livrosFiltrados.push({ titulo, autor, capa });
        }
    });

    livros.forEach(livro => {
        if (livro.genero === genero) {
            livrosFiltrados.push({ titulo: livro.titulo, autor: livro.autor, capa: livro.coverUrl });
        }
    });

    if (livrosFiltrados.length === 0) {
        container.innerHTML = `<div class="sem-dados"><i class="bi bi-book"></i><p>Nenhum livro encontrado para ${genero}</p></div>`;
        return;
    }

    let html = '<div class="genero-lista">';
    livrosFiltrados.slice(0, 5).forEach(livro => {
        html += `<div class="genero-livro-item">
            ${livro.capa && livro.capa !== '' ?
            `<img src="${livro.capa}" alt="${livro.titulo}" class="genero-livro-capa">` :
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

    document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])').forEach(cartao => {
        const generoTag = cartao.querySelector('.genero-livro')?.textContent;
        if (generoTag) contadorGeneros[generoTag] = (contadorGeneros[generoTag] || 0) + 1;
    });

    livros.forEach(livro => {
        if (livro.genero) contadorGeneros[livro.genero] = (contadorGeneros[livro.genero] || 0) + 1;
    });

    const generosArray = Object.entries(contadorGeneros).map(([nome, quantidade]) => ({ nome, quantidade }));
    let perfil = JSON.parse(localStorage.getItem('bookHubPerfil')) || {};
    perfil.generos = generosArray;
    localStorage.setItem('bookHubPerfil', JSON.stringify(perfil));
    renderizarGeneros(generosArray);
    return generosArray;
}

function atualizarTodasEstatisticas() {
    atualizarEstatisticas();
    calcularEstatisticasPerfil();
    detectarGenerosLivros();
    atualizarFiltroGeneroPerfil();
}

// ============================================
// INTEGRAÇÃO COM APIs GOOGLE BOOKS E OPEN LIBRARY
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
// BUSCA AUTOMÁTICA E ISBN
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

    document.getElementById('btnBuscarInfo').addEventListener('click', async function() {
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
                    usarCapaBtn.addEventListener('click', function() {
                        document.getElementById('capaLivro').value = this.dataset.capa;
                        alert('✅ URL da capa adicionada ao campo!');
                    });
                }

                document.getElementById('preencherDadosBtn').addEventListener('click', function() {
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

    document.getElementById('btnBuscarISBN').addEventListener('click', async function() {
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
// OBSERVADOR PARA NOVOS LIVROS
// ============================================

function iniciarObservadorDeLivros() {
    const gradeLivros = document.getElementById('gradeLivrosRecentes');
    if (gradeLivros) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList?.contains('cartao-livro')) {
                        if (!node.hasAttribute('data-id-js')) {
                            const capaContainer = node.querySelector('.capa-container');
                            if (capaContainer && !capaContainer.querySelector('.btn-sinopse')) {
                                const sinopseBtn = document.createElement('button');
                                sinopseBtn.className = 'btn-sinopse';
                                sinopseBtn.title = 'Ver sinopse';
                                sinopseBtn.innerHTML = '<i class="bi bi-file-text"></i>';

                                sinopseBtn.addEventListener('click', function(e) {
                                    e.stopPropagation();
                                    const titulo = node.querySelector('.titulo-livro, .detalhes-livro h6, h6')?.textContent?.trim() || 'Título desconhecido';
                                    const autor = node.querySelector('.autor-livro, p')?.textContent?.trim() || 'Autor desconhecido';
                                    const capa = node.querySelector('.capa-imagem')?.src || '';
                                    const genero = node.querySelector('.genero-livro')?.textContent || 'Não especificado';
                                    const statusEl = node.querySelector('.etiqueta-status');
                                    const status = statusEl?.textContent?.trim() || 'Desconhecido';

                                    abrirSinopse(titulo, autor, capa, genero, status);
                                });

                                capaContainer.appendChild(sinopseBtn);
                            }
                        }
                    }
                });
            });
        });

        observer.observe(gradeLivros, { childList: true, subtree: true });
    }
}

// ============================================
// DEBOUNCE E UTILIDADES
// ============================================

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Iniciar observador após carregar a página
setTimeout(iniciarObservadorDeLivros, 500);

console.log('✅ Book Hub iniciado com sucesso! Botão de sinopse adicionado!');