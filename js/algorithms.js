(function (global) {
  function swap(arr, i, j) {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  function range(from, to) {
    const indices = [];
    for (let i = from; i <= to; i++) indices.push(i);
    return indices;
  }

  function bubbleSort(values) {
    const arr = values.slice();
    const frames = [];
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        frames.push({ type: "compare", indices: [j, j + 1] });
        if (arr[j] > arr[j + 1]) {
          swap(arr, j, j + 1);
          frames.push({ type: "swap", indices: [j, j + 1], values: [arr[j], arr[j + 1]] });
          swapped = true;
        }
      }
      frames.push({ type: "sorted", indices: [n - i - 1] });
      if (!swapped) break;
    }
    for (let i = 0; i < n; i++) frames.push({ type: "sorted", indices: [i] });
    return frames;
  }

  function insertionSort(values) {
    const arr = values.slice();
    const frames = [];
    frames.push({ type: "sorted", indices: [0] });
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
      frames.push({ type: "compare", indices: [i, j] });
      while (j >= 0 && arr[j] > key) {
        frames.push({ type: "compare", indices: [j, j + 1] });
        arr[j + 1] = arr[j];
        frames.push({ type: "overwrite", index: j + 1, value: arr[j + 1] });
        j -= 1;
      }
      arr[j + 1] = key;
      frames.push({ type: "overwrite", index: j + 1, value: key });
      for (let k = 0; k <= i; k++) frames.push({ type: "sorted", indices: [k] });
    }
    return frames;
  }

  function selectionSort(values) {
    const arr = values.slice();
    const frames = [];
    for (let i = 0; i < arr.length; i++) {
      let min = i;
      for (let j = i + 1; j < arr.length; j++) {
        frames.push({ type: "compare", indices: [min, j] });
        if (arr[j] < arr[min]) min = j;
      }
      if (min !== i) {
        swap(arr, i, min);
        frames.push({ type: "swap", indices: [i, min], values: [arr[i], arr[min]] });
      }
      frames.push({ type: "sorted", indices: [i] });
    }
    return frames;
  }

  function mergeSort(values) {
    const arr = values.slice();
    const frames = [];

    function merge(left, mid, right) {
      const leftPart = arr.slice(left, mid + 1);
      const rightPart = arr.slice(mid + 1, right + 1);
      let i = 0;
      let j = 0;
      let k = left;
      while (i < leftPart.length && j < rightPart.length) {
        frames.push({ type: "compare", indices: [left + i, mid + 1 + j] });
        if (leftPart[i] <= rightPart[j]) {
          arr[k] = leftPart[i];
          frames.push({ type: "overwrite", index: k, value: leftPart[i] });
          i += 1;
        } else {
          arr[k] = rightPart[j];
          frames.push({ type: "overwrite", index: k, value: rightPart[j] });
          j += 1;
        }
        k += 1;
      }
      while (i < leftPart.length) {
        arr[k] = leftPart[i];
        frames.push({ type: "overwrite", index: k, value: leftPart[i] });
        i += 1;
        k += 1;
      }
      while (j < rightPart.length) {
        arr[k] = rightPart[j];
        frames.push({ type: "overwrite", index: k, value: rightPart[j] });
        j += 1;
        k += 1;
      }
    }

    function sort(left, right) {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);
      sort(left, mid);
      sort(mid + 1, right);
      merge(left, mid, right);
    }

    sort(0, arr.length - 1);
    for (let i = 0; i < arr.length; i++) frames.push({ type: "sorted", indices: [i] });
    return frames;
  }

  function quickSort(values) {
    const arr = values.slice();
    const frames = [];

    function partition(low, high) {
      frames.push({ type: "pivot", indices: [high] });
      let i = low;
      for (let j = low; j < high; j++) {
        frames.push({ type: "compare", indices: [j, high] });
        if (arr[j] < arr[high]) {
          swap(arr, i, j);
          frames.push({ type: "swap", indices: [i, j], values: [arr[i], arr[j]] });
          i += 1;
        }
      }
      swap(arr, i, high);
      frames.push({ type: "swap", indices: [i, high], values: [arr[i], arr[high]] });
      frames.push({ type: "sorted", indices: [i] });
      return i;
    }

    function sort(low, high) {
      if (low > high) return;
      if (low === high) {
        frames.push({ type: "sorted", indices: [low] });
        return;
      }
      const p = partition(low, high);
      sort(low, p - 1);
      sort(p + 1, high);
    }

    sort(0, arr.length - 1);
    return frames;
  }

  function heapSort(values) {
    const arr = values.slice();
    const frames = [];
    const n = arr.length;

    function heapify(size, i) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < size) {
        frames.push({ type: "compare", indices: [largest, left] });
        if (arr[left] > arr[largest]) largest = left;
      }
      if (right < size) {
        frames.push({ type: "compare", indices: [largest, right] });
        if (arr[right] > arr[largest]) largest = right;
      }
      if (largest !== i) {
        swap(arr, i, largest);
        frames.push({ type: "swap", indices: [i, largest], values: [arr[i], arr[largest]] });
        heapify(size, largest);
      }
    }

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
    for (let i = n - 1; i > 0; i--) {
      swap(arr, 0, i);
      frames.push({ type: "swap", indices: [0, i], values: [arr[0], arr[i]] });
      frames.push({ type: "sorted", indices: [i] });
      heapify(i, 0);
    }
    if (n) frames.push({ type: "sorted", indices: [0] });
    return frames;
  }

  function shellSort(values) {
    const arr = values.slice();
    const frames = [];
    const n = arr.length;
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < n; i++) {
        const temp = arr[i];
        let j = i;
        frames.push({ type: "compare", indices: [j, j - gap] });
        while (j >= gap && arr[j - gap] > temp) {
          frames.push({ type: "compare", indices: [j, j - gap] });
          arr[j] = arr[j - gap];
          frames.push({ type: "overwrite", index: j, value: arr[j] });
          j -= gap;
        }
        arr[j] = temp;
        frames.push({ type: "overwrite", index: j, value: temp });
      }
    }
    for (let i = 0; i < n; i++) frames.push({ type: "sorted", indices: [i] });
    return frames;
  }

  function cocktailSort(values) {
    const arr = values.slice();
    const frames = [];
    let start = 0;
    let end = arr.length - 1;
    let swapped = true;
    while (swapped) {
      swapped = false;
      for (let i = start; i < end; i++) {
        frames.push({ type: "compare", indices: [i, i + 1] });
        if (arr[i] > arr[i + 1]) {
          swap(arr, i, i + 1);
          frames.push({ type: "swap", indices: [i, i + 1], values: [arr[i], arr[i + 1]] });
          swapped = true;
        }
      }
      frames.push({ type: "sorted", indices: [end] });
      end -= 1;
      if (!swapped) break;
      swapped = false;
      for (let i = end; i > start; i--) {
        frames.push({ type: "compare", indices: [i - 1, i] });
        if (arr[i - 1] > arr[i]) {
          swap(arr, i - 1, i);
          frames.push({ type: "swap", indices: [i - 1, i], values: [arr[i - 1], arr[i]] });
          swapped = true;
        }
      }
      frames.push({ type: "sorted", indices: [start] });
      start += 1;
    }
    for (let i = 0; i < arr.length; i++) frames.push({ type: "sorted", indices: [i] });
    return frames;
  }

  function linearSearch(values, target) {
    const frames = [];
    for (let i = 0; i < values.length; i++) {
      frames.push({ type: "compare", indices: [i] });
      if (values[i] === target) {
        frames.push({ type: "found", indices: [i] });
        return frames;
      }
      frames.push({ type: "eliminate", indices: [i] });
    }
    frames.push({ type: "miss" });
    return frames;
  }

  function binarySearch(values, target) {
    const frames = [];
    let lo = 0;
    let hi = values.length - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      frames.push({ type: "range", indices: [lo, hi] });
      frames.push({ type: "compare", indices: [mid] });
      if (values[mid] === target) {
        frames.push({ type: "found", indices: [mid] });
        return frames;
      }
      if (values[mid] < target) {
        frames.push({ type: "eliminate", indices: range(lo, mid) });
        lo = mid + 1;
      } else {
        frames.push({ type: "eliminate", indices: range(mid, hi) });
        hi = mid - 1;
      }
    }
    frames.push({ type: "miss" });
    return frames;
  }

  function jumpSearch(values, target) {
    const frames = [];
    const n = values.length;
    const stepSize = Math.max(1, Math.floor(Math.sqrt(n)));
    let prev = 0;
    let step = stepSize;
    while (step < n && values[Math.min(step, n) - 1] < target) {
      frames.push({ type: "compare", indices: [Math.min(step, n) - 1] });
      frames.push({ type: "eliminate", indices: range(prev, Math.min(step, n) - 1) });
      prev = step;
      step += stepSize;
    }
    const end = Math.min(step, n) - 1;
    for (let i = prev; i <= end; i++) {
      frames.push({ type: "compare", indices: [i] });
      if (values[i] === target) {
        frames.push({ type: "found", indices: [i] });
        return frames;
      }
      frames.push({ type: "eliminate", indices: [i] });
    }
    frames.push({ type: "miss" });
    return frames;
  }

  function interpolationSearch(values, target) {
    const frames = [];
    let lo = 0;
    let hi = values.length - 1;
    while (lo <= hi && target >= values[lo] && target <= values[hi]) {
      frames.push({ type: "range", indices: [lo, hi] });
      if (lo === hi) {
        frames.push({ type: "compare", indices: [lo] });
        if (values[lo] === target) frames.push({ type: "found", indices: [lo] });
        else frames.push({ type: "miss" });
        return frames;
      }
      const pos = lo + Math.floor(((target - values[lo]) * (hi - lo)) / (values[hi] - values[lo] || 1));
      const clamped = Math.max(lo, Math.min(hi, pos));
      frames.push({ type: "compare", indices: [clamped] });
      if (values[clamped] === target) {
        frames.push({ type: "found", indices: [clamped] });
        return frames;
      }
      if (values[clamped] < target) {
        frames.push({ type: "eliminate", indices: range(lo, clamped) });
        lo = clamped + 1;
      } else {
        frames.push({ type: "eliminate", indices: range(clamped, hi) });
        hi = clamped - 1;
      }
    }
    frames.push({ type: "miss" });
    return frames;
  }

  function ternarySearch(values, target) {
    const frames = [];
    let lo = 0;
    let hi = values.length - 1;
    while (lo <= hi) {
      const third = Math.floor((hi - lo) / 3);
      const mid1 = lo + third;
      const mid2 = hi - third;
      frames.push({ type: "range", indices: [lo, hi] });
      frames.push({ type: "compare", indices: [mid1, mid2] });
      if (values[mid1] === target) {
        frames.push({ type: "found", indices: [mid1] });
        return frames;
      }
      if (values[mid2] === target) {
        frames.push({ type: "found", indices: [mid2] });
        return frames;
      }
      if (target < values[mid1]) {
        frames.push({ type: "eliminate", indices: range(mid1, hi) });
        hi = mid1 - 1;
      } else if (target > values[mid2]) {
        frames.push({ type: "eliminate", indices: range(lo, mid2) });
        lo = mid2 + 1;
      } else {
        frames.push({ type: "eliminate", indices: range(lo, mid1).concat(range(mid2, hi)) });
        lo = mid1 + 1;
        hi = mid2 - 1;
      }
    }
    frames.push({ type: "miss" });
    return frames;
  }

  function kadane(values) {
    const frames = [];
    let bestSum = -Infinity;
    let bestStart = 0;
    let bestEnd = 0;
    let sum = 0;
    let start = 0;
    for (let i = 0; i < values.length; i++) {
      frames.push({ type: "compare", indices: [i] });
      if (sum <= 0) {
        sum = values[i];
        start = i;
      } else {
        sum += values[i];
      }
      frames.push({ type: "window", indices: range(start, i) });
      if (sum > bestSum) {
        bestSum = sum;
        bestStart = start;
        bestEnd = i;
        frames.push({ type: "found", indices: range(bestStart, bestEnd) });
      }
    }
    frames.push({ type: "found", indices: range(bestStart, bestEnd) });
    return frames;
  }

  function dutchFlag(values) {
    const arr = values.slice();
    const frames = [];
    const midVal = 50;
    let low = 0;
    let mid = 0;
    let high = arr.length - 1;
    while (mid <= high) {
      frames.push({ type: "compare", indices: [mid, low, high] });
      if (arr[mid] < midVal) {
        swap(arr, low, mid);
        frames.push({ type: "swap", indices: [low, mid], values: [arr[low], arr[mid]] });
        frames.push({ type: "sorted", indices: [low] });
        low += 1;
        mid += 1;
      } else if (arr[mid] > midVal) {
        swap(arr, mid, high);
        frames.push({ type: "swap", indices: [mid, high], values: [arr[mid], arr[high]] });
        high -= 1;
      } else {
        mid += 1;
      }
    }
    for (let i = 0; i < arr.length; i++) frames.push({ type: "sorted", indices: [i] });
    return frames;
  }

  function twoPointers(values, target) {
    const frames = [];
    let lo = 0;
    let hi = values.length - 1;
    while (lo < hi) {
      frames.push({ type: "compare", indices: [lo, hi] });
      const sum = values[lo] + values[hi];
      if (sum === target) {
        frames.push({ type: "found", indices: [lo, hi] });
        return frames;
      }
      if (sum < target) {
        frames.push({ type: "eliminate", indices: [lo] });
        lo += 1;
      } else {
        frames.push({ type: "eliminate", indices: [hi] });
        hi -= 1;
      }
    }
    frames.push({ type: "miss" });
    return frames;
  }

  function sieve(values) {
    const n = values.length;
    const frames = [];
    const prime = Array(n + 1).fill(true);
    if (n) {
      frames.push({ type: "eliminate", indices: [0] });
      prime[1] = false;
    }
    for (let p = 2; p * p <= n; p++) {
      frames.push({ type: "pivot", indices: [p - 1] });
      if (!prime[p]) continue;
      for (let m = p * p; m <= n; m += p) {
        frames.push({ type: "compare", indices: [p - 1, m - 1] });
        if (prime[m]) {
          prime[m] = false;
          frames.push({ type: "eliminate", indices: [m - 1] });
        }
      }
      frames.push({ type: "found", indices: [p - 1] });
    }
    const primes = [];
    for (let i = 2; i <= n; i++) {
      if (prime[i]) primes.push(i - 1);
    }
    if (primes.length) frames.push({ type: "found", indices: primes });
    return frames;
  }

  const runners = {
    bubble: bubbleSort,
    insertion: insertionSort,
    selection: selectionSort,
    merge: mergeSort,
    quick: quickSort,
    heap: heapSort,
    shell: shellSort,
    cocktail: cocktailSort,
    linear: linearSearch,
    binary: binarySearch,
    jump: jumpSearch,
    interpolation: interpolationSearch,
    ternary: ternarySearch,
    kadane: kadane,
    dutch: dutchFlag,
    pairsum: twoPointers,
    sieve: sieve,
  };

  const categories = [
    { id: "sorting", name: "Sorting", run: "Sort" },
    { id: "searching", name: "Searching", run: "Search" },
    { id: "array", name: "Array", run: "Run" },
    { id: "math", name: "Math", run: "Run" },
    { id: "graph", name: "Graph", run: "Run" },
    { id: "tree", name: "Tree", run: "Run" },
    { id: "dp", name: "DP", run: "Run" },
    { id: "backtracking", name: "Backtracking", run: "Run" },
  ];

  const algorithms = [
    { id: "bubble", category: "sorting", name: "Bubble Sort", short: "Bubble", status: "ready", generate: "random", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", blurb: "Repeatedly compares neighbors and swaps them until the largest values bubble to the end." },
    { id: "insertion", category: "sorting", name: "Insertion Sort", short: "Insertion", status: "ready", generate: "random", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", blurb: "Builds a sorted prefix by inserting each next value into its correct position." },
    { id: "selection", category: "sorting", name: "Selection Sort", short: "Selection", status: "ready", generate: "random", best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", blurb: "Finds the minimum remaining value and places it at the front of the unsorted region." },
    { id: "merge", category: "sorting", name: "Merge Sort", short: "Merge", status: "ready", generate: "random", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)", blurb: "Divides the array, sorts each half, then merges the sorted halves together." },
    { id: "quick", category: "sorting", name: "Quick Sort", short: "Quick", status: "ready", generate: "random", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)", blurb: "Partitions around a pivot so smaller values sit left and larger values sit right." },
    { id: "heap", category: "sorting", name: "Heap Sort", short: "Heap", status: "ready", generate: "random", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)", blurb: "Turns the array into a max-heap, then repeatedly extracts the largest value." },
    { id: "shell", category: "sorting", name: "Shell Sort", short: "Shell", status: "ready", generate: "random", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(1)", blurb: "Insertion sort over shrinking gaps, so far-apart values move into place faster." },
    { id: "cocktail", category: "sorting", name: "Cocktail Sort", short: "Cocktail", status: "ready", generate: "random", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", blurb: "A bidirectional bubble sort that passes left-to-right, then right-to-left." },
    { id: "counting", category: "sorting", name: "Counting Sort", short: "Counting", status: "planned", generate: "random", best: "O(n+k)", avg: "O(n+k)", worst: "O(n+k)", space: "O(k)", blurb: "Counts how often each value appears, then writes values back in order." },
    { id: "radix", category: "sorting", name: "Radix Sort", short: "Radix", status: "planned", generate: "random", best: "O(d n)", avg: "O(d n)", worst: "O(d n)", space: "O(n)", blurb: "Sorts integers digit by digit using a stable counting pass." },
    { id: "bucket", category: "sorting", name: "Bucket Sort", short: "Bucket", status: "planned", generate: "random", best: "O(n)", avg: "O(n+k)", worst: "O(n²)", space: "O(n)", blurb: "Spreads values into buckets, sorts each bucket, then concatenates them." },
    { id: "linear", category: "searching", name: "Linear Search", short: "Linear", status: "ready", generate: "random", needsTarget: true, best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)", blurb: "Scans each bar from left to right until the target value is found." },
    { id: "binary", category: "searching", name: "Binary Search", short: "Binary", status: "ready", generate: "sorted", needsTarget: true, best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)", blurb: "On a sorted array, repeatedly checks the midpoint and discards half the range." },
    { id: "jump", category: "searching", name: "Jump Search", short: "Jump", status: "ready", generate: "sorted", needsTarget: true, best: "O(1)", avg: "O(√n)", worst: "O(√n)", space: "O(1)", blurb: "Jumps ahead by √n steps, then linearly searches the block that may hold the target." },
    { id: "interpolation", category: "searching", name: "Interpolation Search", short: "Interp.", status: "ready", generate: "sorted", needsTarget: true, best: "O(1)", avg: "O(log log n)", worst: "O(n)", space: "O(1)", blurb: "Estimates the probe index from the value’s position between the current bounds." },
    { id: "ternary", category: "searching", name: "Ternary Search", short: "Ternary", status: "ready", generate: "sorted", needsTarget: true, best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)", blurb: "Splits the remaining range into three parts and discards two of them each step." },
    { id: "exponential", category: "searching", name: "Exponential Search", short: "Exponential", status: "planned", generate: "sorted", needsTarget: true, best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)", blurb: "Finds a range by doubling the bound, then binary-searches inside it." },
    { id: "fibsearch", category: "searching", name: "Fibonacci Search", short: "Fibonacci", status: "planned", generate: "sorted", needsTarget: true, best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)", blurb: "Uses Fibonacci numbers to choose split points instead of a midpoint." },
    { id: "kadane", category: "array", name: "Kadane’s Algorithm", short: "Kadane", status: "ready", generate: "signed", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(1)", blurb: "Finds the contiguous subarray with the largest sum in a single pass." },
    { id: "dutch", category: "array", name: "Dutch National Flag", short: "3-Way", status: "ready", generate: "dutch", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(1)", blurb: "Partitions an array of three kinds of values with low, mid, and high pointers." },
    { id: "pairsum", category: "array", name: "Two-Pointer Pair Sum", short: "Pair sum", status: "ready", generate: "sorted", needsTarget: true, pairTarget: true, best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(1)", blurb: "On a sorted array, moves two pointers inward until their values sum to the target." },
    { id: "sliding", category: "array", name: "Sliding Window", short: "Window", status: "planned", generate: "random", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(k)", blurb: "Maintains a moving window to compute range sums, maxima, or unique counts." },
    { id: "prefix", category: "array", name: "Prefix Sums", short: "Prefix", status: "planned", generate: "random", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)", blurb: "Builds cumulative sums so any subarray sum can be answered in constant time." },
    { id: "rotate", category: "array", name: "Rotate Array", short: "Rotate", status: "planned", generate: "random", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(1)", blurb: "Reverses segments of the array to rotate values left or right in place." },
    { id: "sieve", category: "math", name: "Sieve of Eratosthenes", short: "Sieve", status: "ready", generate: "sequence", best: "O(n log log n)", avg: "O(n log log n)", worst: "O(n log log n)", space: "O(n)", blurb: "Marks multiples of each prime so the unmarked numbers left behind are prime." },
    { id: "euclid", category: "math", name: "Euclidean GCD", short: "GCD", status: "planned", generate: "random", best: "O(1)", avg: "O(log min)", worst: "O(log min)", space: "O(1)", blurb: "Repeatedly replaces the larger number with the remainder until one is zero." },
    { id: "fastpow", category: "math", name: "Fast Exponentiation", short: "Pow", status: "planned", generate: "random", best: "O(log e)", avg: "O(log e)", worst: "O(log e)", space: "O(1)", blurb: "Computes powers by squaring, halving the exponent each step." },
    { id: "bfs", category: "graph", name: "Breadth-First Search", short: "BFS", status: "planned", generate: "grid", best: "O(V+E)", avg: "O(V+E)", worst: "O(V+E)", space: "O(V)", blurb: "Explores a graph level by level using a queue. Needs a grid or node canvas." },
    { id: "dfs", category: "graph", name: "Depth-First Search", short: "DFS", status: "planned", generate: "grid", best: "O(V+E)", avg: "O(V+E)", worst: "O(V+E)", space: "O(V)", blurb: "Explores as far as possible along each branch before backtracking." },
    { id: "dijkstra", category: "graph", name: "Dijkstra", short: "Dijkstra", status: "planned", generate: "grid", best: "O(E log V)", avg: "O(E log V)", worst: "O(E log V)", space: "O(V)", blurb: "Finds shortest paths from a source on a weighted graph with non-negative edges." },
    { id: "astar", category: "graph", name: "A* Search", short: "A*", status: "planned", generate: "grid", best: "O(E)", avg: "O(E log V)", worst: "O(E log V)", space: "O(V)", blurb: "Best-first pathfinding that combines Dijkstra with a heuristic to the goal." },
    { id: "bellman", category: "graph", name: "Bellman-Ford", short: "Bellman-Ford", status: "planned", generate: "grid", best: "O(VE)", avg: "O(VE)", worst: "O(VE)", space: "O(V)", blurb: "Relaxes every edge V−1 times; can detect negative cycles." },
    { id: "prim", category: "graph", name: "Prim’s MST", short: "Prim", status: "planned", generate: "grid", best: "O(E log V)", avg: "O(E log V)", worst: "O(E log V)", space: "O(V)", blurb: "Grows a minimum spanning tree by always adding the cheapest outgoing edge." },
    { id: "kruskal", category: "graph", name: "Kruskal’s MST", short: "Kruskal", status: "planned", generate: "grid", best: "O(E log E)", avg: "O(E log E)", worst: "O(E log E)", space: "O(V)", blurb: "Adds cheapest edges that do not form a cycle, using a union-find structure." },
    { id: "topo", category: "graph", name: "Topological Sort", short: "Topo sort", status: "planned", generate: "grid", best: "O(V+E)", avg: "O(V+E)", worst: "O(V+E)", space: "O(V)", blurb: "Orders nodes of a DAG so every edge points forward." },
    { id: "bst", category: "tree", name: "BST Insert / Search", short: "BST", status: "planned", generate: "tree", best: "O(log n)", avg: "O(log n)", worst: "O(n)", space: "O(n)", blurb: "Binary search tree updates and lookups. Needs a node/tree canvas." },
    { id: "traversals", category: "tree", name: "Tree Traversals", short: "Traversals", status: "planned", generate: "tree", best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(h)", blurb: "Inorder, preorder, postorder, and level-order walks of a binary tree." },
    { id: "avl", category: "tree", name: "AVL Rotations", short: "AVL", status: "planned", generate: "tree", best: "O(log n)", avg: "O(log n)", worst: "O(log n)", space: "O(n)", blurb: "Shows how unbalanced trees rotate to restore height balance." },
    { id: "heapops", category: "tree", name: "Heap Operations", short: "Heap ops", status: "planned", generate: "tree", best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)", blurb: "Insert, extract-max, and heapify on an array-backed binary heap." },
    { id: "lcs", category: "dp", name: "Longest Common Subsequence", short: "LCS", status: "planned", generate: "table", best: "O(nm)", avg: "O(nm)", worst: "O(nm)", space: "O(nm)", blurb: "Fills a DP table to reconstruct the longest shared subsequence of two strings." },
    { id: "knapsack", category: "dp", name: "0/1 Knapsack", short: "Knapsack", status: "planned", generate: "table", best: "O(nW)", avg: "O(nW)", worst: "O(nW)", space: "O(nW)", blurb: "Chooses items that maximize value without exceeding a weight limit." },
    { id: "lis", category: "dp", name: "Longest Increasing Subsequence", short: "LIS", status: "planned", generate: "random", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(n)", blurb: "Finds the longest strictly increasing subsequence of an array." },
    { id: "coin", category: "dp", name: "Coin Change", short: "Coins", status: "planned", generate: "table", best: "O(nA)", avg: "O(nA)", worst: "O(nA)", space: "O(A)", blurb: "Computes the fewest coins needed to make an amount." },
    { id: "edit", category: "dp", name: "Edit Distance", short: "Edit", status: "planned", generate: "table", best: "O(nm)", avg: "O(nm)", worst: "O(nm)", space: "O(nm)", blurb: "Minimum inserts, deletes, and replaces to turn one string into another." },
    { id: "nqueens", category: "backtracking", name: "N-Queens", short: "N-Queens", status: "planned", generate: "board", best: "O(n!)", avg: "O(n!)", worst: "O(n!)", space: "O(n)", blurb: "Places n queens so none share a row, column, or diagonal. Needs a board." },
    { id: "maze", category: "backtracking", name: "Maze Generation / Solve", short: "Maze", status: "planned", generate: "grid", best: "O(RC)", avg: "O(RC)", worst: "O(RC)", space: "O(RC)", blurb: "Recursive backtracker to carve a maze, then DFS/BFS to solve it." },
    { id: "sudoku", category: "backtracking", name: "Sudoku Solver", short: "Sudoku", status: "planned", generate: "board", best: "O(1)", avg: "O(9^k)", worst: "O(9^k)", space: "O(1)", blurb: "Tries digits in empty cells and backtracks on conflicts." },
    { id: "hanoi", category: "backtracking", name: "Tower of Hanoi", short: "Hanoi", status: "planned", generate: "pegs", best: "O(2^n)", avg: "O(2^n)", worst: "O(2^n)", space: "O(n)", blurb: "Moves disks between pegs, never placing a larger disk on a smaller one." },
  ];

  global.VisualizerAlgorithms = runners;
  global.VisualizerCatalog = { categories, algorithms };
  global.SortingAlgorithms = {
    bubble: bubbleSort,
    insertion: insertionSort,
    selection: selectionSort,
    merge: mergeSort,
    quick: quickSort,
    heap: heapSort,
  };
})(window);
