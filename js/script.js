let produtos = [];
let carrinho = [];

const productsGrid = document.getElementById("productsGrid");
const cartSidebar = document.getElementById("cartSidebar");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const productModal = document.getElementById("productModal");
const modalProduct = document.getElementById("modalProduct");
const toast = document.getElementById("toast");


// ================================
// CARREGAR PRODUTOS
// ================================

async function carregarProdutos() {

    try {

        const resposta = await fetch("data/dados.json");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os produtos.");
        }

        produtos = await resposta.json();

        renderizarProdutos(produtos);

    } catch (erro) {

        console.error(erro);

        productsGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:50px">
                <h3>Não foi possível carregar o catálogo.</h3>
                <p>Verifique se o arquivo dados.json está na pasta data.</p>
            </div>
        `;
    }
}


// ================================
// RENDERIZAR PRODUTOS
// ================================

function renderizarProdutos(lista) {

    productsGrid.innerHTML = "";

    if (lista.length === 0) {

        productsGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px">
                <h3>Nenhum produto encontrado.</h3>
                <p>Tente outra categoria ou termo de busca.</p>
            </div>
        `;

        return;
    }

    lista.forEach(produto => {

        const card = document.createElement("article");

        card.className = "product-card";

        card.innerHTML = `

            <div class="product-image">

                ${produto.oferta
                    ? `<span class="product-badge offer">OFERTA</span>`
                    : `<span class="product-badge">${produto.publico === "infantil" ? "KIDS" : "NOVO"}</span>`
                }

                <img
                    src="${produto.imagem}"
                    alt="${produto.nome}"
                    loading="lazy"
                >

                <button
                    class="quick-view"
                    onclick="abrirProduto(${produto.id})"
                >
                    VISUALIZAR PRODUTO
                </button>

            </div>

            <div class="product-info">

                <span class="product-brand">
                    ${produto.marca}
                </span>

                <h3 class="product-name">
                    ${produto.nome}
                </h3>

                <div class="product-price">

                    ${
                        produto.precoAntigo
                        ? `<span class="old-price">
                            R$ ${formatarPreco(produto.precoAntigo)}
                           </span>`
                        : ""
                    }

                    R$ ${formatarPreco(produto.preco)}

                </div>

                <button
                    class="add-cart"
                    onclick="adicionarCarrinho(${produto.id})"
                >
                    ADICIONAR AO CARRINHO
                </button>

            </div>
        `;

        productsGrid.appendChild(card);

    });
}


// ================================
// FORMATAÇÃO
// ================================

function formatarPreco(valor) {

    return Number(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


// ================================
// FILTROS
// ================================

function filtrarCategoria(categoria) {

    let resultado;

    if (categoria === "todos") {

        resultado = produtos;

    } else if (categoria === "adulto") {

        resultado = produtos.filter(
            produto => produto.publico === "adulto"
        );

    } else if (categoria === "infantil") {

        resultado = produtos.filter(
            produto => produto.publico === "infantil"
        );

    } else if (categoria === "ofertas") {

        resultado = produtos.filter(
            produto => produto.oferta === true
        );

    } else {

        resultado = produtos.filter(
            produto => produto.categoria === categoria
        );
    }

    renderizarProdutos(resultado);

    document.querySelectorAll(".filter").forEach(btn => {
        btn.classList.remove("active");
    });

    document.querySelector(
        `.filter[data-filter="${categoria}"]`
    )?.classList.add("active");

    document.getElementById("adulto").scrollIntoView({
        behavior: "smooth"
    });
}


// ================================
// BOTÕES DOS FILTROS
// ================================

document.querySelectorAll(".filter").forEach(botao => {

    botao.addEventListener("click", () => {

        const categoria = botao.dataset.filter;

        filtrarCategoria(categoria);

    });

});


// ================================
// BUSCA
// ================================

function pesquisar() {

    const termo = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    if (!termo) {

        renderizarProdutos(produtos);

        return;
    }

    const resultado = produtos.filter(produto => {

        return (
            produto.nome.toLowerCase().includes(termo) ||
            produto.marca.toLowerCase().includes(termo) ||
            produto.categoria.toLowerCase().includes(termo) ||
            produto.publico.toLowerCase().includes(termo)
        );

    });

    renderizarProdutos(resultado);

    document.getElementById("adulto").scrollIntoView({
        behavior: "smooth"
    });
}


document
    .getElementById("searchBtn")
    .addEventListener("click", pesquisar);


document
    .getElementById("searchInput")
    .addEventListener("keydown", event => {

        if (event.key === "Enter") {
            pesquisar();
        }

    });


// ================================
// CARRINHO
// ================================

function adicionarCarrinho(id) {

    const produto = produtos.find(
        item => item.id === id
    );

    if (!produto) return;

    const produtoExistente = carrinho.find(
        item => item.id === id
    );

    if (produtoExistente) {

        produtoExistente.quantidade++;

    } else {

        carrinho.push({
            ...produto,
            quantidade: 1
        });

    }

    atualizarCarrinho();

    mostrarToast(
        `${produto.nome} foi adicionado ao carrinho.`
    );
}


function removerCarrinho(id) {

    carrinho = carrinho.filter(
        produto => produto.id !== id
    );

    atualizarCarrinho();
}


function alterarQuantidade(id, quantidade) {

    const produto = carrinho.find(
        item => item.id === id
    );

    if (!produto) return;

    produto.quantidade += quantidade;

    if (produto.quantidade <= 0) {
        removerCarrinho(id);
        return;
    }

    atualizarCarrinho();
}


function atualizarCarrinho() {

    const quantidade = carrinho.reduce(
        (total, produto) => total + produto.quantidade,
        0
    );

    cartCount.textContent = quantidade;


    if (carrinho.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-cart">

                <span>🛒</span>

                <h3>Seu carrinho está vazio</h3>

                <p>
                    Adicione produtos para começar sua compra.
                </p>

            </div>
        `;

        cartTotal.textContent = "R$ 0,00";

        return;
    }


    cartItems.innerHTML = "";

    let total = 0;


    carrinho.forEach(produto => {

        total += produto.preco * produto.quantidade;

        const item = document.createElement("div");

        item.className = "cart-item";

        item.innerHTML = `

            <img
                src="${produto.imagem}"
                alt="${produto.nome}"
            >

            <div>

                <h4>${produto.nome}</h4>

                <p>
                    R$ ${formatarPreco(produto.preco)}
                </p>

                <div style="
                    display:flex;
                    gap:8px;
                    margin-top:10px;
                    align-items:center;
                ">

                    <button
                        onclick="alterarQuantidade(${produto.id}, -1)"
                        style="
                            border:1px solid #ddd;
                            background:white;
                            width:25px;
                            height:25px;
                        "
                    >
                        −
                    </button>

                    <span style="font-size:11px">
                        ${produto.quantidade}
                    </span>

                    <button
                        onclick="alterarQuantidade(${produto.id}, 1)"
                        style="
                            border:1px solid #ddd;
                            background:white;
                            width:25px;
                            height:25px;
                        "
                    >
                        +
                    </button>

                </div>

            </div>

            <button
                class="remove-item"
                onclick="removerCarrinho(${produto.id})"
            >
                ×
            </button>
        `;

        cartItems.appendChild(item);

    });


    cartTotal.textContent =
        `R$ ${formatarPreco(total)}`;
}


// ================================
// ABRIR / FECHAR CARRINHO
// ================================

function abrirCarrinho() {

    cartSidebar.classList.add("active");
    overlay.classList.add("active");

}


function fecharCarrinho() {

    cartSidebar.classList.remove("active");
    overlay.classList.remove("active");

}


document
    .getElementById("cartBtn")
    .addEventListener("click", abrirCarrinho);


document
    .getElementById("closeCart")
    .addEventListener("click", fecharCarrinho);


overlay.addEventListener("click", fecharCarrinho);


// ================================
// PRODUTO
// ================================

function abrirProduto(id) {

    const produto = produtos.find(
        item => item.id === id
    );

    if (!produto) return;

    modalProduct.innerHTML = `

        <div class="modal-product">

            <img
                src="${produto.imagem}"
                alt="${produto.nome}"
            >

            <div class="modal-details">

                <span class="brand">
                    ${produto.marca}
                </span>

                <h2>
                    ${produto.nome}
                </h2>

                <p>
                    ${produto.descricao}
                </p>

                <div class="modal-price">
                    R$ ${formatarPreco(produto.preco)}
                </div>

                <select class="modal-select">
                    <option value="">
                        Escolha o tamanho
                    </option>

                    ${produto.tamanhos
                        .map(tamanho =>
                            `<option>${tamanho}</option>`
                        )
                        .join("")
                    }

                </select>

                <button
                    class="modal-add"
                    onclick="adicionarCarrinho(${produto.id}); fecharModal();"
                >
                    ADICIONAR AO CARRINHO
                </button>

            </div>

        </div>
    `;

    productModal.classList.add("active");
}


function fecharModal() {

    productModal.classList.remove("active");

}


document
    .getElementById("closeModal")
    .addEventListener("click", fecharModal);


productModal.addEventListener("click", event => {

    if (event.target === productModal) {
        fecharModal();
    }

});


// ================================
// TOAST
// ================================

function mostrarToast(mensagem) {

    toast.textContent = mensagem;

    toast.classList.add("active");

    setTimeout(() => {

        toast.classList.remove("active");

    }, 2500);

}


// ================================
// NEWSLETTER
// ================================

document
    .getElementById("newsletterForm")
    .addEventListener("submit", event => {

        event.preventDefault();

        const email = event.target
            .querySelector("input")
            .value;

        if (!email) return;

        mostrarToast(
            "Cadastro realizado com sucesso!"
        );

        event.target.reset();

    });


// ================================
// MENU MOBILE
// ================================

document
    .getElementById("menuBtn")
    .addEventListener("click", () => {

        document
            .getElementById("navigation")
            .classList.toggle("active");

    });


// ================================
// CHECKOUT
// ================================

document
    .getElementById("checkoutBtn")
    .addEventListener("click", () => {

        if (carrinho.length === 0) {

            mostrarToast(
                "Adicione algum produto ao carrinho."
            );

            return;
        }

        mostrarToast(
            "Checkout demonstrativo iniciado."
        );

    });


// ================================
// INICIALIZAÇÃO
// ================================

carregarProdutos();