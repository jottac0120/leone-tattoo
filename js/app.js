// LEONE TATTOO — base script (estrutural)
// GSAP / ScrollTrigger / Lenis e animações cinematográficas entram em etapa futura.

(function () {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

// ---------- Sobre (01 — O Artista): entrada única quando a seção aparece na tela ----------
// Sem IntersectionObserver ou com prefers-reduced-motion, a classe "sobre-anim-ready"
// nunca é adicionada e o conteúdo fica sempre visível (ver css/style.css) — nada de
// seção invisível por falta de JS. O observer se desconecta após disparar uma vez: não
// há loop, não há nova animação ao rolar de novo por cima da seção.
(function () {
  const section = document.getElementById("sobre");
  if (!section) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced || typeof window.IntersectionObserver === "undefined") return;

  section.classList.add("sobre-anim-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        section.classList.add("is-visible");
        observer.disconnect();
      });
    },
    // threshold:0 + rootMargin (em vez de "20% da seção visível"): a seção é alta (foto +
    // biografia + destaques), e em telas baixas (celular deitado) 20% dela pode ser maior
    // que a própria viewport — o gatilho nunca dispararia e o conteúdo ficaria invisível.
    // Assim dispara assim que o topo da seção entra nos ~88% superiores da tela.
    { threshold: 0, rootMargin: "0px 0px -12% 0px" }
  );
  observer.observe(section);
})();

// ---------- Além da Tatuagem: entrada única por capítulo quando aparece na tela ----------
// Mesmo padrão da entrada de "Sobre" logo acima, só que com 3 alvos (um por capítulo) no
// MESMO observer, cada um revelando só a si mesmo e se desconectando depois de disparar —
// não tem loop, não tem "capítulo 2" reaparecendo se o usuário rolar de volta pro topo.
// Sem IntersectionObserver ou com prefers-reduced-motion, "beyond-anim-ready" nunca é
// adicionada e os 3 capítulos ficam sempre visíveis (ver css/style.css). Nada aqui lê
// scroll position/scrollY nem controla progresso de nada pelo scroll.
(function () {
  const section = document.getElementById("alem-da-tatuagem");
  if (!section) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced || typeof window.IntersectionObserver === "undefined") return;

  const chapters = Array.from(section.querySelectorAll(".beyond-chapter"));
  if (!chapters.length) return;

  section.classList.add("beyond-anim-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0, rootMargin: "0px 0px -10% 0px" }
  );
  chapters.forEach((chapter) => observer.observe(chapter));
})();

// ---------- Além da Tatuagem: lightbox próprio ----------
// Reaproveita o MESMO visual do lightbox do Portfólio (classes .lightbox/.lightbox-figure/
// .lightbox-nav/.lightbox-close/.lightbox-counter, já estilizadas em css/style.css, com
// object-fit:contain — nunca corta a imagem ampliada), mas com seu próprio modal
// (#beyond-lightbox) e seu próprio script: não lê, não chama e não altera nada do
// lightbox/script do Portfólio. Ao clicar numa foto, "anterior/próxima" navega só entre as
// fotos do MESMO capítulo (cada capítulo é o seu próprio conjunto), não pelas 13 juntas.
(function () {
  const lightbox = document.getElementById("beyond-lightbox");
  if (!lightbox) return;

  const galleries = Array.from(document.querySelectorAll("#alem-da-tatuagem .beyond-gallery"));
  if (!galleries.length) return;

  const lightboxImg = document.getElementById("beyond-lightbox-img");
  const counter = document.getElementById("beyond-lightbox-counter");
  const closeBtn = document.getElementById("beyond-lightbox-close");
  const prevBtn = document.getElementById("beyond-lightbox-prev");
  const nextBtn = document.getElementById("beyond-lightbox-next");

  let activeButtons = [];
  let currentIndex = 0;
  let lastFocused = null;

  function openLightbox(buttons, index) {
    activeButtons = buttons;
    currentIndex = (index + activeButtons.length) % activeButtons.length;
    const img = activeButtons[currentIndex].querySelector("img");

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    counter.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(activeButtons.length).padStart(2, "0")}`;

    lastFocused = document.activeElement;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxImg.src = "";
    if (lastFocused) lastFocused.focus();
  }

  function showNext() { openLightbox(activeButtons, currentIndex + 1); }
  function showPrev() { openLightbox(activeButtons, currentIndex - 1); }

  galleries.forEach((grid) => {
    const buttons = Array.from(grid.querySelectorAll(".beyond-photo-btn"));
    buttons.forEach((btn, index) => {
      btn.addEventListener("click", () => openLightbox(buttons, index));
    });
  });

  closeBtn.addEventListener("click", closeLightbox);
  nextBtn.addEventListener("click", showNext);
  prevBtn.addEventListener("click", showPrev);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") showNext();
    if (event.key === "ArrowLeft") showPrev();
  });
})();

// ---------- Portfólio: masonry (grid-row-end calculado pela altura real da imagem) ----------
(function () {
  const grid = document.getElementById("portfolio-grid");
  if (!grid) return;

  const items = Array.from(grid.querySelectorAll(".portfolio-item"));

  function layout() {
    const styles = getComputedStyle(grid);
    const rowHeight = parseFloat(styles.getPropertyValue("grid-auto-rows")) || 8;
    const rowGap = parseFloat(styles.getPropertyValue("row-gap")) || 0;

    items.forEach((item) => {
      const img = item.querySelector("img");
      // Medir a imagem (não o item): o item já pode ter um grid-row-end
      // de um cálculo anterior, o que travaria a altura medida num loop.
      // A imagem sempre reflete sua altura natural (width:100%, height:auto).
      const height = img.getBoundingClientRect().height;
      if (!height) return;
      const span = Math.ceil((height + rowGap) / (rowHeight + rowGap));
      item.style.gridRowEnd = `span ${span}`;
    });
  }

  items.forEach((item) => {
    const img = item.querySelector("img");
    if (img.complete && img.naturalWidth) return;
    img.addEventListener("load", layout);
  });

  layout();
  window.addEventListener("load", layout);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  });
})();

// ---------- Portfólio: lightbox ----------
(function () {
  const grid = document.getElementById("portfolio-grid");
  const lightbox = document.getElementById("lightbox");
  if (!grid || !lightbox) return;

  const items = Array.from(grid.querySelectorAll(".portfolio-item"));
  const lightboxImg = document.getElementById("lightbox-img");
  const counter = document.getElementById("lightbox-counter");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  let currentIndex = 0;
  let lastFocused = null;

  function openLightbox(index) {
    currentIndex = (index + items.length) % items.length;
    const img = items[currentIndex].querySelector("img");

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    counter.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;

    lastFocused = document.activeElement;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxImg.src = "";
    if (lastFocused) lastFocused.focus();
  }

  function showNext() { openLightbox(currentIndex + 1); }
  function showPrev() { openLightbox(currentIndex - 1); }

  items.forEach((item, index) => {
    item.addEventListener("click", () => openLightbox(index));
  });

  closeBtn.addEventListener("click", closeLightbox);
  nextBtn.addEventListener("click", showNext);
  prevBtn.addEventListener("click", showPrev);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") showNext();
    if (event.key === "ArrowLeft") showPrev();
  });
})();

// ---------- Experiência Cinematográfica: fumaça atmosférica controlada pelo scroll ----------
// Única animação desta seção — as imagens/textos dos atos continuam 100% estáticos.
// Reaproveita o GSAP/ScrollTrigger já carregados para o Hero (nenhum listener de scroll
// novo é criado). Sem GSAP/ScrollTrigger ou com prefers-reduced-motion, a fumaça
// simplesmente não aparece (opacity:0 é o padrão em css/style.css).
//
// CONTENÇÃO: as 3 camadas (.smoke-layer) são filhas de #narrative-acts, que tem
// overflow:hidden — por isso a fumaça nunca aparece em Especialidade (antes) nem
// Portfólio (depois), não importa o quanto as camadas se movam.
(function () {
  const stage = document.getElementById("narrative-acts");
  if (!stage) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (prefersReduced || !hasGsap) return;

  const back = stage.querySelector(".smoke-back");
  const main = stage.querySelector(".smoke-main");
  const front = stage.querySelector(".smoke-front");
  if (!back || !main || !front) return;

  gsap.registerPlugin(ScrollTrigger);

  // Cada camada mede 120vh (ver CSS) — para ela atravessar uma FRAÇÃO da altura real
  // da seção (medida, não um valor fixo), convertemos essa distância em yPercent
  // (unidade relativa à própria altura do elemento, que é o que GSAP usa para y%).
  let stageHeight = stage.offsetHeight;
  let layerHeightPx = window.innerHeight * 1.2;
  function travelYPercent(fractionOfStage) {
    return ((stageHeight * fractionOfStage) / layerHeightPx) * 100;
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      stageHeight = stage.offsetHeight;
      layerHeightPx = window.innerHeight * 1.2;
      ScrollTrigger.refresh();
    }, 150);
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.6,
    },
  });

  // Envelope de opacidade compartilhado (entra quase fora do enquadramento, mantém
  // presença forte ao longo dos 4 atos, sai completamente antes do fim da seção).
  // xMid/xEnd criam a "pequena curva" de direção pedida — não é uma linha reta.
  // scaleMid/rotateMid dão uma leve respiração/torção no meio do trajeto (a forma
  // "muda" de leve, em vez de só transladar) — tudo preso ao mesmo progresso de
  // scroll da camada, nunca por tempo.
  function addLayer(layer, opts) {
    tl.fromTo(layer, { yPercent: -50 }, { yPercent: travelYPercent(opts.travel), ease: "none", duration: 1 }, 0);
    tl.to(layer, { xPercent: opts.xMid, ease: "none", duration: 0.5 }, 0);
    tl.to(layer, { xPercent: opts.xEnd, ease: "none", duration: 0.5 }, 0.5);
    tl.fromTo(
      layer,
      { scale: 1, rotate: 0 },
      { scale: opts.scaleMid, rotate: opts.rotateMid, ease: "none", duration: 0.5 },
      0
    );
    tl.to(layer, { scale: opts.scaleEnd, rotate: opts.rotateEnd, ease: "none", duration: 0.5 }, 0.5);
    tl.fromTo(layer, { opacity: 0 }, { opacity: opts.peak, ease: "none", duration: 0.12 }, 0);
    tl.to(layer, { opacity: opts.peak, ease: "none", duration: 0.72 }, 0.12);
    tl.to(layer, { opacity: 0, ease: "none", duration: 0.16 }, 0.84);
  }

  // "peak" perto de 1 em todas: a intensidade real agora já está nas rgba() mais
  // fortes do CSS; isto só controla o envelope de entrada/presença/saída.
  // Camada de fundo: maior, mais lenta, respiração de escala mais ampla.
  addLayer(back, { travel: 0.55, xMid: 4, xEnd: -3, scaleMid: 1.12, scaleEnd: 1.22, rotateMid: 3, rotateEnd: -2, peak: 1 });
  // Camada principal: velocidade média, curva de direção mais perceptível.
  addLayer(main, { travel: 0.8, xMid: 16, xEnd: -8, scaleMid: 1.08, scaleEnd: 1.18, rotateMid: -4, rotateEnd: 5, peak: 1 });
  // Camada da frente: mais rápida ("próxima da câmera"), curva mais acentuada.
  addLayer(front, { travel: 1.05, xMid: -14, xEnd: 24, scaleMid: 1.15, scaleEnd: 1.05, rotateMid: 6, rotateEnd: -6, peak: 1 });
})();

// ---------- Hero: vídeo de fundo autônomo + scroll só anima os textos ----------
// (GSAP + ScrollTrigger, carregados via CDN no fim do body). O vídeo
// (assets/video/Torre_Tattoo_Studio_logo_reveal.mp4) toca sozinho via autoplay+loop no
// próprio <video> (ver index.html) — nada aqui controla currentTime nem aplica zoom/pan/
// scale nele. Isso é proposital: essa lógica existia SÓ para o vídeo antigo (câmera
// simulada via scrub de currentTime pelo scroll) e foi removida por completo junto com a
// troca de vídeo — o novo vídeo já tem sua própria animação/iluminação e deve rodar do
// jeito que foi gravado, sem interferência do scroll.
// O que continua preso ao scroll é só a coreografia de texto que já existia (pin da seção
// + fade/parallax dos elementos do Hero) e a correção do "ghost" no fim (autoAlpha) — isso
// não mexe no vídeo, só nos textos/botões por cima dele. Sem GSAP/ScrollTrigger, com
// prefers-reduced-motion, ou em telas <= 860px, essa coreografia de texto não roda, mas o
// vídeo continua tocando normalmente (autoplay é HTML puro, não depende deste script).
(function () {
  const hero = document.getElementById("hero");
  if (!hero) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  // O limite tem que bater exatamente com o breakpoint CSS do Hero (@media
  // max-width:860px em css/style.css), que só esconde elementos decorativos no mobile
  // sem recompor o layout — mas o pin/scrub de scroll continua sendo um recurso só de
  // telas maiores, por robustez em navegadores móveis com barra de endereço dinâmica.
  const MOBILE_BREAKPOINT = 860;
  if (prefersReduced || !hasGsap || window.innerWidth <= MOBILE_BREAKPOINT) return;

  gsap.registerPlugin(ScrollTrigger);

  const eyebrow = hero.querySelector(".hero-eyebrow");
  const title = hero.querySelector(".hero-title");
  const tag = hero.querySelector(".hero-tag");
  const tagline = hero.querySelector(".hero-tagline");
  const ctas = hero.querySelector(".hero-ctas");
  const sideLeft = hero.querySelector(".hero-side--left");
  const sideRight = hero.querySelector(".hero-side--right");
  const statement = hero.querySelector(".hero-statement");
  const scrollCue = hero.querySelector(".scroll-cue");

  // Sequência de ~280vh no total (100vh iniciais da viewport + ~180vh de pin), dentro
  // da faixa de 200-300vh já usada antes — só a coreografia de texto/pin, sem o vídeo.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: () => "+=" + Math.round(window.innerHeight * 1.8),
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  // ---- Parallax de profundidade: cada "camada" de texto desloca em X a uma taxa
  // diferente (nunca a mesma propriedade "y" já usada pelo desaparecimento abaixo, então
  // as duas animações não conflitam). O vídeo de fundo não participa mais deste parallax
  // (ver comentário no topo do arquivo) — título é a camada que mais se desloca, subtítulo/
  // tag mais lentos ainda,
  // indicadores laterais quase parados, elementos inferiores em direção oposta.
  if (title) tl.to(title, { x: -10, duration: 1, ease: "none" }, 0);
  if (eyebrow) tl.to(eyebrow, { x: -6, duration: 1, ease: "none" }, 0);
  if (tag) tl.to(tag, { x: -5, duration: 1, ease: "none" }, 0);
  if (tagline) tl.to(tagline, { x: -5, duration: 1, ease: "none" }, 0);
  if (ctas) tl.to(ctas, { x: -4, duration: 1, ease: "none" }, 0);
  if (sideLeft) tl.to(sideLeft, { x: -2, duration: 1, ease: "none" }, 0);
  if (sideRight) tl.to(sideRight, { x: -2, duration: 1, ease: "none" }, 0);
  if (statement) tl.to(statement, { x: 6, duration: 1, ease: "none" }, 0);

  // ---- Textos desaparecendo. Ordem: botões primeiro, depois tagline, depois
  // "Black & Grey Realism", depois "LEONE TATTOO" recua (escala + sobe, não só some),
  // elementos decorativos por último. O scroll-cue some assim que o scroll começa.
  if (scrollCue) tl.to(scrollCue, { opacity: 0, duration: 0.03, ease: "power1.in" }, 0.02);
  if (ctas) tl.to(ctas, { opacity: 0, y: -14, duration: 0.06, ease: "power1.in" }, 0.38);
  if (tagline) tl.to(tagline, { opacity: 0, y: -16, duration: 0.06, ease: "power1.in" }, 0.42);
  if (tag) tl.to(tag, { opacity: 0, y: -14, duration: 0.06, ease: "power1.in" }, 0.46);
  if (title)
    tl.to(
      title,
      { opacity: 0, y: -26, scale: 0.94, duration: 0.08, ease: "power1.in", transformOrigin: "0% 50%" },
      0.5
    );
  if (eyebrow) tl.to(eyebrow, { opacity: 0, y: -14, duration: 0.06, ease: "power1.in" }, 0.55);
  if (sideLeft) tl.to(sideLeft, { opacity: 0, duration: 0.06, ease: "power1.in" }, 0.56);
  if (sideRight) tl.to(sideRight, { opacity: 0, duration: 0.06, ease: "power1.in" }, 0.57);

  // Frase de assinatura surge brevemente no meio da sequência
  if (statement) {
    tl.to(statement, { opacity: 1, duration: 0.05, ease: "power2.out" }, 0.62).to(
      statement,
      { opacity: 0, duration: 0.05, ease: "power2.in" },
      0.72
    );
  }

  // Correção de bug: sem isto, quando o pin termina o GSAP libera #hero de volta ao
  // fluxo normal do documento exatamente com o estado visual do último frame (textos já
  // invisíveis) — esse retângulo de 100vh aparecia de novo, agora como conteúdo normal,
  // entre o fim do pin e o início da seção "Sobre". Mesmo tl com scrub, então reverte
  // sozinho ao rolar para cima; não é uma animação nova.
  tl.to(hero, { autoAlpha: 0, duration: 0.001, ease: "none" }, 0.999);

  // A sequência termina e o pin libera para a próxima seção — sem corte seco, sem
  // blur, sem escurecimento adicional além do que já existe estaticamente no scrim.
})();

// ---------- Contato (08 — Orçamento): estimador LOCAL -> PROJETO -> ESTIMATIVA -> WhatsApp ----------
// 100% frontend (sem backend/API/banco). Tudo é disparado por CLIQUE — nada de scroll,
// scrollY ou IntersectionObserver controlando o fluxo. Os preços de PRICES são os valores
// OFICIAIS do Patrick: não arredondar, não transformar valor fixo em faixa nem misturar os
// estúdios. Os nomes mostrados na estimativa e enviados no WhatsApp saem do próprio texto dos
// botões no HTML (fonte única); as chaves data-studio/data-project precisam existir em PRICES
// (se não existirem, a estimativa NÃO aparece — nunca mostra um preço "chutado").
(function () {
  const root = document.getElementById("estimator");
  if (!root) return;

  const WHATSAPP_NUMBER = "5521976981687";

  // [preço] = valor fixo; [mínimo, máximo] = faixa. Inteiros em reais.
  const PRICES = {
    torre: {
      "fechamento-externo-braco": [1900, 2500],
      "fechamento-interno-braco": [1500, 2000],
      "braco-externa": [1400],
      "braco-interna": [1400],
      "antebraco": [1300],
      "perna-completo": [3400],
      "coxa": [2000],
      "canela": [1500],
      "panturrilha": [1500],
      "peito": [3000],
      "costas": [10000],
    },
    deangelis: {
      "fechamento-externo-braco": [5700, 7500],
      "fechamento-interno-braco": [4500, 6000],
      "braco-externa": [4200],
      "braco-interna": [4200],
      "antebraco": [3900],
      "perna-completo": [10200],
      "coxa": [6000],
      "canela": [4500],
      "panturrilha": [4500],
      "peito": [9000],
      "costas": [30000],
    },
  };

  const stepStudio = document.getElementById("est-step-studio");
  const stepProject = document.getElementById("est-step-project");
  const stepResult = document.getElementById("est-step-result");
  const result = document.getElementById("est-result");
  const studioOut = document.getElementById("est-result-studio");
  const projectOut = document.getElementById("est-result-project");
  const priceOut = document.getElementById("est-price");
  const cta = document.getElementById("est-cta");
  const live = document.getElementById("est-live");
  const studioBtns = Array.from(root.querySelectorAll("[data-studio]"));
  const projectBtns = Array.from(root.querySelectorAll("[data-project]"));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = { studio: null, project: null };

  // 1900 -> "R$ 1.900" (separador de milhar manual: independe de Intl/locale do navegador).
  function brl(n) {
    return "R$ " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function labelOf(btn) {
    const named = btn.querySelector(".est-studio-name");
    return (named || btn).textContent.trim();
  }

  // Revela um passo [hidden] com uma transição curta (opacity + translateY). Retorna true se ele
  // acabou de aparecer (false se já estava visível).
  function reveal(step) {
    if (!step.hidden) return false;
    step.hidden = false;
    if (!reduceMotion) {
      step.classList.add("is-enter");
      void step.offsetHeight; // fixa o estado de partida antes de soltar a transição
      step.classList.remove("is-enter");
    }
    return true;
  }

  // Só rola se o bloco não estiver inteiramente visível — e só o mínimo necessário. É uma
  // reação ao clique do usuário, não algo controlado pelo scroll.
  function ensureVisible(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.top >= 96 && r.bottom <= vh - 24) return;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }

  // Valor fixo: "R$ 1.500". Faixa: "R$ 1.900 \u2014 R$ 2.500", com o tra\u00e7o colado ao 1\u00ba valor (espa\u00e7o
  // sem quebra) \u2014 a linha s\u00f3 pode quebrar ENTRE o tra\u00e7o e o 2\u00ba valor, nunca no meio de um pre\u00e7o.
  // O texto sai com espa\u00e7os normais (leitor de tela / copiar e colar), a apar\u00eancia vem do CSS.
  function renderPrice(values) {
    priceOut.textContent = "";
    priceOut.classList.toggle("est-price--range", values.length === 2);
    const first = document.createElement("span");
    first.className = "est-price-part";
    first.textContent = brl(values[0]);
    priceOut.appendChild(first);
    if (values.length === 2) {
      const sep = document.createElement("span");
      sep.className = "est-price-sep";
      sep.textContent = "\u2014";
      first.appendChild(document.createTextNode("\u00a0"));
      first.appendChild(sep);
      priceOut.appendChild(document.createTextNode(" "));
      const second = document.createElement("span");
      second.className = "est-price-part";
      second.textContent = brl(values[1]);
      priceOut.appendChild(second);
    }
  }

  function buildMessage(studioName, projectName, priceText) {
    return (
      "Olá, Patrick! Vi seu site e gostaria de solicitar um orçamento.\n\n" +
      "Local de preferência: " + studioName + "\n" +
      "Projeto: " + projectName + "\n" +
      "Estimativa apresentada: " + priceText + "\n\n" +
      "Gostaria de conversar sobre o meu projeto."
    );
  }

  function render(changed) {
    studioBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.studio === state.studio)));
    projectBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.project === state.project)));

    let projectRevealed = false;
    if (state.studio) projectRevealed = reveal(stepProject);

    const table = state.studio ? PRICES[state.studio] : null;
    const values = table && state.project ? table[state.project] : null;

    if (!values) {
      stepResult.hidden = true;
      cta.setAttribute("href", "https://wa.me/" + WHATSAPP_NUMBER);
      live.textContent = "";
      if (projectRevealed) requestAnimationFrame(() => ensureVisible(stepProject));
      return;
    }

    const studioName = labelOf(studioBtns.find((b) => b.dataset.studio === state.studio));
    const projectName = labelOf(projectBtns.find((b) => b.dataset.project === state.project));
    const priceText = values.map(brl).join(" a ");

    studioOut.textContent = studioName;
    projectOut.textContent = projectName;
    renderPrice(values);
    cta.setAttribute(
      "href",
      "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildMessage(studioName, projectName, priceText))
    );
    live.textContent = "Estimativa: " + studioName + ", " + projectName + ", " + priceText + ".";

    const resultRevealed = reveal(stepResult);
    if (!resultRevealed && changed && !reduceMotion) {
      // estimativa já estava na tela e mudou: re-toca a entrada suave do bloco de preço
      result.classList.remove("is-refresh");
      void result.offsetHeight;
      result.classList.add("is-refresh");
    }
    requestAnimationFrame(() => ensureVisible(stepResult));
  }

  studioBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.studio === btn.dataset.studio) return;
      state.studio = btn.dataset.studio;
      render(true);
    });
  });

  projectBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.project === btn.dataset.project) return;
      state.project = btn.dataset.project;
      render(true);
    });
  });

  // "Alterar local" / "Alterar projeto": leva o usuário de volta ao passo e foca a opção atual.
  root.querySelectorAll("[data-change]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = btn.dataset.change === "studio" ? stepStudio : stepProject;
      const target = step.querySelector('[aria-pressed="true"]') || step.querySelector("button");
      if (target) target.focus({ preventScroll: true });
      step.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  });
})();