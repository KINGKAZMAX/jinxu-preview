(() => {
  const slides = [
    ["云锦造物规则的转译、生成与交接", "锦序学术汇报封面。蔡智鑫，浙江科技大学。"],
    ["研究背景", "云锦的织造知识依靠拽花工和织手协作，并通过花本和口诀传承。"],
    ["研究问题", "从规则表征、约束生成与方案交接三方面判断设计结果。"],
    ["研究缺口", "核对21个平台的15项功能，发现检索支持较普遍，生成与编辑支持有限。"],
    ["方法框架", "用规则卡串联来源知识、规则、参数、组织和方案交接。"],
    ["规则表征", "归纳12条候选规则，6条已有简化检测器，适用范围和阈值待复核。"],
    ["非遗素材图录", "从云锦、绒花、金箔的实物、纹样和工序进入可追溯记录。"],
    ["数字色谱", "按原站色系整理306条云锦色卡，其中有302个不同色值。", "./#/colors/722231", "色谱 ↗"],
    ["参数化方法", "用半格位移表示半落铺排，并记录配色、组织和检测参数。"],
    ["案例取材", "以克利夫兰艺术博物馆藏元代织金织物为纹样与流程参照。"],
    ["参数对照", "固定裁切和色板，对照平排与半落的重复单元。"],
    ["生成预实验", "180张生成图中，规则提示组均值较高，差异未达显著，置换检验 p 约为0.07。"],
    ["织造组织与交付", "项目、出处与审阅信息可随设计包重开，组织编辑器另行导出 WIF。", "./#/lab?tab=weave", "织造 ↗"],
    ["空间与多端", "已实现浏览器空间预览与手机端，扩展现实场景用于表达交互假设。"],
    ["结论与下一步", "汇总方法、系统与初步评价，下一步是传承人复核、第三方交接验证与试织。", "./#/", "展厅 ↗"],
  ];

  const find = id => document.getElementById(id);
  const home = find("report-home");
  const player = find("report-player");
  const stage = find("slide-view");
  const imageSlot = find("slide-image");
  const startButton = find("report-start");
  const exitButton = find("report-exit");
  const fullButton = find("report-fullscreen");
  const previousButton = find("slide-prev");
  const nextButton = find("slide-next");
  const select = find("slide-select");
  const link = find("slide-link");
  const status = find("slide-status");
  const message = find("slide-message");
  const messageText = find("slide-message-text");
  const retry = find("slide-retry");
  const canHideControls = matchMedia("(hover: hover) and (pointer: fine)");
  const nativeFullscreen = typeof player.requestFullscreen === "function" && document.fullscreenEnabled;

  let active = false;
  let nativeOpen = false;
  let index = 0;
  let idleTimer = 0;
  let requestId = 0;
  let gesture;
  const pending = new Map();
  const pageLabel = number => String(number).padStart(2, "0");

  function getImage(page) {
    if (pending.has(page)) return pending.get(page);

    const image = new Image(1920, 1080);
    image.alt = slides[page][0] + "。" + slides[page][1];
    image.decoding = "async";
    image.draggable = false;

    const request = new Promise((resolve, reject) => {
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", reject, { once: true });
      image.src = "./assets/brocade-report/slide-" + pageLabel(page + 1) + ".webp";
    });
    pending.set(page, request);
    request.catch(() => {
      if (pending.get(page) === request) pending.delete(page);
    });
    return request;
  }

  function wakeControls() {
    clearTimeout(idleTimer);
    player.classList.remove("controls-idle");
    if (!active || !canHideControls.matches) return;
    idleTimer = setTimeout(() => {
      if (!document.activeElement?.closest(".player-bar")) player.classList.add("controls-idle");
    }, 2600);
  }

  function showSlide(page, reload = false) {
    if (!active) return;
    index = Math.max(0, Math.min(slides.length - 1, page));
    const currentRequest = ++requestId;
    const [title, , contextUrl, contextLabel] = slides[index];
    const pageNumber = pageLabel(index + 1);
    select.value = String(index);
    previousButton.disabled = index === 0;
    nextButton.disabled = index === slides.length - 1;
    link.hidden = !contextUrl;
    if (contextUrl) {
      link.href = contextUrl;
      link.textContent = contextLabel;
    } else {
      link.removeAttribute("href");
    }

    retry.hidden = true;
    message.hidden = true;
    const waiting = setTimeout(() => {
      if (currentRequest !== requestId) return;
      messageText.textContent = "正在加载第 " + pageNumber + " 页";
      message.hidden = false;
    }, 250);

    if (reload) pending.delete(index);
    for (const key of pending.keys()) {
      if (Math.abs(key - index) > 1) pending.delete(key);
    }
    getImage(index).then(image => {
      if (!active || currentRequest !== requestId) return;
      message.hidden = true;
      imageSlot.replaceChildren(image);
      status.textContent = "第 " + pageNumber + " 页，共 " + slides.length + " 页 · " + title;
      if (index + 1 < slides.length) getImage(index + 1).catch(() => {});
      if (index > 0) getImage(index - 1).catch(() => {});
    }).catch(() => {
      if (!active || currentRequest !== requestId) return;
      imageSlot.replaceChildren();
      messageText.textContent = "第 " + pageNumber + " 页未能加载";
      message.hidden = false;
      retry.hidden = false;
    }).finally(() => clearTimeout(waiting));
    wakeControls();
  }

  function requestFullScreen() {
    if (!nativeFullscreen || document.fullscreenElement) return;
    player.requestFullscreen().catch(() => {
      // The viewport-filling presentation remains open on browsers that block native fullscreen.
    });
  }

  function beginPresentation() {
    active = true;
    home.hidden = true;
    player.hidden = false;
    document.body.classList.add("is-presenting");
    fullButton.hidden = !nativeFullscreen;
    player.focus({ preventScroll: true });
    showSlide(0);
    requestFullScreen();
  }

  function closePresentation() {
    if (!active) return;
    active = false;
    requestId++;
    clearTimeout(idleTimer);
    gesture = undefined;
    pending.clear();
    player.hidden = true;
    home.hidden = false;
    imageSlot.replaceChildren();
    document.body.classList.remove("is-presenting");
    if (document.fullscreenElement === player) document.exitFullscreen().catch(() => {});
    startButton.focus({ preventScroll: true });
  }

  slides.forEach(([title], page) => {
    const option = new Option(
      pageLabel(page + 1) + " / " + slides.length + " · " + (page === 0 ? "封面" : title),
      String(page),
    );
    select.add(option);
  });
  startButton.disabled = false;
  startButton.addEventListener("click", beginPresentation);
  exitButton.addEventListener("click", closePresentation);
  fullButton.addEventListener("click", requestFullScreen);
  previousButton.addEventListener("click", () => showSlide(index - 1));
  nextButton.addEventListener("click", () => showSlide(index + 1));
  select.addEventListener("change", () => showSlide(Number(select.value)));
  retry.addEventListener("click", () => showSlide(index, true));
  player.addEventListener("pointermove", wakeControls, { passive: true });
  player.addEventListener("focusin", wakeControls);
  player.addEventListener("focusout", wakeControls);

  document.addEventListener("fullscreenchange", () => {
    const wasNative = nativeOpen;
    nativeOpen = document.fullscreenElement === player;
    fullButton.hidden = !nativeFullscreen || nativeOpen;
    if (wasNative && !nativeOpen) closePresentation();
  });

  document.addEventListener("keydown", event => {
    if (!active || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closePresentation();
      return;
    }
    if (event.target instanceof HTMLSelectElement) return;
    const actions = {
      ArrowLeft: index - 1, ArrowUp: index - 1, PageUp: index - 1,
      ArrowRight: index + 1, ArrowDown: index + 1, PageDown: index + 1,
      Home: 0, End: slides.length - 1,
    };
    if (Object.hasOwn(actions, event.key)) {
      event.preventDefault();
      showSlide(actions[event.key]);
    } else if (event.key === " " && event.target === player) {
      event.preventDefault();
      showSlide(index + 1);
    }
  });

  stage.addEventListener("pointerdown", event => {
    if (!active || !event.isPrimary || event.pointerType === "mouse") return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointerup", event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = undefined;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.25) showSlide(index + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener("pointercancel", () => { gesture = undefined; });
})();
