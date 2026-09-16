(function () {
  const catalog = window.VisualizerCatalog;
  const runners = window.VisualizerAlgorithms;
  if (!catalog || !runners) {
    const status = document.getElementById("stat-status");
    if (status) status.textContent = "Scripts failed to load";
    return;
  }
  const { categories, algorithms } = catalog;

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
    graph: [
      ["start", "Start"],
      ["end", "Goal"],
      ["frontier", "Frontier"],
      ["visit", "Visited"],
      ["path", "Path"],
    ],
    tree: [
      ["compare", "Current"],
      ["visit", "Visited"],
      ["sorted", "Found"],
    ],
    dp: [
      ["compare", "Compare"],
      ["write", "Write"],
      ["sorted", "Chosen"],
    ],
    backtracking: [
      ["compare", "Try"],
      ["reject", "Attack"],
      ["sorted", "Place / solved"],
    ],
  };

  const WORDS = ["ALGO", "SORT", "TREE", "GRAPH", "QUEUE", "STACK", "NODE", "PATH"];

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
    grid: null,
    tree: null,
    table: null,
    board: null,
    cellKinds: {},
    nodeKinds: {},
    queens: [],
  };

  const barsEl = document.getElementById("bars");
  const gridEl = document.getElementById("grid-view");
  const treeEl = document.getElementById("tree-view");
  const tableEl = document.getElementById("table-view");
  const boardEl = document.getElementById("board-view");
  const sizeSlider = document.getElementById("size-slider");
  const speedSlider = document.getElementById("speed-slider");
  const sizeValue = document.getElementById("size-value");
  const speedValue = document.getElementById("speed-value");
  const sizeLabel = document.getElementById("size-label");
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

  function currentView() {
    return currentMeta().view || "bars";
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

  function showView(view) {
    barsEl.hidden = view !== "bars";
    gridEl.hidden = view !== "grid";
    treeEl.hidden = view !== "tree";
    tableEl.hidden = view !== "table";
    boardEl.hidden = view !== "board";
  }

  function configureSlider() {
    const view = currentView();
    const settings = {
      bars: { min: 8, max: 80, value: 32, label: "Size" },
      grid: { min: 8, max: 24, value: 16, label: "Grid" },
      tree: { min: 7, max: 23, value: 13, label: "Nodes" },
      table: { min: 8, max: 18, value: 12, label: "Amount" },
      board: { min: 4, max: 8, value: 8, label: "N" },
    }[view];
    sizeLabel.textContent = settings.label;
    sizeSlider.min = settings.min;
    sizeSlider.max = settings.max;
    const current = Number(sizeSlider.value);
    if (current < settings.min || current > settings.max) sizeSlider.value = settings.value;
    sizeValue.textContent = sizeSlider.value;
  }

  function cellKey(r, c) {
    return r + "," + c;
  }

  function generateGrid() {
    const cols = Number(sizeSlider.value);
    const rows = Math.max(6, Math.round(cols * 0.6));
    const walls = new Set();
    const weights = [];
    for (let r = 0; r < rows; r++) {
      weights[r] = [];
      for (let c = 0; c < cols; c++) {
        weights[r][c] = randomInt(1, 4);
        if (Math.random() < 0.28) walls.add(cellKey(r, c));
      }
    }
    walls.delete(cellKey(0, 0));
    walls.delete(cellKey(rows - 1, cols - 1));
    let r = 0;
    let c = 0;
    while (c < cols - 1) {
      walls.delete(cellKey(r, c));
      c += 1;
    }
    while (r < rows - 1) {
      walls.delete(cellKey(r, c));
      r += 1;
    }
    if (currentMeta().id === "maze") {
      walls.clear();
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) walls.add(cellKey(rr, cc));
      }
    }
    state.grid = {
      rows,
      cols,
      walls,
      weights,
      start: [0, 0],
      end: [rows - 1, cols - 1],
    };
    state.cellKinds = {};
  }

  function insertBST(node, val, idRef) {
    if (!node) return { id: idRef.n++, val, left: null, right: null };
    if (val < node.val) node.left = insertBST(node.left, val, idRef);
    else node.right = insertBST(node.right, val, idRef);
    return node;
  }

  function layoutTree(root) {
    const nodes = [];
    let x = 0;
    function walk(node, depth) {
      if (!node) return;
      walk(node.left, depth + 1);
      node.x = x++;
      node.y = depth;
      nodes.push(node);
      walk(node.right, depth + 1);
    }
    walk(root, 0);
    return nodes;
  }

  function generateTree() {
    const count = Number(sizeSlider.value);
    const values = Array.from({ length: count }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    const idRef = { n: 0 };
    let root = null;
    values.forEach((val) => {
      root = insertBST(root, val, idRef);
    });
    state.tree = { root, nodes: layoutTree(root), values };
    state.nodeKinds = {};
    state.target = values[randomInt(0, values.length - 1)];
  }

  function generateTable() {
    if (state.algo === "coin") {
      state.table = { amount: Number(sizeSlider.value), coins: [1, 4, 6, 9], a: "", b: "" };
    } else {
      const a = WORDS[randomInt(0, WORDS.length - 1)];
      const b = WORDS[randomInt(0, WORDS.length - 1)];
      state.table = { a, b, amount: 0, coins: [] };
    }
  }

  function generateBoard() {
    state.board = { n: Number(sizeSlider.value) };
    state.queens = [];
    state.cellKinds = {};
  }

  function generateArray() {
    const size = Number(sizeSlider.value);
    const meta = currentMeta();
    const mode = meta.generate;
    if (mode === "sorted") {
      const start = randomInt(8, 18);
      state.array = Array.from({ length: size }, (_, i) => start + i * randomInt(1, 3));
    } else if (mode === "dutch") {
      state.array = Array.from({ length: size }, () => [20, 50, 90][randomInt(0, 2)]);
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
    if (meta.needsTarget && currentView() === "bars") {
      if (meta.pairTarget) {
        const i = randomInt(0, size - 2);
        const j = randomInt(i + 1, size - 1);
        state.target = state.array[i] + state.array[j];
      } else {
        state.target = state.array[randomInt(0, size - 1)];
      }
    } else if (currentView() !== "tree") {
      state.target = null;
    }
  }

  function generateWorld() {
    const view = currentView();
    configureSlider();
    if (view === "grid") generateGrid();
    else if (view === "tree") generateTree();
    else if (view === "table") generateTable();
    else if (view === "board") generateBoard();
    else generateArray();
    resetStats();
    showView(view);
    renderWorld();
    renderTarget();
    generateBtn.textContent = view === "bars" ? "Shuffle" : "New";
    setStatus("Ready");
    progressBar.style.width = "0%";
  }

  function barHeight(value) {
    const span = state.scaleMax - state.scaleMin || 1;
    return `${Math.max(8, ((value - state.scaleMin) / span) * 100)}%`;
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

  function renderGrid() {
    const grid = state.grid;
    gridEl.style.gridTemplateColumns = `repeat(${grid.cols}, minmax(0, 1fr))`;
    gridEl.innerHTML = "";
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const key = cellKey(r, c);
        const cell = document.createElement("div");
        const kinds = [];
        if (grid.walls.has(key)) kinds.push("wall");
        if (r === grid.start[0] && c === grid.start[1]) kinds.push("start");
        if (r === grid.end[0] && c === grid.end[1]) kinds.push("end");
        if (state.cellKinds[key]) kinds.push(state.cellKinds[key]);
        cell.className = "cell " + kinds.join(" ");
        cell.dataset.key = key;
        if (currentMeta().id === "dijkstra" || currentMeta().id === "astar") {
          cell.textContent = grid.weights[r][c];
        }
        gridEl.appendChild(cell);
      }
    }
  }

  function renderTree() {
    const { nodes } = state.tree;
    const maxX = Math.max(...nodes.map((node) => node.x), 1);
    const maxY = Math.max(...nodes.map((node) => node.y), 1);
    const width = treeEl.clientWidth || 640;
    const height = treeEl.clientHeight || 360;
    const xOf = (node) => 28 + (node.x / maxX) * (width - 56);
    const yOf = (node) => 28 + (node.y / maxY) * (height - 56);
    const lines = nodes
      .map((node) => {
        const parts = [];
        [["left", node.left], ["right", node.right]].forEach(([, child]) => {
          if (!child) return;
          parts.push(
            `<line x1="${xOf(node)}" y1="${yOf(node)}" x2="${xOf(child)}" y2="${yOf(child)}" />`
          );
        });
        return parts.join("");
      })
      .join("");
    const dots = nodes
      .map((node) => {
        const kind = state.nodeKinds[node.id] || "";
        return `<g class="tree-node ${kind}" transform="translate(${xOf(node)}, ${yOf(node)})">
          <circle r="16"></circle>
          <text dy="4">${node.val}</text>
        </g>`;
      })
      .join("");
    treeEl.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">${lines}${dots}</svg>`;
  }

  function renderTable() {
    const table = state.table;
    if (state.algo === "coin") {
      const cells = [];
      for (let i = 0; i <= table.amount; i++) {
        const kind = state.cellKinds[i] || "";
                cells.push(`<div class="dp-cell ${kind}" data-index="${i}"><span>${i}</span><strong>${state.cellKinds["v" + i] ?? (i === 0 ? 0 : "∞")}</strong></div>`);
      }
      tableEl.innerHTML = `<p class="table-caption">Coins: ${table.coins.join(", ")} → amount ${table.amount}</p><div class="dp-row">${cells.join("")}</div>`;
      return;
    }
    const a = table.a;
    const b = table.b;
    let html = `<p class="table-caption">${a} vs ${b}</p><table class="dp-table"><thead><tr><th></th><th></th>`;
    for (let j = 0; j < b.length; j++) html += `<th>${b[j]}</th>`;
    html += "</tr></thead><tbody>";
    for (let i = 0; i <= a.length; i++) {
      html += "<tr>";
      html += i === 0 ? "<th></th>" : `<th>${a[i - 1]}</th>`;
      for (let j = 0; j <= b.length; j++) {
        const kind = state.cellKinds[i + "," + j] || "";
        const value = state.cellKinds["v" + i + "," + j];
        html += `<td class="${kind}">${value === undefined ? (i === 0 || j === 0 ? "0" : "") : value}</td>`;
      }
      html += "</tr>";
    }
    tableEl.innerHTML = html + "</tbody></table>";
  }

  function renderBoard() {
    const n = state.board.n;
    boardEl.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    boardEl.innerHTML = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const square = document.createElement("div");
        const key = cellKey(r, c);
        const dark = (r + c) % 2;
        const kinds = [dark ? "dark" : "light"];
        if (state.cellKinds[key]) kinds.push(state.cellKinds[key]);
        if (state.queens.some(([qr, qc]) => qr === r && qc === c)) kinds.push("queen");
        square.className = "square " + kinds.join(" ");
        square.textContent = kinds.includes("queen") ? "♛" : "";
        boardEl.appendChild(square);
      }
    }
  }

  function renderWorld() {
    const view = currentView();
    if (view === "bars") renderBars();
    else if (view === "grid") renderGrid();
    else if (view === "tree") renderTree();
    else if (view === "table") renderTable();
    else renderBoard();
  }

  function renderTarget() {
    const meta = currentMeta();
    if (meta.needsTarget) {
      targetRow.hidden = false;
      targetValue.textContent = String(state.target);
    } else if (currentView() === "table" && state.table && state.algo === "lcs") {
      targetRow.hidden = false;
      targetValue.textContent = `${state.table.a} / ${state.table.b}`;
    } else {
      targetRow.hidden = true;
    }
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

  function bump(kind) {
    if (kind === "compare") {
      state.comparisons += 1;
      document.getElementById("stat-comparisons").textContent = String(state.comparisons);
    } else {
      state.writes += 1;
      document.getElementById("stat-writes").textContent = String(state.writes);
    }
  }

  function applyFrame(frame) {
    const view = currentView();
    if (view === "bars") applyBarFrame(frame);
    else if (view === "grid") applyGridFrame(frame);
    else if (view === "tree") applyTreeFrame(frame);
    else if (view === "table") applyTableFrame(frame);
    else applyBoardFrame(frame);
  }

  function applyBarFrame(frame) {
    clearTransient();
    if (frame.type === "compare") {
      bump("compare");
      mark(frame.indices, "compare");
    } else if (frame.type === "swap") {
      const [i, j] = frame.indices;
      state.array[i] = frame.values[0];
      state.array[j] = frame.values[1];
      bump("write");
      bump("write");
      setHeight(i, frame.values[0]);
      setHeight(j, frame.values[1]);
      mark(frame.indices, "write");
    } else if (frame.type === "overwrite") {
      state.array[frame.index] = frame.value;
      bump("write");
      setHeight(frame.index, frame.value);
      mark([frame.index], "write");
    } else if (frame.type === "pivot" || frame.type === "range") {
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

  function applyGridFrame(frame) {
    if (frame.type === "cell") {
      if (frame.kind === "visit" || frame.kind === "frontier") bump("compare");
      state.cellKinds[frame.key] = frame.kind;
      const node = gridEl.querySelector(`[data-key="${frame.key}"]`);
      if (node && frame.kind !== "start" && frame.kind !== "end") node.classList.add(frame.kind);
    } else if (frame.type === "path") {
      frame.keys.forEach((key) => {
        state.cellKinds[key] = "path";
        const node = gridEl.querySelector(`[data-key="${key}"]`);
        if (node) node.classList.add("path");
      });
    } else if (frame.type === "maze") {
      state.grid.walls = new Set(frame.walls);
      state.cellKinds = {};
      renderGrid();
    }
  }

  function applyTreeFrame(frame) {
    if (frame.kind === "active") bump("compare");
    if (frame.kind === "visit") bump("write");
    Object.keys(state.nodeKinds).forEach((id) => {
      if (state.nodeKinds[id] === "active") delete state.nodeKinds[id];
    });
    state.nodeKinds[frame.id] = frame.kind === "found" ? "found" : frame.kind;
    if (frame.kind === "visit") state.nodeKinds[frame.id] = "visit";
    renderTree();
  }

  function applyTableFrame(frame) {
    if (frame.type === "dp") {
      bump(frame.kind === "compare" ? "compare" : "write");
      state.cellKinds[frame.i + "," + frame.j] = frame.kind;
      if (frame.value !== undefined) state.cellKinds["v" + frame.i + "," + frame.j] = frame.value;
      renderTable();
    } else if (frame.type === "dppath") {
      frame.cells.forEach(([i, j]) => {
        state.cellKinds[i + "," + j] = "found";
      });
      renderTable();
    } else if (frame.type === "dp1") {
      bump(frame.kind === "compare" ? "compare" : "write");
      state.cellKinds[frame.index] = frame.kind;
      if (frame.value !== undefined) state.cellKinds["v" + frame.index] = frame.value;
      renderTable();
    }
  }

  function applyBoardFrame(frame) {
    if (frame.type === "square") {
      bump("compare");
      const key = cellKey(frame.r, frame.c);
      if (frame.kind === "place") {
        state.queens.push([frame.r, frame.c]);
        state.cellKinds[key] = "place";
      } else if (frame.kind === "remove") {
        state.queens = state.queens.filter(([r, c]) => !(r === frame.r && c === frame.c));
        state.cellKinds[key] = "remove";
      } else {
        state.cellKinds[key] = frame.kind;
      }
      renderBoard();
    } else if (frame.type === "queens") {
      state.queens = frame.cells;
      state.cellKinds = {};
      frame.cells.forEach(([r, c]) => {
        state.cellKinds[cellKey(r, c)] = "solved";
      });
      renderBoard();
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
    if (catalogEl) {
      catalogEl.querySelectorAll("button").forEach((btn) => {
        btn.disabled = running;
      });
    }
    pauseBtn.disabled = !running;
    stopBtn.disabled = !running;
  }

  function runnerInput(meta) {
    const view = meta.view || "bars";
    if (view === "grid") return state.grid;
    if (view === "tree") return meta.needsTarget ? [state.tree, state.target] : state.tree;
    if (view === "table") return state.table;
    if (view === "board") return state.board;
    return meta.needsTarget ? [state.array, state.target] : state.array;
  }

  async function runAlgo() {
    if (state.running) return;
    const meta = currentMeta();
    const runner = runners[meta.id];
    if (!runner) return;
    const input = runnerInput(meta);
    const frames = Array.isArray(input) ? runner(input[0], input[1]) : runner(input);
    state.sorted = new Set();
    state.rejected = new Set();
    state.found = new Set();
    state.cellKinds = {};
    state.nodeKinds = {};
    state.queens = [];
    resetStats();
    renderWorld();
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

    if (!state.stopRequested) {
      if (meta.category === "sorting") {
        state.array.forEach((_, index) => state.sorted.add(index));
        barNodes().forEach((bar) => bar.classList.add("sorted"));
        setStatus("Sorted");
      } else if (meta.needsTarget) {
        setStatus(missed ? "Not found" : "Found");
      } else {
        setStatus("Done");
      }
      progressBar.style.width = "100%";
    } else {
      setStatus("Stopped");
      progressBar.style.width = "0%";
      renderWorld();
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
          `<button type="button" class="chip-btn${category.id === state.category ? " is-active" : ""}" data-category="${category.id}">${category.name}</button>`
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
          `<button class="chip-btn${algo.id === state.algo ? " is-active" : ""}" type="button" data-algo="${algo.id}">${algo.short}</button>`
      )
      .join("");
    algoGrid.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => selectAlgo(btn.dataset.algo));
    });
  }

  function renderCatalog() {
    if (!catalogEl) return;
    catalogEl.innerHTML = categories
      .map((category) => {
        const items = algorithms.filter((algo) => algo.category === category.id && algo.status === "ready");
        if (!items.length) return "";
        const chips = items
          .map((algo) => {
            const active = algo.id === state.algo ? " is-active" : "";
            return `<button type="button" class="chip ready${active}" data-algo="${algo.id}">${algo.short}</button>`;
          })
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
    document.getElementById("tagline").textContent = meta.blurb;
  }

  function selectCategory(categoryId) {
    state.category = categoryId;
    const first = algorithms.find((algo) => algo.category === categoryId && algo.status === "ready");
    if (first) state.algo = first.id;
    renderCategories();
    renderAlgoButtons();
    renderLegend();
    renderCatalog();
    updateCard();
    generateWorld();
  }

  function selectAlgo(algoId) {
    const meta = algorithms.find((item) => item.id === algoId);
    if (!meta || meta.status !== "ready") return;
    state.algo = algoId;
    state.category = meta.category;
    renderCategories();
    renderAlgoButtons();
    renderLegend();
    renderCatalog();
    updateCard();
    generateWorld();
  }

  if (catalogEl) {
    catalogEl.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-algo]");
      if (button) selectAlgo(button.dataset.algo);
    });
  }
  generateBtn.addEventListener("click", generateWorld);
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
    generateWorld();
  });
  speedSlider.addEventListener("input", () => {
    speedValue.textContent = speedLabel(Number(speedSlider.value));
  });
  window.addEventListener("resize", () => {
    if (currentView() === "tree" && state.tree) renderTree();
  });

  speedValue.textContent = speedLabel(Number(speedSlider.value));
  renderCategories();
  renderAlgoButtons();
  renderLegend();
  renderCatalog();
  updateCard();
  generateWorld();
})();
