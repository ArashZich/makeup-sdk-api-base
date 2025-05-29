// Global variables
let currentSection = "intro";

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  initSidebar();
  loadSection("intro");
});

// Sidebar functionality
function initSidebar() {
  const links = document.querySelectorAll(".sidebar a");

  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // Remove active class from all links
      links.forEach((l) => l.classList.remove("active"));

      // Add active class to clicked link
      this.classList.add("active");

      // Load section
      const section = this.getAttribute("data-section");
      loadSection(section);
    });
  });
}

// Load section content
async function loadSection(sectionName) {
  const contentDiv = document.getElementById("main-content");

  try {
    // Show loading
    contentDiv.innerHTML = '<div class="loading">در حال بارگذاری...</div>';

    // Fetch section content
    const response = await fetch(`sections/${sectionName}.html`);

    if (!response.ok) {
      throw new Error("Section not found");
    }

    const html = await response.text();
    contentDiv.innerHTML = html;

    // Initialize syntax highlighting
    if (window.Prism) {
      Prism.highlightAll();
    }

    // Initialize copy buttons
    initCopyButtons();

    currentSection = sectionName;
  } catch (error) {
    contentDiv.innerHTML = `
            <div class="error">
                <h2>خطا در بارگذاری</h2>
                <p>متأسفانه نتوانستیم این بخش را بارگذاری کنیم.</p>
                <button onclick="loadSection('${sectionName}')">تلاش مجدد</button>
            </div>
        `;
  }
}

// Copy code functionality
function initCopyButtons() {
  const copyButtons = document.querySelectorAll(".copy-btn");

  copyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const codeBlock = this.closest(".code-container").querySelector("code");
      const text = codeBlock.textContent;

      copyToClipboard(text);

      // Show feedback
      const originalText = this.textContent;
      this.textContent = "کپی شد!";
      this.style.background = "#28a745";

      setTimeout(() => {
        this.textContent = originalText;
        this.style.background = "#007bff";
      }, 2000);
    });
  });
}

// Copy to clipboard helper
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }
}

// Global copy function for inline buttons
function copyCode(button) {
  const codeBlock = button.closest(".code-container").querySelector("code");
  const text = codeBlock.textContent;

  copyToClipboard(text);

  // Show feedback
  const originalText = button.textContent;
  button.textContent = "کپی شد!";
  button.style.background = "#28a745";

  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = "#007bff";
  }, 2000);
}
