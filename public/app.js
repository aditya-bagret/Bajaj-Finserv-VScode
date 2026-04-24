const submitBtn = document.getElementById("submitBtn");
const nodesInput = document.getElementById("nodesInput");
const output = document.getElementById("output");
const statusText = document.getElementById("status");
const apiUrlInput = document.getElementById("apiUrl");

apiUrlInput.value = window.location.origin;

function parseEntries(raw) {
  return raw
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#c62828" : "#15613a";
}

submitBtn.addEventListener("click", async () => {
  const baseUrl = apiUrlInput.value.trim() || window.location.origin;
  const entries = parseEntries(nodesInput.value);
  const url = `${baseUrl.replace(/\/+$/, "")}/bfhl`;

  submitBtn.disabled = true;
  setStatus("Submitting...");
  output.textContent = "{}";

  try {
    const response = await fetch(url, {
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

    output.textContent = JSON.stringify(data, null, 2);
    setStatus("Success.");
  } catch (error) {
    setStatus(`API request failed: ${error.message}`, true);
    output.textContent = "{}";
  } finally {
    submitBtn.disabled = false;
  }
});
