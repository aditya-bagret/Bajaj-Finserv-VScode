const nodesInput = document.getElementById("nodesInput");
const submitBtn = document.getElementById("submitBtn");
const loadBtn = document.getElementById("loadBtn");
const clearBtn = document.getElementById("clearBtn");
const statusText = document.getElementById("status");
const liveCounts = document.getElementById("liveCounts");
const entryCount = document.getElementById("entryCount");
const edgesProcessedBadge = document.getElementById("edgesProcessedBadge");
const resultsSection = document.getElementById("resultsSection");

const totalTrees = document.getElementById("totalTrees");
const totalCycles = document.getElementById("totalCycles");
const deepestRoot = document.getElementById("deepestRoot");
const invalidEntriesWrap = document.getElementById("invalidEntries");
const duplicateEdgesWrap = document.getElementById("duplicateEdges");

const asciiTab = document.getElementById("asciiTab");
const jsonTab = document.getElementById("jsonTab");
const asciiOutput = document.getElementById("asciiOutput");
const jsonOutput = document.getElementById("jsonOutput");
const copyBtn = document.getElementById("copyBtn");
const exportBtn = document.getElementById("exportBtn");
const themeToggle = document.getElementById("themeToggle");

const DEFAULT_INPUT = [
  "A->B",
  "A->C",
  "B->D",
  "C->E",
  "E->F",
  "X->Y",
  "Y->Z",
  "Z->X",
  "P->Q",
  "Q->R",
  "G->H",
  "G->H",
  "G->I",
  "hello",
  "1->2",
  "A->"
].join("\n");

let latestResponse = null;

function setStatus(message, isError) {
  statusText.textContent = message;
  statusText.style.color = isError ? "var(--danger)" : "var(--accent-strong)";
}

function parseEntries(raw) {
  return raw
    .replace(/,/g, "\n")
    .split("\n")
    .map((item) => item.replace(/\r/g, ""));
}

function normalizeEntries(raw) {
  return parseEntries(raw).map((value) => value.trim()).filter((value) => value !== "");
}

function isValidEdge(entry) {
  return /^[A-Z]->[A-Z]$/.test(entry) && entry[0] !== entry[3];
}

function updateLiveCounters() {
  const entries = normalizeEntries(nodesInput.value);
  let valid = 0;
  let invalid = 0;

  for (const entry of entries) {
    if (isValidEdge(entry)) {
      valid += 1;
    } else {
      invalid += 1;
    }
  }

  liveCounts.textContent = `${valid} valid x ${invalid} invalid`;
  entryCount.textContent = `${entries.length} edges entered`;
}

function createChip(text, variant) {
  const span = document.createElement("span");
  span.className = `chip ${variant}`;
  span.textContent = text;
  return span;
}

function renderChipRow(container, values, variant) {
  container.innerHTML = "";
  if (!values || values.length === 0) {
    container.appendChild(createChip("None", "chip-muted"));
    return;
  }

  for (const value of values) {
    container.appendChild(createChip(String(value), variant));
  }
}

function renderTreeLines(nodeName, nodeObj, prefix, isLast) {
  const branch = prefix === "" ? "" : isLast ? "`-- " : "|-- ";
  const line = `${prefix}${branch}${nodeName}`;
  const children = Object.entries(nodeObj || {});

  if (children.length === 0) {
    return [line];
  }

  const nextPrefix = prefix + (prefix === "" ? "" : isLast ? "    " : "|   ");
  const lines = [line];

  children.forEach(([childName, childObj], index) => {
    const childIsLast = index === children.length - 1;
    lines.push(...renderTreeLines(childName, childObj, nextPrefix, childIsLast));
  });

  return lines;
}

function hierarchyToAscii(hierarchy) {
  if (hierarchy.has_cycle) {
    return [
      `Root: ${hierarchy.root} [Cycle]`,
      "Cycle detected",
      `- root: ${hierarchy.root}`
    ].join("\n");
  }

  const root = hierarchy.root;
  const tree = hierarchy.tree || {};
  const rootObj = tree[root] || {};
  const header = `Root: ${root} [depth ${hierarchy.depth ?? 0}]`;
  const body = renderTreeLines(root, rootObj, "", true).join("\n");
  return `${header}\n${body}`;
}

function renderAsciiResponse(data) {
  const chunks = [];
  const hierarchies = Array.isArray(data.hierarchies) ? data.hierarchies : [];
  for (const hierarchy of hierarchies) {
    chunks.push(hierarchyToAscii(hierarchy));
  }

  if (chunks.length === 0) {
    return "No hierarchy groups returned.";
  }

  return chunks.join("\n\n");
}

function switchTab(tabName) {
  const isAscii = tabName === "ascii";
  asciiTab.classList.toggle("active", isAscii);
  jsonTab.classList.toggle("active", !isAscii);
  asciiOutput.classList.toggle("hidden", !isAscii);
  jsonOutput.classList.toggle("hidden", isAscii);
}

function renderResponse(data, submittedEntries) {
  latestResponse = data;
  const summary = data.summary || {};

  totalTrees.textContent = String(summary.total_trees ?? 0);
  totalCycles.textContent = String(summary.total_cycles ?? 0);
  deepestRoot.textContent = summary.largest_tree_root || "-";

  renderChipRow(invalidEntriesWrap, data.invalid_entries || [], "chip-danger");
  renderChipRow(duplicateEdgesWrap, data.duplicate_edges || [], "chip-warn");

  asciiOutput.textContent = renderAsciiResponse(data);
  jsonOutput.textContent = JSON.stringify(data, null, 2);

  edgesProcessedBadge.textContent = `Edges processed: ${submittedEntries.length}`;
  resultsSection.classList.remove("hidden");
  switchTab("ascii");
}

async function submitData() {
  const entries = normalizeEntries(nodesInput.value);
  if (entries.length === 0) {
    setStatus("Please enter at least one edge.", true);
    return;
  }

  submitBtn.disabled = true;
  setStatus("Submitting to /bfhl ...", false);

  try {
    const response = await fetch("/bfhl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data: entries })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    renderResponse(data, entries);
    setStatus("Analysis complete.", false);
  } catch (error) {
    setStatus(`API request failed: ${error.message}`, true);
  } finally {
    submitBtn.disabled = false;
  }
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
  localStorage.setItem("bfhl-theme", theme);
}

submitBtn.addEventListener("click", submitData);
loadBtn.addEventListener("click", () => {
  nodesInput.value = DEFAULT_INPUT;
  updateLiveCounters();
  setStatus("Example loaded.", false);
});
clearBtn.addEventListener("click", () => {
  nodesInput.value = "";
  updateLiveCounters();
  setStatus("Input cleared.", false);
});

nodesInput.addEventListener("input", updateLiveCounters);
nodesInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.ctrlKey) {
    event.preventDefault();
    submitData();
  }
});

asciiTab.addEventListener("click", () => switchTab("ascii"));
jsonTab.addEventListener("click", () => switchTab("json"));

copyBtn.addEventListener("click", async () => {
  if (!latestResponse) {
    setStatus("No response available to copy.", true);
    return;
  }

  const activeTab = asciiTab.classList.contains("active") ? "ascii" : "json";
  const text = activeTab === "ascii" ? asciiOutput.textContent : jsonOutput.textContent;

  try {
    await navigator.clipboard.writeText(text || "");
    setStatus("Response copied to clipboard.", false);
  } catch (_error) {
    setStatus("Could not copy response. Browser denied clipboard access.", true);
  }
});

exportBtn.addEventListener("click", () => {
  if (!latestResponse) {
    setStatus("No response available to export.", true);
    return;
  }

  const blob = new Blob([JSON.stringify(latestResponse, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "bfhl-response.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  setStatus("JSON exported.", false);
});

themeToggle.addEventListener("click", () => {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(next);
});

nodesInput.value = DEFAULT_INPUT;
updateLiveCounters();
const storedTheme = localStorage.getItem("bfhl-theme");
applyTheme(storedTheme === "dark" ? "dark" : "light");
