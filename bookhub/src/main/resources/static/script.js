/*const dadosIniciais = [
    { id: 1, titulo: "O Alquimista", autor: "Paulo Coelho", status: "LENDO", capa: "https://images-na.ssl-images-amazon.com/images/I/81L6p-SnoSL.jpg" },
    { id: 2, titulo: "1984", autor: "George Orwell", status: "LIDO", capa: "https://images-na.ssl-images-amazon.com/images/I/91SZSW8qSsL.jpg" },
    { id: 3, titulo: "Clean Code", autor: "Robert C. Martin", status: "QUERO_LER", capa: "https://images-na.ssl-images-amazon.com/images/I/41as+4EBUtL.jpg" }
];

let minhaEstante = JSON.parse(localStorage.getItem('minhaEstante')) || dadosIniciais;

const gradeLivros = document.getElementById('gradeLivrosRecentes');
const contagemTotal = document.getElementById('totalLivros');
const contagemLendo = document.getElementById('lendoAgora');

function atualizarInterface() {
    gradeLivros.innerHTML = '';

    minhaEstante.forEach(livro => {
        const cartaoHTML = `
            <div class="cartao-livro animar-entrada">
                <div class="capa-container">
                    <img src="${livro.capa}" alt="${livro.titulo}" class="capa-imagem">
                    <span class="etiqueta-status ${livro.status.toLowerCase()}">${formatarStatus(livro.status)}</span>
                </div>
                <div class="detalhes-livro">
                    <h6>${livro.titulo}</h6>
                    <p>${livro.autor}</p>
                </div>
            </div>
        `;
        gradeLivros.insertAdjacentHTML('beforeend', cartaoHTML);
    });

    atualizarWidgets();
}

function atualizarWidgets() {
    contagemTotal.innerText = minhaEstante.length;
    contagemLendo.innerText = minhaEstante.filter(l => l.status === 'LENDO').length;

    const campo*/