const form = document.getElementById("inquiry-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

function showMessage(type, text) {
  statusEl.textContent = text;
  statusEl.className = `message ${type}`;
  statusEl.style.display = "block";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.style.display = "none";

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !message) {
    showMessage("error", "Please fill in all fields.");
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  const originalBtnText = submitBtn.textContent;
  submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
  submitBtn.classList.add("loading");

  try {
    const response = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Submission failed");
    }

    form.reset();
    showMessage("success", "Thanks! Your inquiry was submitted.");
  } catch (error) {
    showMessage("error", error.message || "Something went wrong.");
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    submitBtn.classList.remove("loading");
  }
});
