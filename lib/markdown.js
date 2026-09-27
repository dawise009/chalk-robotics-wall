// Small markdown helper for club posts.
// Supports headings, bold, italic, code, safe links, and flat lists.

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(rawHref) {
  const href = String(rawHref ?? "").trim();

  try {
    const url = new URL(href, "https://chalk.invalid");

    if (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "mailto:"
    ) {
      return href;
    }
  } catch {
    // Invalid URLs are rendered as text.
  }

  return null;
}

function renderInline(source) {
  let text = escapeHtml(source);

  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label, href) => {
      const safeUrl = safeHref(href);

      if (!safeUrl) {
        return label;
      }

      return `<a href="${escapeHtml(safeUrl)}" rel="noopener noreferrer">${label}</a>`;
    }
  );

  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

  return text;
}

function renderMarkdown(src) {
  const lines = String(src ?? "").replace(/\r\n?/g, "\n").split("\n");
  const output = [];
  let listItems = [];

  function flushList() {
    if (listItems.length > 0) {
      output.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
      listItems = [];
    }
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const item = line.match(/^[-*]\s+(.+)$/);

    if (heading) {
      flushList();
      const level = heading[1].length;
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (item) {
      listItems.push(renderInline(item[1]));
      continue;
    }

    flushList();
    output.push(renderInline(line));
  }

  flushList();

  return output.join("<br>");
}

module.exports = { renderMarkdown };
