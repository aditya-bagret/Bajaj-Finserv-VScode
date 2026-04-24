function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function buildUserId(fullName, dob) {
  if (!/^\d{8}$/.test(dob)) {
    throw new Error("DOB_DDMMYYYY must be exactly 8 digits in DDMMYYYY format");
  }

  const normalizedName = fullName.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalizedName) {
    throw new Error("FULL_NAME must include alphabetic characters");
  }

  return `${normalizedName}_${dob}`;
}

function getUserDetails() {
  return {
    user_id: buildUserId(requireEnv("FULL_NAME"), requireEnv("DOB_DDMMYYYY")),
    email_id: requireEnv("EMAIL_ID"),
    college_roll_number: requireEnv("COLLEGE_ROLL_NUMBER")
  };
}

function isValidEdge(entry) {
  return /^[A-Z]->[A-Z]$/.test(entry) && entry[0] !== entry[3];
}

function buildTree(node, childrenMap) {
  const children = childrenMap.get(node) || [];
  const out = {};
  for (const child of children) {
    out[child] = buildTree(child, childrenMap);
  }
  return out;
}

function computeDepth(node, childrenMap) {
  const children = childrenMap.get(node) || [];
  if (children.length === 0) return 1;
  let maxChildDepth = 0;
  for (const child of children) {
    maxChildDepth = Math.max(maxChildDepth, computeDepth(child, childrenMap));
  }
  return 1 + maxChildDepth;
}

function hasDirectedCycle(nodes, childrenMap) {
  const state = new Map();

  function dfs(node) {
    state.set(node, 1);
    const children = childrenMap.get(node) || [];
    for (const child of children) {
      const childState = state.get(child) || 0;
      if (childState === 1) return true;
      if (childState === 0 && dfs(child)) return true;
    }
    state.set(node, 2);
    return false;
  }

  for (const node of nodes) {
    if ((state.get(node) || 0) === 0 && dfs(node)) return true;
  }
  return false;
}

function connectedComponents(nodes, undirectedMap) {
  const seen = new Set();
  const components = [];

  for (const node of nodes) {
    if (seen.has(node)) continue;

    const stack = [node];
    const component = [];
    seen.add(node);

    while (stack.length > 0) {
      const current = stack.pop();
      component.push(current);

      const neighbors = undirectedMap.get(current) || [];
      for (const next of neighbors) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }

    component.sort();
    components.push(component);
  }

  components.sort((a, b) => a[0].localeCompare(b[0]));
  return components;
}

function processHierarchy(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const duplicateEdgeSet = new Set();
  const seenEdgeSet = new Set();
  const parentByChild = new Map();
  const acceptedEdges = [];
  const allNodes = new Set();

  for (const rawEntry of data) {
    const asString = typeof rawEntry === "string" ? rawEntry : String(rawEntry);
    const trimmed = asString.trim();

    if (!isValidEdge(trimmed)) {
      invalid_entries.push(rawEntry);
      continue;
    }

    if (seenEdgeSet.has(trimmed)) {
      if (!duplicateEdgeSet.has(trimmed)) {
        duplicateEdgeSet.add(trimmed);
        duplicate_edges.push(trimmed);
      }
      continue;
    }
    seenEdgeSet.add(trimmed);

    const parent = trimmed[0];
    const child = trimmed[3];

    if (parentByChild.has(child)) {
      continue;
    }

    parentByChild.set(child, parent);
    acceptedEdges.push([parent, child]);
    allNodes.add(parent);
    allNodes.add(child);
  }

  const childrenMap = new Map();
  const childSet = new Set();
  const undirectedMap = new Map();

  function addUndirected(a, b) {
    if (!undirectedMap.has(a)) undirectedMap.set(a, new Set());
    if (!undirectedMap.has(b)) undirectedMap.set(b, new Set());
    undirectedMap.get(a).add(b);
    undirectedMap.get(b).add(a);
  }

  for (const [parent, child] of acceptedEdges) {
    if (!childrenMap.has(parent)) childrenMap.set(parent, []);
    childrenMap.get(parent).push(child);
    childSet.add(child);
    addUndirected(parent, child);
  }

  for (const node of allNodes) {
    if (!childrenMap.has(node)) childrenMap.set(node, []);
    if (!undirectedMap.has(node)) undirectedMap.set(node, new Set());
  }

  const undirectedAsArrays = new Map();
  for (const [node, neighbors] of undirectedMap.entries()) {
    undirectedAsArrays.set(node, Array.from(neighbors).sort());
  }

  const components = connectedComponents(Array.from(allNodes).sort(), undirectedAsArrays);
  const hierarchies = [];

  let total_trees = 0;
  let total_cycles = 0;
  let largest_tree_root = "";
  let largest_tree_depth = -1;

  for (const componentNodes of components) {
    const componentSet = new Set(componentNodes);
    const compChildrenMap = new Map();

    for (const node of componentNodes) {
      const children = (childrenMap.get(node) || []).filter((c) => componentSet.has(c)).sort();
      compChildrenMap.set(node, children);
    }

    const roots = componentNodes.filter((node) => !childSet.has(node)).sort();
    const root = roots.length > 0 ? roots[0] : componentNodes[0];
    const cycle = hasDirectedCycle(componentNodes, compChildrenMap);

    if (cycle) {
      total_cycles += 1;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
      continue;
    }

    const tree = {};
    tree[root] = buildTree(root, compChildrenMap);
    const depth = computeDepth(root, compChildrenMap);

    hierarchies.push({
      root,
      tree,
      depth
    });

    total_trees += 1;
    if (
      depth > largest_tree_depth ||
      (depth === largest_tree_depth && (largest_tree_root === "" || root < largest_tree_root))
    ) {
      largest_tree_depth = depth;
      largest_tree_root = root;
    }
  }

  return {
    ...getUserDetails(),
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root: total_trees > 0 ? largest_tree_root : ""
    }
  };
}

module.exports = (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "BFHL endpoint is live. Use POST /bfhl with JSON body {\"data\": [\"A->B\", \"A->C\"]}.",
      endpoint: "/bfhl",
      method: "POST"
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { data } = req.body || {};
    if (!Array.isArray(data)) {
      return res.status(400).json({
        error: "Invalid input. Expected JSON: {\"data\": [\"A->B\", \"A->C\"]}"
      });
    }

    return res.status(200).json(processHierarchy(data));
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Unexpected server error"
    });
  }
};