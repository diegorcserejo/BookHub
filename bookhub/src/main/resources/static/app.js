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
    inicializarPerfilUsuario(); // NOVO: Inicializar perfil
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
    atualizarTodasEstatisticas(); // NOVO: Atualizar estatísticas do perfil também
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
    atualizarTodasEstatisticas(); // NOVO: Atualizar estatísticas do perfil
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
    atualizarTodasEstatisticas(); // NOVO: Atualizar estatísticas do perfil
}

function removerLivroJS(id) {
    const index = livros.findIndex(l => l.id === id);
    if (index !== -1) {
        livros.splice(index, 1);
        salvarNoLocalStorage();
        atualizarEstatisticas();
        renderizarNovosLivros();
        atualizarTodasEstatisticas(); // NOVO: Atualizar estatísticas do perfil
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
    const emprestadoTotal = emprestadoHTML + emprestadoJS;

    document.getElementById('totalLivros').textContent = total;
    document.getElementById('lendoAgora').textContent = lendoTotal;
    document.getElementById('listaDesejos').textContent = desejadoTotal;
    document.getElementById('emprestimosAtivos').textContent = emprestadoTotal;
}

// ============================================
// FUNÇÕES DO PERFIL DO USUÁRIO
// ============================================

// Inicializar perfil do usuário
function inicializarPerfilUsuario() {
    // Carregar dados do perfil do localStorage
    carregarDadosPerfil();

    // Configurar eventos do perfil
    configurarEventosPerfil();

    // Calcular estatísticas do perfil
    calcularEstatisticasPerfil();

    // Atualizar filtro por ano
    atualizarFiltroAno();

    // Detectar gêneros preferidos
    detectarGenerosLivros();
}

// Carregar dados do perfil
function carregarDadosPerfil() {
    const perfilSalvo = localStorage.getItem('bookHubPerfil');

    if (perfilSalvo) {
        const perfil = JSON.parse(perfilSalvo);

        // Atualizar bio se existir
        if (perfil.bio) {
            document.getElementById('bioUsuario').textContent = perfil.bio;
        }

        // Atualizar meta anual se existir
        if (perfil.metaAnual) {
            document.getElementById('metaAnual').textContent = perfil.metaAnual;
        }

        // Atualizar gêneros se existirem
        if (perfil.generos && perfil.generos.length > 0) {
            renderizarGeneros(perfil.generos);
        }
    } else {
        // Criar perfil padrão se não existir
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

// Configurar eventos do perfil
function configurarEventosPerfil() {
    // Botão de editar bio
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

    // Botões de filtro por ano
    document.querySelectorAll('.filtro-ano-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filtro-ano-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const anoSelecionado = this.dataset.ano;
            filtrarLivrosPorAno(anoSelecionado);
        });
    });

    // Botão de alterar foto
    const btnAlterarFoto = document.querySelector('.btn-alterar-foto');
    if (btnAlterarFoto) {
        btnAlterarFoto.addEventListener('click', function() {
            // Em uma implementação real, você abriria um seletor de arquivos
            alert('Funcionalidade de alterar foto será implementada em breve!');
        });
    }
}

// Editar bio do usuário
function editarBioUsuario() {
    const bioUsuario = document.getElementById('bioUsuario');
    const textoAtual = bioUsuario.textContent;

    // Criar textarea para edição
    const textarea = document.createElement('textarea');
    textarea.value = textoAtual;
    textarea.className = 'form-control entrada-estilizada';
    textarea.rows = 3;

    // Substituir o texto pela textarea
    bioUsuario.replaceWith(textarea);
    textarea.focus();

    // Salvar quando perder o foco
    textarea.addEventListener('blur', function() {
        salvarBioUsuario(textarea.value);
    });

    // Salvar com Enter (sem shift)
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            salvarBioUsuario(textarea.value);
        }
    });
}

// Salvar bio do usuário
function salvarBioUsuario(novaBio) {
    const textarea = document.querySelector('textarea.entrada-estilizada');
    let bioUsuario = document.getElementById('bioUsuario');

    if (!bioUsuario && textarea) {
        // Criar novo elemento se não existir
        bioUsuario = document.createElement('p');
        bioUsuario.id = 'bioUsuario';
        bioUsuario.className = 'bio-usuario';
        bioUsuario.textContent = novaBio || 'Apaixonado(a) por leitura! 📚';

        textarea.replaceWith(bioUsuario);
    } else if (bioUsuario) {
        bioUsuario.textContent = novaBio || 'Apaixonado(a) por leitura! 📚';
    }

    // Salvar no localStorage
    let perfil = JSON.parse(localStorage.getItem('bookHubPerfil')) || {};
    perfil.bio = novaBio || 'Apaixonado(a) por leitura! 📚';
    localStorage.setItem('bookHubPerfil', JSON.stringify(perfil));
}

// Calcular estatísticas do perfil
function calcularEstatisticasPerfil() {
    // Contar todos os livros (HTML + JS)
    const livrosHTML = document.querySelectorAll('#gradeLivrosRecentes .cartao-livro:not([data-id-js])');
    const totalLivros = livrosHTML.length + livros.length;

    // Contar livros lidos
    let livrosLidosHTML = 0;
    livrosHTML.forEach(cartao => {
        const etiqueta = cartao.querySelector('.etiqueta-status');
        if (etiqueta && etiqueta.className.includes('lido')) {
            livrosLidosHTML++;
        }
    });
    const livrosLidosJS = livros.filter(l => l.statusFront === 'lido').length;
    const livrosLidos = livrosLidosHTML + livrosLidosJS;

    // Calcular tempo médio (dias por livro) - exemplo: 15 dias por livro lido
    const tempoMedio = livrosLidos > 0 ? Math.round(365 / livrosLidos) : 0;

    // Calcular avaliação média - exemplo: 4.2 estrelas
    const avaliacaoMedia = livrosLidos > 0 ? (4.2).toFixed(1) : '0.0';

    // Atualizar exibição
    document.getElementById('tempoMedio').textContent = tempoMedio;
    document.getElementById('avaliacaoMedia').textContent = avaliacaoMedia;
    document.getElementById('totalLivrosPerfil').textContent = totalLivros;
    document.getElementById('livrosLidos').textContent = livrosLidos;

    // Calcular páginas lidas (estimativa: 300 páginas por livro lido)
    const paginasLidas = livrosLidos * 300;
    document.getElementById('paginasLidas').textContent = paginasLidas.toLocaleString();

    // Mês mais ativo (exemplo)
    document.getElementById('mesAtivo').textContent = 'Jan';

    // Calcular progresso anual
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

// Atualizar filtro por ano
function atualizarFiltroAno() {
    // Dados de exemplo para anos
    const anos = [
        { ano: '2024', quantidade: 8 },
        { ano: '2023', quantidade: 12 },
        { ano: '2022', quantidade: 10 },
        { ano: '2021', quantidade: 6 },
        { ano: '2020', quantidade: 4 }
    ];

    const container = document.getElementById('livrosPorAno');
    if (!container) return;

    // Criar gráfico de barras simples
    let html = '<div class="grafico-barras">';

    anos.forEach(item => {
        const altura = Math.min(item.quantidade * 15, 150); // Máximo 150px
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

// Filtrar livros por ano
function filtrarLivrosPorAno(ano) {
    const container = document.getElementById('livrosPorAno');

    if (ano === 'todos') {
        atualizarFiltroAno();
        return;
    }

    // Exemplo de dados para cada ano (em uma implementação real, isso viria do backend)
    const livrosExemplo = {
        '2024': [
            { titulo: 'Heartstopper - Volume 5', autor: 'Alice Oseman', capa: 'imgs/Heartstopper5.jpg' },
            { titulo: 'A Empregada - Livro 3', autor: 'Freida McFadden', capa: 'imgs/A Empregada 3.jpg' },
            { titulo: 'Harry Potter e as Relíquias da Morte', autor: 'J.K. Rowling', capa: 'imgs/Harry7.jpg' }
        ],
        '2025': [
            { titulo: 'Livro Planejado 2025', autor: 'Autor Exemplo', capa: '' }
        ],
        '2026': [],
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

// Renderizar gêneros preferidos
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

    // Ordenar por quantidade (do maior para o menor)
    generos.sort((a, b) => b.quantidade - a.quantidade);

    // Pegar os top 6 gêneros
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

// Detectar gêneros automaticamente (baseado nos títulos)
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

    // Contar livros do HTML
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

    // Contar livros do JS
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

    // Converter para array
    const generosArray = Object.entries(contadorGeneros).map(([nome, quantidade]) => ({
        nome,
        quantidade
    }));

    // Salvar no perfil
    let perfil = JSON.parse(localStorage.getItem('bookHubPerfil')) || {};
    perfil.generos = generosArray;
    localStorage.setItem('bookHubPerfil', JSON.stringify(perfil));

    // Renderizar
    renderizarGeneros(generosArray);

    return generosArray;
}

// Atualizar todas as estatísticas (livros + perfil)
function atualizarTodasEstatisticas() {
    atualizarEstatisticas();
    calcularEstatisticasPerfil();
    detectarGenerosLivros();
}

console.log('Book Hub iniciado com sucesso! Perfil do usuário carregado.');