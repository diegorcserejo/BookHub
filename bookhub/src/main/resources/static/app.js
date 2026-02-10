let livros = [];
let statusSelecionado = 'todos';
let generoSelecionado = 'todos';

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
    adicionarFiltrosGenero(); // NOVO: Adicionar filtros de gênero
    inicializarPerfilUsuario();
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
    const statusAtual = etiqueta.className.split(' ')[1];
    const currentIndex = statusOrder.indexOf(statusAtual);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const novoStatus = statusOrder[nextIndex];

    etiqueta.className = `etiqueta-status ${novoStatus}`;

    const statusLabels = {
        'lendo': 'Lendo',
        'lido': 'Lido',
        'desejado': 'Desejado',
        'emprestado': 'Emprestado'
    };

    etiqueta.textContent = statusLabels[novoStatus] || 'Lendo';
    atualizarEstatisticas();
    atualizarTodasEstatisticas();
}

function inicializarEventos() {
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-status').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('statusLivro').value = this.dataset.status;
        });
    });

    const formulario = document.getElementById('formularioLivro');
    if (formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault();

            const titulo = document.getElementById('tituloLivro').value.trim();
            const autor = document.getElementById('autorLivro').value.trim();
            const status = document.getElementById('statusLivro').value;
            const capa = document.getElementById('capaLivro').value.trim();
            const genero = document.getElementById('generoLivro') ? document.getElementById('generoLivro').value : '';

            if (!titulo || !autor) {
                alert('Por favor, preencha título e autor');
                return;
            }

            const statusBackend = mapearStatusParaBackend(status);
            const statusInfo = mapearStatusParaFront(statusBackend);

            const novoLivro = {
                id: Date.now(),
                titulo: titulo,
                autor: autor,
                status: statusBackend,
                statusFront: status,
                statusLabel: statusInfo.label,
                statusColor: statusInfo.color,
                coverUrl: capa || null,
                genero: genero || 'Outros' // NOVO: Adicionar gênero ao livro
            };

            adicionarLivro(novoLivro);
            this.reset();
            document.querySelector('.btn-status[data-status="lendo"]').click();

            const modalEl = document.getElementById('modalLivro');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            }
        });
    }
}

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

function renderizarNovosLivros() {
    const container = document.getElementById('gradeLivrosRecentes');
    if (!container) return;

    const livrosFiltrados = livros.filter(livro => {
        // Filtro por status
        const statusMatch = statusSelecionado === 'todos' || livro.statusFront === statusSelecionado;

        // Filtro por gênero
        const generoMatch = generoSelecionado === 'todos' ||
            (livro.genero && livro.genero.toLowerCase() === generoSelecionado.toLowerCase());

        return statusMatch && generoMatch;
    });

    document.querySelectorAll('.cartao-livro[data-id-js]').forEach(el => {
        el.remove();
    });

    if (livrosFiltrados.length === 0) {
        return;
    }

    livrosFiltrados.forEach(livro => {
        const livroElement = criarElementoLivroJS(livro);
        container.appendChild(livroElement);
    });
}

function criarElementoLivroJS(livro) {
    const div = document.createElement('div');
    div.className = 'cartao-livro';
    div.setAttribute('data-id-js', livro.id);
    div.setAttribute('data-genero', livro.genero || 'Outros'); // NOVO: Atributo para gênero

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

function adicionarLivro(livro) {
    livros.unshift(livro);
    salvarNoLocalStorage();
    atualizarEstatisticas();
    renderizarNovosLivros();
    atualizarTodasEstatisticas();
    atualizarFiltrosGenero(); // NOVO: Atualizar filtros de gênero quando adicionar livro
}

function mudarStatusLivroJS(id) {
    const livro = livros.find(l => l.id === id);
    if (!livro) return;

    const statusOrder = ['desejado', 'lendo', 'lido', 'emprestado'];
    const currentIndex = statusOrder.indexOf(livro.statusFront);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
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
        atualizarFiltrosGenero(); // NOVO: Atualizar filtros de gênero quando remover livro
    }
}

function salvarNoLocalStorage() {
    localStorage.setItem('bookHubLivrosNovos', JSON.stringify(livros));
}

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

    document.querySelectorAll('.filtro-status').forEach(filtro => {
        filtro.addEventListener('click', function() {
            statusSelecionado = this.dataset.filtro;
            document.querySelectorAll('.filtro-status').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            aplicarFiltroLivros();
        });
    });
}

// NOVO: Adicionar filtros de gênero/categoria
function adicionarFiltrosGenero() {
    const container = document.querySelector('.filtros-container');
    if (!container) return;

    // Verificar se já existem filtros de gênero
    const filtrosGeneroExistentes = document.querySelector('.filtros-genero');
    if (filtrosGeneroExistentes) {
        filtrosGeneroExistentes.remove();
    }

    // Obter todos os gêneros disponíveis
    const generosDisponiveis = obterGenerosDisponiveis();

    let filtrosHTML = `
        <div class="filtros-genero mt-3">
            <h6 class="mb-2">Filtrar por Gênero:</h6>
            <div class="filtros-genero-botoes">
                <span class="filtro-genero ${generoSelecionado === 'todos' ? 'active' : ''}" data-genero="todos">Todos</span>
    `;

    generosDisponiveis.forEach(genero => {
        const isActive = generoSelecionado === genero ? 'active' : '';
        filtrosHTML += `<span class="filtro-genero ${isActive}" data-genero="${genero}">${genero}</span>`;
    });

    filtrosHTML += `
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', filtrosHTML);

    // Adicionar eventos aos filtros de gênero
    document.querySelectorAll('.filtro-genero').forEach(filtro => {
        filtro.addEventListener('click', function() {
            generoSelecionado = this.dataset.genero;
            document.querySelectorAll('.filtro-genero').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            aplicarFiltroLivros();
        });
    });
}

// NOVO: Obter gêneros disponíveis
function obterGenerosDisponiveis() {
    const generosSet = new Set();

    // Adicionar gêneros dos livros HTML
    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');
    livrosHTML.forEach(cartao => {
        const titulo = cartao.querySelector('.titulo-livro, .detalhes-livro h6, h6')?.textContent || '';
        const genero = detectarGeneroPorTitulo(titulo);
        if (genero) generosSet.add(genero);
    });

    // Adicionar gêneros dos livros JS
    livros.forEach(livro => {
        if (livro.genero) {
            generosSet.add(livro.genero);
        } else {
            const generoDetectado = detectarGeneroPorTitulo(livro.titulo);
            if (generoDetectado) {
                generoSet.add(generoDetectado);
                livro.genero = generoDetectado;
            }
        }
    });

    return Array.from(generosSet).sort();
}

// NOVO: Detectar gênero por título
function detectarGeneroPorTitulo(titulo) {
    const tituloLower = titulo.toLowerCase();

    const generosMap = {
        'Fantasia': ['harry potter', 'senhor dos anéis', 'magia', 'feiticeiro', 'dragão'],
        'Romance': ['heartstopper', 'amor', 'coração', 'paixão', 'romance'],
        'Suspense': ['empregada', 'segredo', 'mistério', 'thriller', 'crime'],
        'Drama': ['13 reasons why', 'drama', 'vida', 'emoção', 'conflito'],
        'Biografia': ['mãe morreu', 'biografia', 'memórias', 'autobiografia'],
        'Young Adult': ['adolescente', 'jovem', 'escola', 'ya', 'juventude'],
        'Ficção Científica': ['ficção científica', 'espaço', 'futuro', 'alienígena'],
        'Aventura': ['aventura', 'viagem', 'exploração', 'ação']
    };

    for (const [genero, palavras] of Object.entries(generosMap)) {
        for (const palavra of palavras) {
            if (tituloLower.includes(palavra.toLowerCase())) {
                return genero;
            }
        }
    }

    return null;
}

// NOVO: Atualizar filtros de gênero
function atualizarFiltrosGenero() {
    const generosDisponiveis = obterGenerosDisponiveis();

    // Atualizar o localStorage com os gêneros
    let perfil = JSON.parse(localStorage.getItem('bookHubPerfil')) || {};
    perfil.generosDisponiveis = generosDisponiveis;
    localStorage.setItem('bookHubPerfil', JSON.stringify(perfil));

    // Re-renderizar os filtros
    adicionarFiltrosGenero();
}

function aplicarFiltroLivros() {
    // Aplicar filtro para livros HTML
    const todosLivrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');

    todosLivrosHTML.forEach(cartao => {
        const etiqueta = cartao.querySelector('.etiqueta-status');
        const titulo = cartao.querySelector('.titulo-livro, .detalhes-livro h6, h6')?.textContent || '';
        const generoDoLivro = detectarGeneroPorTitulo(titulo) || 'Outros';

        if (etiqueta) {
            const statusLivro = etiqueta.className.split(' ')[1];

            // Verificar ambos os filtros
            const statusMatch = statusSelecionado === 'todos' || statusLivro === statusSelecionado;
            const generoMatch = generoSelecionado === 'todos' ||
                generoDoLivro.toLowerCase() === generoSelecionado.toLowerCase();

            if (statusMatch && generoMatch) {
                cartao.style.display = 'block';
            } else {
                cartao.style.display = 'none';
            }
        }
    });

    // Aplicar filtro para livros JS
    renderizarNovosLivros();
}

function atualizarEstatisticas() {
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

    const lendoJS = livros.filter(l => l.statusFront === 'lendo').length;
    const lidoJS = livros.filter(l => l.statusFront === 'lido').length;
    const desejadoJS = livros.filter(l => l.statusFront === 'desejado').length;
    const emprestadoJS = livros.filter(l => l.statusFront === 'emprestado').length;

    const total = totalHTML + livros.length;
    const lendoTotal = lendoHTML + lendoJS;
    const desejadoTotal = desejadoHTML + desejadoJS;
    const emprestadoTotal = emprestadoHTML + emprestadoJS;

    document.getElementById('totalLivros').textContent = total;
    document.getElementById('lendoAgora').textContent = lendoTotal;
    document.getElementById('listaDesejos').textContent = desejadoTotal;
    document.getElementById('emprestimosAtivos').textContent = emprestadoTotal;
}

// ============================================
// FUNÇÕES DO PERFIL DO USUÁRIO
// ============================================

function inicializarPerfilUsuario() {
    carregarDadosPerfil();
    configurarEventosPerfil();
    calcularEstatisticasPerfil();
    atualizarFiltroAno();
    atualizarFiltroGeneroPerfil(); // NOVO: Atualizar gráfico de gêneros no perfil
}

function carregarDadosPerfil() {
    const perfilSalvo = localStorage.getItem('bookHubPerfil');

    if (perfilSalvo) {
        const perfil = JSON.parse(perfilSalvo);
        if (perfil.bio) {
            document.getElementById('bioUsuario').textContent = perfil.bio;
        }
        if (perfil.metaAnual) {
            document.getElementById('metaAnual').textContent = perfil.metaAnual;
        }
        if (perfil.generos && perfil.generos.length > 0) {
            renderizarGeneros(perfil.generos);
        }
    } else {
        const perfilPadrao = {
            bio: 'Apaixonado(a) por leitura! 📚',
            metaAnual: 12,
            generos: []
        };
        localStorage.setItem('bookHubPerfil', JSON.stringify(perfilPadrao));
        document.getElementById('bioUsuario').textContent = perfilPadrao.bio;
        document.getElementById('metaAnual').textContent = perfilPadrao.metaAnual;
    }
}

function configurarEventosPerfil() {
    const btnEditarBio = document.getElementById('btnEditarBio');
    const bioUsuario = document.getElementById('bioUsuario');

    if (btnEditarBio && bioUsuario) {
        btnEditarBio.addEventListener('click', function() {
            editarBioUsuario();
        });

        bioUsuario.addEventListener('click', function() {
            editarBioUsuario();
        });
    }

    document.querySelectorAll('.filtro-ano-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filtro-ano-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const anoSelecionado = this.dataset.ano;
            filtrarLivrosPorAno(anoSelecionado);
        });
    });

    // NOVO: Eventos para filtros de gênero no perfil
    document.querySelectorAll('.filtro-genero-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filtro-genero-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const generoSelecionado = this.dataset.genero;
            filtrarGeneros(generoSelecionado);
        });
    });

    const btnAlterarFoto = document.querySelector('.btn-alterar-foto');
    if (btnAlterarFoto) {
        btnAlterarFoto.addEventListener('click', function() {
            alert('Funcionalidade de alterar foto será implementada em breve!');
        });
    }
}

// NOVO: Atualizar gráfico de gêneros no perfil
function atualizarFiltroGeneroPerfil() {
    const generos = detectarGenerosLivros();

    const container = document.getElementById('livrosPorGeneros');
    if (!container) return;

    if (!generos || generos.length === 0) {
        container.innerHTML = `
            <div class="sem-dados">
                <i class="bi bi-info-circle"></i>
                <p>Adicione livros para ver a distribuição por gênero</p>
            </div>
        `;
        return;
    }

    // Ordenar por quantidade
    generos.sort((a, b) => b.quantidade - a.quantidade);

    // Pegar top 5 gêneros
    const topGeneros = generos.slice(0, 5);
    const maxQuantidade = Math.max(...topGeneros.map(g => g.quantidade));

    let html = '<div class="grafico-barras">';

    topGeneros.forEach(genero => {
        const altura = maxQuantidade > 0 ? Math.round((genero.quantidade / maxQuantidade) * 150) : 0;
        html += `
            <div class="barra-genero" style="height: ${altura}px" title="${genero.quantidade} livros de ${genero.nome}">
                <span class="barra-valor">${genero.quantidade}</span>
                <span class="barra-label">${genero.nome.substring(0, 10)}${genero.nome.length > 10 ? '...' : ''}</span>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// NOVO: Filtrar livros por gênero (para a seção do perfil)
function filtrarGeneros(genero) {
    const container = document.getElementById('livrosPorGeneros');

    if (genero === 'todos') {
        atualizarFiltroGeneroPerfil();
        return;
    }

    const livrosFiltrados = [];

    // Livros HTML
    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');
    livrosHTML.forEach(cartao => {
        const titulo = cartao.querySelector('.titulo-livro, .detalhes-livro h6, h6')?.textContent || '';
        const generoDetectado = detectarGeneroPorTitulo(titulo);
        if (generoDetectado === genero) {
            const autor = cartao.querySelector('.autor-livro, p')?.textContent || '';
            const capa = cartao.querySelector('.capa-imagem')?.src || '';
            livrosFiltrados.push({ titulo, autor, capa });
        }
    });

    // Livros JS
    livros.forEach(livro => {
        if (livro.genero === genero || detectarGeneroPorTitulo(livro.titulo) === genero) {
            livrosFiltrados.push({
                titulo: livro.titulo,
                autor: livro.autor,
                capa: livro.coverUrl
            });
        }
    });

    if (livrosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="sem-dados">
                <i class="bi bi-book"></i>
                <p>Nenhum livro encontrado para ${genero}</p>
            </div>
        `;
        return;
    }

    let html = '<div class="genero-lista">';

    livrosFiltrados.slice(0, 5).forEach(livro => {
        html += `
            <div class="genero-livro-item">
                ${livro.capa && livro.capa !== '' ?
            `<img src="${livro.capa}" alt="${livro.titulo}" class="genero-livro-capa">` :
            `<div class="genero-livro-capa capa-padrao" style="width:40px;height:60px;font-size:0.7rem;">${livro.titulo.substring(0, 2)}</div>`
        }
                <div class="genero-livro-info">
                    <h6>${livro.titulo.length > 20 ? livro.titulo.substring(0, 20) + '...' : livro.titulo}</h6>
                    <span>${livro.autor}</span>
                </div>
            </div>
        `;
    });

    if (livrosFiltrados.length > 5) {
        html += `<div class="mais-livros">+ ${livrosFiltrados.length - 5} mais</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

// Restante das funções permanecem as mesmas...
function editarBioUsuario() {
    const bioUsuario = document.getElementById('bioUsuario');
    const textoAtual = bioUsuario.textContent;

    const textarea = document.createElement('textarea');
    textarea.value = textoAtual;
    textarea.className = 'form-control entrada-estilizada';
    textarea.rows = 3;

    bioUsuario.replaceWith(textarea);
    textarea.focus();

    textarea.addEventListener('blur', function() {
        salvarBioUsuario(textarea.value);
    });

    textarea.addEventListener('keydown', function(e) {
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
        const etiqueta = cartao.querySelector('.etiqueta-status');
        if (etiqueta && etiqueta.className.includes('lido')) {
            livrosLidosHTML++;
        }
    });

    const livrosLidosJS = livros.filter(l => l.statusFront === 'lido').length;
    const livrosLidos = livrosLidosHTML + livrosLidosJS;

    const tempoMedio = livrosLidos > 0 ? Math.round(365 / livrosLidos) : 0;
    const avaliacaoMedia = livrosLidos > 0 ? (4.2).toFixed(1) : '0.0';

    document.getElementById('tempoMedio').textContent = tempoMedio;
    document.getElementById('avaliacaoMedia').textContent = avaliacaoMedia;
    document.getElementById('totalLivrosPerfil').textContent = totalLivros;
    document.getElementById('livrosLidos').textContent = livrosLidos;

    const paginasLidas = livrosLidos * 300;
    document.getElementById('paginasLidas').textContent = paginasLidas.toLocaleString();

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
        const altura = Math.min(item.quantidade * 15, 150);
        html += `
            <div class="barra-ano" style="height: ${altura}px" title="${item.quantidade} livros em ${item.ano}">
                <span class="barra-valor">${item.quantidade}</span>
                <span class="barra-label">${item.ano}</span>
            </div>
        `;
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
            { titulo: 'A Empregada - Livro 1', autor: 'Freida McFadden', capa: 'imgs/A Empregada.jpg' },
        ],
        '2022': [
            { titulo: 'Heartstopper - Volume 1', autor: 'Alice Oseman', capa: 'imgs/Heartstopper1.jpg' },
            { titulo: 'Heartstopper - Volume 2', autor: 'Alice Oseman', capa: 'imgs/Heartstopper2.png' },
        ],
        '2025': [
            { titulo: '13 Reasons Why', autor: 'Jay Asher', capa: 'imgs/13reasonswhy.jpg' },
            { titulo: 'Heartstopper - Volume 5', autor: 'Alice Oseman', capa: 'imgs/Heartstopper5.jpg' },
        ],
        '2026': [
            { titulo: 'Harry Potter e o Cálice de Fogo', autor: 'J.K. Rowling', capa: 'imgs/Harry4.jpg' },
            { titulo: 'Harry Potter e a Ordem da Fênix', autor: 'J.K. Rowling', capa: 'imgs/Harry5.jpg' },
        ],
        'anteriores': [
            { titulo: 'Harry Potter e a Pedra Filosofal', autor: 'J.K. Rowling', capa: 'imgs/Harry1.jpg' },
            { titulo: 'Harry Potter e a Câmara Secreta', autor: 'J.K. Rowling', capa: 'imgs/Harry2.jpg' },
            { titulo: 'Harry Potter e o Prisioneiro de Azkaban', autor: 'J.K. Rowling', capa: 'imgs/Harry3.jpg' }
        ]
    };

    const livrosAno = livrosExemplo[ano] || [];

    if (livrosAno.length === 0) {
        container.innerHTML = `
            <div class="sem-dados">
                <i class="bi bi-calendar-x"></i>
                <p>Nenhum livro encontrado para ${ano}</p>
            </div>
        `;
        return;
    }

    let html = '<div class="ano-lista">';

    livrosAno.forEach(livro => {
        html += `
            <div class="ano-livro-item">
                ${livro.capa ?
            `<img src="${livro.capa}" alt="${livro.titulo}" class="ano-livro-capa">` :
            `<div class="ano-livro-capa capa-padrao" style="width:40px;height:60px;font-size:0.7rem;">${livro.titulo.substring(0, 2)}</div>`
        }
                <div class="ano-livro-info">
                    <h6>${livro.titulo.length > 20 ? livro.titulo.substring(0, 20) + '...' : livro.titulo}</h6>
                    <span>${livro.autor}</span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function renderizarGeneros(generos) {
    const container = document.getElementById('generosPreferidos');

    if (!container) return;

    if (!generos || generos.length === 0) {
        container.innerHTML = `
            <div class="sem-dados">
                <i class="bi bi-info-circle"></i>
                <p>Adicione livros para ver suas preferências</p>
            </div>
        `;
        return;
    }

    let html = '';

    generos.sort((a, b) => b.quantidade - a.quantidade);

    generos.slice(0, 6).forEach(genero => {
        html += `
            <div class="genero-tag">
                <span>${genero.nome}</span>
                <span class="contador">${genero.quantidade}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

function detectarGenerosLivros() {
    const generosComuns = {
        'Fantasia': ['Harry Potter', 'Senhor dos Anéis', 'magia', 'feiticeiro', 'dragão', 'fantasia'],
        'Romance': ['Heartstopper', 'amor', 'coração', 'paixão', 'romance', 'relacionamento'],
        'Suspense': ['Empregada', 'segredo', 'mistério', 'thriller', 'suspense', 'crime'],
        'Drama': ['13 Reasons Why', 'drama', 'vida', 'emoção', 'dramático', 'conflito'],
        'Biografia': ['mãe morreu', 'biografia', 'memórias', 'autobiografia', 'vida real'],
        'Young Adult': ['adolescente', 'jovem', 'escola', 'YA', 'juventude', 'crescimento'],
        'Ficção': ['ficção', 'narrativa', 'história', 'literatura'],
        'Aventura': ['aventura', 'viagem', 'exploração', 'ação']
    };

    const contadorGeneros = {};

    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');

    livrosHTML.forEach(cartao => {
        const tituloElement = cartao.querySelector('.detalhes-livro h6, .titulo-livro, h6');
        if (tituloElement) {
            const titulo = tituloElement.textContent.toLowerCase();
            for (const [genero, palavras] of Object.entries(generosComuns)) {
                for (const palavra of palavras) {
                    if (titulo.includes(palavra.toLowerCase())) {
                        contadorGeneros[genero] = (contadorGeneros[genero] || 0) + 1;
                        break;
                    }
                }
            }
        }
    });

    livros.forEach(livro => {
        const titulo = livro.titulo.toLowerCase();
        for (const [genero, palavras] of Object.entries(generosComuns)) {
            for (const palavra of palavras) {
                if (titulo.includes(palavra.toLowerCase())) {
                    contadorGeneros[genero] = (contadorGeneros[genero] || 0) + 1;
                    break;
                }
            }
        }
    });

    const generosArray = Object.entries(contadorGeneros).map(([nome, quantidade]) => ({
        nome,
        quantidade
    }));

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
    atualizarFiltroGeneroPerfil(); // NOVO: Atualizar gráfico de gêneros
}

console.log('Book Hub iniciado com sucesso! Perfil do usuário carregado.');