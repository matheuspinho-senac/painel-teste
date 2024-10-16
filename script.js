document.addEventListener("DOMContentLoaded", function () {
    const eixoSelect = document.getElementById("eixo");
    const segmentoSelect = document.getElementById("segmento");
    const tipoCursoSelect = document.getElementById("tipoCurso");
    const formatoSelect = document.getElementById("formato");
    const autorInput = document.getElementById("autor");
    const resultsContainer = document.getElementById("results");
    const quantidadeResultados = document.getElementById("quantidadeResultados");
    const additionalFilters = document.getElementById("additionalFilters");
    const filterToggle = document.getElementById("filterToggle");

    let segmentos = [];
    let acervo = [];

    // Carregar os JSONs
    function loadJSON() {
        return Promise.all([
            fetch('segmentos.json').then(response => response.json()),
            fetch('acervo.json').then(response => response.json())
        ]).then(([segmentosData, acervoData]) => {
            segmentos = segmentosData;
            acervo = acervoData;
            populateEixoOptions();
        }).catch(error => {
            console.error("Erro ao carregar os arquivos JSON: ", error);
        });
    }

    // Popular opções de Eixo Tecnológico
    function populateEixoOptions() {
        const eixos = [...new Set(segmentos.map(item => item["Eixo Tecnológico"]))];
        populateSelect(eixoSelect, eixos);
    }

    function populateSelect(selectElement, options) {
        selectElement.innerHTML = '<option value="">Selecione</option>';
        options.forEach(option => {
            if (option.trim() !== "") {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
            }
        });
    }

    // Atualizar Segmentos com base no Eixo Tecnológico
    eixoSelect.addEventListener("change", function () {
        const eixoSelecionado = eixoSelect.value;
        const segmentosFiltrados = segmentos.filter(item => item["Eixo Tecnológico"] === eixoSelecionado);
        const segmentosUnicos = [...new Set(segmentosFiltrados.flatMap(item => 
            item.Segmentos.split(";")
                .map(seg => seg.trim())
                .filter(seg => seg && !seg.toLowerCase().startsWith("falso"))
        ))];
        populateSelect(segmentoSelect, segmentosUnicos);
        segmentoSelect.disabled = false;
        tipoCursoSelect.disabled = true;
        tipoCursoSelect.innerHTML = '<option value="">Selecione</option>';
    });

    // Atualizar Tipos de Curso com base no Segmento
    segmentoSelect.addEventListener("change", function () {
        const eixoSelecionado = eixoSelect.value;
        const segmentoSelecionado = segmentoSelect.value;
        const tiposFiltrados = segmentos
            .filter(item => item["Eixo Tecnológico"] === eixoSelecionado && item.Segmentos.includes(segmentoSelecionado))
            .flatMap(item => item["Tipo de Curso"].split(";"));
        const tiposUnicos = [...new Set(tiposFiltrados)];
        populateSelect(tipoCursoSelect, tiposUnicos);
        tipoCursoSelect.disabled = false;
    });

    // Função para pesquisar e exibir os resultados
    function searchResults(event) {
        event.preventDefault();
        const eixo = eixoSelect.value;
        const segmento = segmentoSelect.value;

        const cursosFiltrados = acervo.filter(curso => {
            const segmentosCurso = curso.Segmentos.split(";")
                .map(seg => seg.trim())
                .filter(seg => seg && !seg.toLowerCase().startsWith("falso"));
            return segmentosCurso.includes(segmento);
        });

        displayResults(cursosFiltrados);
        populateFormatoOptions(cursosFiltrados);
    }

    // Popular opções de Formato
    function populateFormatoOptions(cursos) {
        const formatos = [...new Set(cursos.map(curso => curso.Formato))];
        populateSelect(formatoSelect, formatos);
    }

    // Função para filtrar resultados adicionais
    function filterAdditionalResults() {
        const formato = formatoSelect.value;
        const autor = autorInput.value.toLowerCase();

        const cursosFiltrados = Array.from(resultsContainer.children).filter(card => {
            const cardFormato = card.querySelector('[data-formato]').dataset.formato;
            const cardAutor = card.querySelector('[data-autor]').dataset.autor.toLowerCase();
            return (
                (!formato || cardFormato === formato) &&
                (!autor || cardAutor.includes(autor))
            );
        });

        Array.from(resultsContainer.children).forEach(card => {
            card.style.display = cursosFiltrados.includes(card) ? "" : "none";
        });

        quantidadeResultados.textContent = `${cursosFiltrados.length} conteúdos encontrados`;
    }

    // Exibir os resultados filtrados
    function displayResults(cursos) {
        resultsContainer.innerHTML = "";
        quantidadeResultados.textContent = `${cursos.length} conteúdos encontrados`;

        if (cursos.length === 0) {
            resultsContainer.innerHTML = "<p>Nenhum conteúdo encontrado.</p>";
            return;
        }

        cursos.forEach(curso => {
            const card = document.createElement("div");
            card.classList.add("card");

            // Ícones de acordo com o formato
            let formatoIcon;
            if (curso.Formato.toLowerCase() === "mp4") {
                formatoIcon = '<i class="fa-solid fa-video" style="color: #000000;"></i>';
            } else if (curso.Formato.toLowerCase() === "mp3") {
                formatoIcon = '<i class="fa-solid fa-headphones" style="color: #000000;"></i>';
            } else {
                formatoIcon = '<i class="fa-solid fa-book" style="color: #000000;"></i>';
            }

            card.innerHTML = `
                <h2>${curso["Título do conteúdo"]}</h2>
                <p data-autor="${curso.Autor}"><strong>Autor:</strong> ${curso.Autor}</p>
                <p><strong>Segmento:</strong> ${curso.Segmentos}</p>
                <p data-formato="${curso.Formato}"><strong>Formato:</strong> ${curso.Formato} ${formatoIcon}</p>
                <p><strong>ISBN:</strong> ${curso.ISBN}</p>
                <p>
                    <a href="${curso.URL}" target="_blank">
                        
                        <span style="vertical-align: middle;">Clique aqui para acessar o conteúdo</span>
                    </a>
                </p>
            `;
            resultsContainer.appendChild(card);
        });
    }

    // Toggle filtros adicionais
    filterToggle.addEventListener("click", function() {
        additionalFilters.style.display = additionalFilters.style.display === "none" ? "block" : "none";
    });

    // Inicialização
    loadJSON();
    document.getElementById("searchForm").addEventListener("submit", searchResults);
    formatoSelect.addEventListener("change", filterAdditionalResults);
    autorInput.addEventListener("input", filterAdditionalResults);
});