(function () {
  const ALGORITHMS = {
    bubble: {
      name: "Bubble Sort",
      blurb: "Repeatedly compares neighbors and swaps them until the largest values bubble to the end.",
      best: "O(n)",
      avg: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    insertion: {
      name: "Insertion Sort",
      blurb: "Builds a sorted prefix by inserting each next value into its correct position.",
      best: "O(n)",
      avg: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    selection: {
      name: "Selection Sort",
      blurb: "Finds the minimum remaining value and places it at the front of the unsorted region.",
      best: "O(n²)",
      avg: "O(n²)",
      worst: "O(n²)",
      space: "O(1)",
    },
    merge: {
      name: "Merge Sort",
      blurb: "Divides the array, sorts each half, then merges the sorted halves together.",
      best: "O(n log n)",
      avg: "O(n log n)",
      worst: "O(n log n)",
      space: "O(n)",
    },
    quick: {
      name: "Quick Sort",
      blurb: "Partitions around a pivot so smaller values sit left and larger values sit right.",
      best: "O(n log n)",
      avg: "O(n log n)",
      worst: "O(n²)",
      space: "O(log n)",
    },
    heap: {
      name: "Heap Sort",
      blurb: "Turns the array into a max-heap, then repeatedly extracts the largest value.",
      best: "O(n log n)",
      avg: "O(n log n)",
      worst: "O(n log n)",
      space: "O(1)",
    },
  };

  const SPEED_LABELS = [
    [20, "Slow"],
    [45, "Steady"],
    [70, "Fast"],
    [101, "Max"],
  ];

  const state = {
    array: [],
    algo: "bubble",
    running: false,
    paused: false,
    stopRequested: false,
    sorted: new Set(),
    comparisons: 0,
    writes: 0,
    startedAt: 0,
    timerId: null,
  };

  const barsEl = document.getElementById("bars");
  const sizeSlider = document.getElementById("size-slider");
  const speedSlider = document.getElementById("speed-slider");
  const sizeValue = document.getElementById("size-value");
  const speedValue = document.getElementById("speed-value");
  const generateBtn = document.getElementById("generate-btn");
  const sortBtn = document.getElementById("sort-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const stopBtn = document.getElementById("stop-btn");
  const progressBar = document.getElementById("progress-bar");

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function speedLabel(value) {
    return SPEED_LABELS.find(([limit]) => value < limit)[1];
  }

  function delayFromSpeed(value) {
    return Math.round(220 - value * 2.05);
  }

  function generateArray(size) {
    state.array = Array.from({ length: size }, () => randomInt(12, 100));
    state.sorted = new Set();
    resetStats();
    renderBars();
    setStatus("Ready");
    progressBar.style.width = "0%";
  }

  function resetStats() {
    state.comparisons = 0;
    state.writes = 0;
    document.getElementById("stat-comparisons").textContent = "0";
    document.getElementById("stat-writes").textContent = "0";
    document.getElementById("stat-time").textContent = "0.00s";
  }

  function setStatus(text) {
    document.getElementById("stat-status").textContent = text;
  }

  const HEIGHT_MAX = 100;

  function barHeight(value) {
    return `${Math.max(8, (value / HEIGHT_MAX) * 100)}%`;
  }

  function renderBars() {
    barsEl.innerHTML = "";
    state.array.forEach((value, index) => {
      const bar = document.createElement("div");
      bar.className = "bar" + (state.sorted.has(index) ? " sorted" : "");
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
      bar.classList.remove("compare", "write", "pivot");
      if (state.sorted.has(Number(bar.dataset.index))) bar.classList.add("sorted");
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
    } else if (frame.type === "sorted") {
      frame.indices.forEach((index) => state.sorted.add(index));
      mark(frame.indices, "sorted");
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
    sortBtn.disabled = running;
    document.querySelectorAll(".algo-btn").forEach((btn) => {
      btn.disabled = running;
    });
    pauseBtn.disabled = !running;
    stopBtn.disabled = !running;
  }

  async function runSort() {
    if (state.running) return;
    const sorter = window.SortingAlgorithms[state.algo];
    const frames = sorter(state.array);
    state.sorted = new Set();
    resetStats();
    setControlsRunning(true);
    state.paused = false;
    state.stopRequested = false;
    state.startedAt = performance.now();
    pauseBtn.textContent = "Pause";
    setStatus("Sorting");

    for (let i = 0; i < frames.length; i++) {
      const result = await wait(delayFromSpeed(Number(speedSlider.value)));
      if (result === "stop") break;
      applyFrame(frames[i]);
      progressBar.style.width = `${((i + 1) / frames.length) * 100}%`;
      document.getElementById("stat-time").textContent = `${((performance.now() - state.startedAt) / 1000).toFixed(2)}s`;
    }

    clearTransient();
    if (!state.stopRequested) {
      state.array.forEach((_, index) => state.sorted.add(index));
      barNodes().forEach((bar) => bar.classList.add("sorted"));
      progressBar.style.width = "100%";
      setStatus("Sorted");
    } else {
      setStatus("Stopped");
      progressBar.style.width = "0%";
      renderBars();
    }
    setControlsRunning(false);
    pauseBtn.textContent = "Pause";
  }

  function selectAlgo(algo) {
    state.algo = algo;
    const meta = ALGORITHMS[algo];
    document.getElementById("algo-name").textContent = meta.name;
    document.getElementById("algo-blurb").textContent = meta.blurb;
    document.getElementById("algo-best").textContent = meta.best;
    document.getElementById("algo-avg").textContent = meta.avg;
    document.getElementById("algo-worst").textContent = meta.worst;
    document.getElementById("algo-space").textContent = meta.space;
    document.querySelectorAll(".algo-btn").forEach((btn) => {
      const active = btn.dataset.algo === algo;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  document.querySelectorAll(".algo-btn").forEach((btn) => {
    btn.addEventListener("click", () => selectAlgo(btn.dataset.algo));
  });

  sizeSlider.addEventListener("input", () => {
    sizeValue.textContent = sizeSlider.value;
    generateArray(Number(sizeSlider.value));
  });

  speedSlider.addEventListener("input", () => {
    speedValue.textContent = speedLabel(Number(speedSlider.value));
  });

  generateBtn.addEventListener("click", () => generateArray(Number(sizeSlider.value)));
  sortBtn.addEventListener("click", runSort);
  pauseBtn.addEventListener("click", () => {
    if (!state.running) return;
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? "Resume" : "Pause";
    setStatus(state.paused ? "Paused" : "Sorting");
  });
  stopBtn.addEventListener("click", () => {
    state.stopRequested = true;
    state.paused = false;
  });

  sizeValue.textContent = sizeSlider.value;
  speedValue.textContent = speedLabel(Number(speedSlider.value));
  generateArray(Number(sizeSlider.value));
})();
