(function () {
  const { categories, algorithms } = window.VisualizerCatalog;
  const runners = window.VisualizerAlgorithms;

  const SPEED_LABELS = [
    [20, "Slow"],
    [45, "Steady"],
    [70, "Fast"],
    [101, "Max"],
  ];

  const LEGENDS = {
    sorting: [
      ["default", "Unsorted"],
      ["compare", "Comparing"],
      ["write", "Writing"],
      ["pivot", "Pivot"],
      ["sorted", "Sorted"],
    ],
    searching: [
      ["compare", "Probe"],
      ["pivot", "Bounds"],
      ["reject", "Eliminated"],
      ["sorted", "Found"],
    ],
    array: [
      ["compare", "Pointers"],
      ["write", "Window"],
      ["sorted", "Best / done"],
    ],
    math: [
      ["pivot", "Prime"],
      ["compare", "Multiple"],
      ["reject", "Composite"],
      ["sorted", "Prime left"],
    ],
  };

  const state = {
    array: [],
    algo: "bubble",
    category: "sorting",
    running: false,
    paused: false,
    stopRequested: false,
    sorted: new Set(),
    rejected: new Set(),
    found: new Set(),
    comparisons: 0,
    writes: 0,
    startedAt: 0,
    target: null,
    scaleMin: 0,
    scaleMax: 100,
  };

  const barsEl = document.getElementById("bars");
  const sizeSlider = document.getElementById("size-slider");
  const speedSlider = document.getElementById("speed-slider");
  const sizeValue = document.getElementById("size-value");
  const speedValue = document.getElementById("speed-value");
  const generateBtn = document.getElementById("generate-btn");
  const runBtn = document.getElementById("sort-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const stopBtn = document.getElementById("stop-btn");
  const progressBar = document.getElementById("progress-bar");
  const categoryTabs = document.getElementById("category-tabs");
  const algoGrid = document.getElementById("algo-grid");
  const legendEl = document.getElementById("legend");
  const catalogEl = document.getElementById("catalog");
  const targetRow = document.getElementById("target-row");
  const targetValue = document.getElementById("target-value");

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function speedLabel(value) {
    return SPEED_LABELS.find(([limit]) => value < limit)[1];
  }

  function delayFromSpeed(value) {
    return Math.round(220 - value * 2.05);
  }

  function currentMeta() {
    return algorithms.find((item) => item.id === state.algo);
  }

  function setStatus(text) {
    document.getElementById("stat-status").textContent = text;
  }

  function resetStats() {
    state.comparisons = 0;
    state.writes = 0;
    document.getElementById("stat-comparisons").textContent = "0";
    document.getElementById("stat-writes").textContent = "0";
    document.getElementById("stat-time").textContent = "0.00s";
  }

  function barHeight(value) {
    const span = state.scaleMax - state.scaleMin || 1;
    return `${Math.max(8, ((value - state.scaleMin) / span) * 100)}%`;
  }

  function generateArray() {
    const size = Number(sizeSlider.value);
    const meta = currentMeta();
    const mode = meta.generate;
    if (mode === "sorted") {
      const start = randomInt(8, 18);
      state.array = Array.from({ length: size }, (_, i) => start + i * randomInt(1, 3));
    } else if (mode === "dutch") {
      const palette = [20, 50, 90];
      state.array = Array.from({ length: size }, () => palette[randomInt(0, 2)]);
    } else if (mode === "signed") {
      state.array = Array.from({ length: size }, () => randomInt(-24, 40));
    } else if (mode === "sequence") {
      state.array = Array.from({ length: size }, (_, i) => i + 1);
    } else {
      state.array = Array.from({ length: size }, () => randomInt(12, 100));
    }
    state.scaleMin = Math.min(0, ...state.array);
    state.scaleMax = Math.max(...state.array, 1);
    state.sorted = new Set();
    state.rejected = new Set();
    state.found = new Set();
    if (meta.needsTarget) {
      if (meta.pairTarget) {
        const i = randomInt(0, size - 2);
        const j = randomInt(i + 1, size - 1);
        state.target = state.array[i] + state.array[j];
      } else {
        state.target = state.array[randomInt(0, size - 1)];
      }
    } else {
      state.target = null;
    }
    resetStats();
    renderBars();
    renderTarget();
    setStatus("Ready");
    progressBar.style.width = "0%";
  }

  function renderTarget() {
    const meta = currentMeta();
    if (meta.needsTarget) {
      targetRow.hidden = false;
      targetValue.textContent = String(state.target);
    } else {
      targetRow.hidden = true;
    }
  }

  function renderBars() {
    barsEl.innerHTML = "";
    state.array.forEach((value, index) => {
      const bar = document.createElement("div");
      const classes = ["bar"];
      if (state.sorted.has(index)) classes.push("sorted");
      if (state.rejected.has(index)) classes.push("reject");
      if (state.found.has(index)) classes.push("found");
      bar.className = classes.join(" ");
      bar.style.height = barHeight(value);
      bar.dataset.index = String(index);
      barsEl.appendChild(bar);
    });
  }

  function barNodes() {
    return barsEl.querySelectorAll(".bar");
  }

  function clearTransient() {
    barNodes().forEach((bar) => {
      bar.classList.remove("compare", "write", "pivot", "range", "window");
      const index = Number(bar.dataset.index);
      bar.classList.toggle("sorted", state.sorted.has(index));
      bar.classList.toggle("reject", state.rejected.has(index));
      bar.classList.toggle("found", state.found.has(index));
    });
  }

  function mark(indices, className) {
    const nodes = barNodes();
    indices.forEach((index) => {
      if (nodes[index]) nodes[index].classList.add(className);
    });
  }

  function setHeight(index, value) {
    const node = barNodes()[index];
    if (node) node.style.height = barHeight(value);
  }

  function applyFrame(frame) {
    clearTransient();
    if (frame.type === "compare") {
      state.comparisons += 1;
      document.getElementById("stat-comparisons").textContent = String(state.comparisons);
      mark(frame.indices, "compare");
    } else if (frame.type === "swap") {
      const [i, j] = frame.indices;
      const [vi, vj] = frame.values;
      state.array[i] = vi;
      state.array[j] = vj;
      state.writes += 2;
      document.getElementById("stat-writes").textContent = String(state.writes);
      setHeight(i, vi);
      setHeight(j, vj);
      mark(frame.indices, "write");
    } else if (frame.type === "overwrite") {
      state.array[frame.index] = frame.value;
      state.writes += 1;
      document.getElementById("stat-writes").textContent = String(state.writes);
      setHeight(frame.index, frame.value);
      mark([frame.index], "write");
    } else if (frame.type === "pivot") {
      mark(frame.indices, "pivot");
    } else if (frame.type === "range") {
      mark(frame.indices, "pivot");
    } else if (frame.type === "window") {
      mark(frame.indices, "window");
    } else if (frame.type === "sorted") {
      frame.indices.forEach((index) => state.sorted.add(index));
      mark(frame.indices, "sorted");
    } else if (frame.type === "eliminate") {
      frame.indices.forEach((index) => state.rejected.add(index));
      mark(frame.indices, "reject");
    } else if (frame.type === "found") {
      state.found = new Set(frame.indices);
      frame.indices.forEach((index) => state.rejected.delete(index));
      mark(frame.indices, "found");
    }
  }

  function wait(ms) {
    return new Promise((resolve) => {
      const start = performance.now();
      function tick(now) {
        if (state.stopRequested) {
          resolve("stop");
          return;
        }
        if (state.paused) {
          requestAnimationFrame(tick);
          return;
        }
        if (now - start >= ms) {
          resolve("ok");
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  function setControlsRunning(running) {
    state.running = running;
    sizeSlider.disabled = running;
    generateBtn.disabled = running;
    runBtn.disabled = running;
    categoryTabs.querySelectorAll("button").forEach((btn) => {
      btn.disabled = running;
    });
    algoGrid.querySelectorAll("button").forEach((btn) => {
      btn.disabled = running;
    });
    pauseBtn.disabled = !running;
    stopBtn.disabled = !running;
  }

  async function runAlgo() {
    if (state.running) return;
    const meta = currentMeta();
    const runner = runners[meta.id];
    if (!runner) return;
    const frames = meta.needsTarget ? runner(state.array, state.target) : runner(state.array);
    state.sorted = new Set();
    state.rejected = new Set();
    state.found = new Set();
    resetStats();
    renderBars();
    setControlsRunning(true);
    state.paused = false;
    state.stopRequested = false;
    state.startedAt = performance.now();
    pauseBtn.textContent = "Pause";
    setStatus("Running");

    let missed = false;
    for (let i = 0; i < frames.length; i++) {
      const result = await wait(delayFromSpeed(Number(speedSlider.value)));
      if (result === "stop") break;
      if (frames[i].type === "miss") missed = true;
      applyFrame(frames[i]);
      progressBar.style.width = `${((i + 1) / frames.length) * 100}%`;
      document.getElementById("stat-time").textContent = `${((performance.now() - state.startedAt) / 1000).toFixed(2)}s`;
    }

    clearTransient();
    if (!state.stopRequested) {
      if (meta.category === "sorting") {
        state.array.forEach((_, index) => state.sorted.add(index));
        barNodes().forEach((bar) => bar.classList.add("sorted"));
        setStatus("Sorted");
      } else if (meta.needsTarget) {
        setStatus(missed && state.found.size === 0 ? "Not found" : "Found");
      } else {
        setStatus("Done");
      }
      progressBar.style.width = "100%";
    } else {
      setStatus("Stopped");
      progressBar.style.width = "0%";
      renderBars();
    }
    setControlsRunning(false);
    pauseBtn.textContent = "Pause";
  }

  function renderLegend() {
    const items = LEGENDS[state.category] || LEGENDS.sorting;
    legendEl.innerHTML = items
      .map(([swatch, label]) => `<li><span class="swatch ${swatch}"></span> ${label}</li>`)
      .join("");
  }

  function renderCategories() {
    const visible = categories.filter((category) =>
      algorithms.some((algo) => algo.category === category.id && algo.status === "ready")
    );
    categoryTabs.innerHTML = visible
      .map(
        (category) =>
          `<button type="button" data-category="${category.id}" class="${
            category.id === state.category ? "is-active" : ""
          }">${category.name}</button>`
      )
      .join("");
    categoryTabs.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => selectCategory(btn.dataset.category));
    });
  }

  function renderAlgoButtons() {
    const items = algorithms.filter((algo) => algo.category === state.category && algo.status === "ready");
    algoGrid.innerHTML = items
      .map(
        (algo) =>
          `<button class="algo-btn${algo.id === state.algo ? " is-active" : ""}" type="button" data-algo="${
            algo.id
          }" aria-pressed="${algo.id === state.algo}">${algo.short}</button>`
      )
      .join("");
    algoGrid.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => selectAlgo(btn.dataset.algo));
    });
  }

  function renderCatalog() {
    catalogEl.innerHTML = categories
      .map((category) => {
        const items = algorithms.filter((algo) => algo.category === category.id);
        if (!items.length) return "";
        const chips = items
          .map((algo) => `<span class="chip ${algo.status}">${algo.short}</span>`)
          .join("");
        return `<div class="catalog-group"><strong>${category.name}</strong><div class="chip-row">${chips}</div></div>`;
      })
      .join("");
  }

  function updateCard() {
    const meta = currentMeta();
    const category = categories.find((item) => item.id === meta.category);
    document.getElementById("algo-name").textContent = meta.name;
    document.getElementById("algo-blurb").textContent = meta.blurb;
    document.getElementById("algo-best").textContent = meta.best;
    document.getElementById("algo-avg").textContent = meta.avg;
    document.getElementById("algo-worst").textContent = meta.worst;
    document.getElementById("algo-space").textContent = meta.space;
    runBtn.textContent = category.run;
    const taglines = {
      sorting: "Watch comparisons, swaps, and writes as each algorithm orders the array.",
      searching: "Watch probes discard ranges until the target bar is found.",
      array: "Watch pointers and windows walk the array.",
      math: "Watch primes survive as composites are crossed out.",
    };
    document.getElementById("tagline").textContent = taglines[meta.category] || meta.blurb;
  }

  function selectCategory(categoryId) {
    state.category = categoryId;
    const first = algorithms.find((algo) => algo.category === categoryId && algo.status === "ready");
    if (first) state.algo = first.id;
    renderCategories();
    renderAlgoButtons();
    renderLegend();
    updateCard();
    generateArray();
  }

  function selectAlgo(algoId) {
    const meta = algorithms.find((item) => item.id === algoId);
    if (!meta || meta.status !== "ready") return;
    state.algo = algoId;
    state.category = meta.category;
    renderAlgoButtons();
    updateCard();
    generateArray();
  }

  generateBtn.addEventListener("click", generateArray);
  runBtn.addEventListener("click", runAlgo);
  pauseBtn.addEventListener("click", () => {
    if (!state.running) return;
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? "Resume" : "Pause";
    setStatus(state.paused ? "Paused" : "Running");
  });
  stopBtn.addEventListener("click", () => {
    state.stopRequested = true;
    state.paused = false;
  });
  sizeSlider.addEventListener("input", () => {
    sizeValue.textContent = sizeSlider.value;
    generateArray();
  });
  speedSlider.addEventListener("input", () => {
    speedValue.textContent = speedLabel(Number(speedSlider.value));
  });

  sizeValue.textContent = sizeSlider.value;
  speedValue.textContent = speedLabel(Number(speedSlider.value));
  renderCategories();
  renderAlgoButtons();
  renderLegend();
  renderCatalog();
  updateCard();
  generateArray();
})();
