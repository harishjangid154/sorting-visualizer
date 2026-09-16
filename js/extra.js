(function (global) {
  function cellKey(r, c) {
    return r + "," + c;
  }

  function neighbors(r, c, rows, cols) {
    return [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ].filter(([nr, nc]) => nr >= 0 && nc >= 0 && nr < rows && nc < cols);
  }

  function reconstruct(cameFrom, endKey) {
    const path = [];
    let current = endKey;
    while (current) {
      path.push(current);
      current = cameFrom[current];
    }
    return path.reverse();
  }

  function bfs(grid) {
    return searchGrid(grid, "bfs");
  }

  function dfs(grid) {
    return searchGrid(grid, "dfs");
  }

  function dijkstra(grid) {
    return searchGrid(grid, "dijkstra");
  }

  function astar(grid) {
    return searchGrid(grid, "astar");
  }

  function searchGrid(grid, mode) {
    const { rows, cols, walls, start, end, weights } = grid;
    const startKey = cellKey(start[0], start[1]);
    const endKey = cellKey(end[0], end[1]);
    const frames = [{ type: "cell", key: startKey, kind: "start" }, { type: "cell", key: endKey, kind: "end" }];
    const visited = new Set([startKey]);
    const cameFrom = { [startKey]: null };
    const dist = { [startKey]: 0 };
    const heuristic = (r, c) => Math.abs(r - end[0]) + Math.abs(c - end[1]);
    const open = [{ r: start[0], c: start[1], cost: 0, f: heuristic(start[0], start[1]) }];

    function popOpen() {
      if (mode === "dfs") return open.pop();
      if (mode === "bfs") return open.shift();
      let best = 0;
      for (let i = 1; i < open.length; i++) {
        const better = mode === "astar" ? open[i].f < open[best].f : open[i].cost < open[best].cost;
        if (better) best = i;
      }
      return open.splice(best, 1)[0];
    }

    while (open.length) {
      const current = popOpen();
      const currentKey = cellKey(current.r, current.c);
      frames.push({ type: "cell", key: currentKey, kind: "visit" });
      if (currentKey === endKey) {
        frames.push({ type: "path", keys: reconstruct(cameFrom, endKey) });
        return frames;
      }
      neighbors(current.r, current.c, rows, cols).forEach(([nr, nc]) => {
        const nextKey = cellKey(nr, nc);
        if (walls.has(nextKey)) return;
        if ((mode === "bfs" || mode === "dfs") && visited.has(nextKey)) return;
        const step = (weights && weights[nr][nc]) || 1;
        const nextCost = current.cost + step;
        if ((mode === "dijkstra" || mode === "astar") && dist[nextKey] !== undefined && nextCost >= dist[nextKey]) return;
        visited.add(nextKey);
        dist[nextKey] = nextCost;
        cameFrom[nextKey] = currentKey;
        open.push({ r: nr, c: nc, cost: nextCost, f: nextCost + heuristic(nr, nc) });
        frames.push({ type: "cell", key: nextKey, kind: "frontier" });
      });
    }
    frames.push({ type: "miss" });
    return frames;
  }

  function flattenTree(root, nodes) {
    if (!root) return;
    nodes.push(root);
    flattenTree(root.left, nodes);
    flattenTree(root.right, nodes);
  }

  function traverse(root, order) {
    const frames = [];
    function visit(node) {
      if (!node) return;
      frames.push({ type: "node", id: node.id, kind: "visit" });
    }
    function walk(node) {
      if (!node) return;
      if (order === "preorder") visit(node);
      frames.push({ type: "node", id: node.id, kind: "active" });
      walk(node.left);
      if (order === "inorder") visit(node);
      walk(node.right);
      if (order === "postorder") visit(node);
    }
    if (order === "level") {
      const queue = root ? [root] : [];
      while (queue.length) {
        const node = queue.shift();
        visit(node);
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
      }
    } else {
      walk(root);
    }
    return frames;
  }

  function bstSearch(tree, target) {
    const frames = [];
    let node = tree.root;
    while (node) {
      frames.push({ type: "node", id: node.id, kind: "active" });
      if (node.val === target) {
        frames.push({ type: "node", id: node.id, kind: "found" });
        return frames;
      }
      node = target < node.val ? node.left : node.right;
    }
    frames.push({ type: "miss" });
    return frames;
  }

  function inorder(tree) {
    return traverse(tree.root, "inorder");
  }
  function preorder(tree) {
    return traverse(tree.root, "preorder");
  }
  function postorder(tree) {
    return traverse(tree.root, "postorder");
  }
  function levelorder(tree) {
    return traverse(tree.root, "level");
  }

  function lcs(table) {
    const { a, b } = table;
    const n = a.length;
    const m = b.length;
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    const frames = [];
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        frames.push({ type: "dp", i, j, kind: "compare" });
        if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        frames.push({ type: "dp", i, j, kind: "write", value: dp[i][j] });
      }
    }
    const path = [];
    let i = n;
    let j = m;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        path.push([i, j]);
        i -= 1;
        j -= 1;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) i -= 1;
      else j -= 1;
    }
    frames.push({ type: "dppath", cells: path });
    return frames;
  }

  function coin(table) {
    const { amount, coins } = table;
    const dp = Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    const frames = [];
    coins.forEach((coinValue, coinIndex) => {
      for (let x = coinValue; x <= amount; x++) {
        frames.push({ type: "dp1", index: x, kind: "compare", coin: coinIndex });
        if (dp[x - coinValue] + 1 < dp[x]) {
          dp[x] = dp[x - coinValue] + 1;
          frames.push({ type: "dp1", index: x, kind: "write", value: dp[x] });
        }
      }
    });
    frames.push({ type: "dp1", index: amount, kind: "found", value: dp[amount] === Infinity ? "∞" : dp[amount] });
    return frames;
  }

  function nqueens(board) {
    const n = board.n;
    const frames = [];
    const col = Array(n).fill(-1);
    function safe(r, c) {
      for (let i = 0; i < r; i++) {
        if (col[i] === c || Math.abs(col[i] - c) === r - i) return false;
      }
      return true;
    }
    function solve(r) {
      if (r === n) {
        frames.push({ type: "queens", cells: col.map((c, row) => [row, c]), kind: "solved" });
        return true;
      }
      for (let c = 0; c < n; c++) {
        frames.push({ type: "square", r, c, kind: "try" });
        if (!safe(r, c)) {
          frames.push({ type: "square", r, c, kind: "attack" });
          continue;
        }
        col[r] = c;
        frames.push({ type: "square", r, c, kind: "place" });
        if (solve(r + 1)) return true;
        col[r] = -1;
        frames.push({ type: "square", r, c, kind: "remove" });
      }
      return false;
    }
    solve(0);
    return frames;
  }

  function mazeCarve(grid) {
    const { rows, cols } = grid;
    const walls = new Set();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) walls.add(cellKey(r, c));
    }
    const frames = [];
    function twoStep(r, c) {
      return [
        [r - 2, c],
        [r + 2, c],
        [r, c - 2],
        [r, c + 2],
      ].filter(([nr, nc]) => nr >= 0 && nc >= 0 && nr < rows && nc < cols);
    }
    function carve(r, c) {
      walls.delete(cellKey(r, c));
      frames.push({ type: "cell", key: cellKey(r, c), kind: "visit" });
      twoStep(r, c)
        .sort(() => Math.random() - 0.5)
        .forEach(([nr, nc]) => {
          if (!walls.has(cellKey(nr, nc))) return;
          const mid = cellKey((r + nr) / 2, (c + nc) / 2);
          walls.delete(mid);
          frames.push({ type: "cell", key: mid, kind: "frontier" });
          carve(nr, nc);
        });
    }
    carve(0, 0);
    frames.push({ type: "maze", walls: [...walls] });
    return frames;
  }

  global.VisualizerAlgorithms = Object.assign(global.VisualizerAlgorithms || {}, {
    bfs,
    dfs,
    dijkstra,
    astar,
    bst: bstSearch,
    inorder,
    preorder,
    postorder,
    levelorder,
    lcs,
    coin,
    nqueens,
    maze: mazeCarve,
  });
})(window);
