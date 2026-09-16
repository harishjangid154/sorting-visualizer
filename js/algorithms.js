(function (global) {
  function swap(arr, i, j) {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
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
      let key = arr[i];
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
        const li = left + i;
        const ri = mid + 1 + j;
        frames.push({ type: "compare", indices: [li, ri] });
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
      const pivot = arr[high];
      frames.push({ type: "pivot", indices: [high] });
      let i = low;
      for (let j = low; j < high; j++) {
        frames.push({ type: "compare", indices: [j, high] });
        if (arr[j] < pivot) {
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

  global.SortingAlgorithms = {
    bubble: bubbleSort,
    insertion: insertionSort,
    selection: selectionSort,
    merge: mergeSort,
    quick: quickSort,
    heap: heapSort,
  };
})(window);
