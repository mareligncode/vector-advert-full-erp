const customFavicon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%232563eb'/%3E%3Cstop offset='100%25' stop-color='%234f46e5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M17 20l10 24h5l10-24h-5.8L29.5 37.8 22.8 20H17zm24 24h6l-4.5-11-3 7.2L41 44z' fill='%23fff'/%3E%3C/svg%3E";

const customCss = `
:root {
  --va-bg: #f8fafc;
  --va-surface: #ffffff;
  --va-surface-muted: #f1f5f9;
  --va-border: #e2e8f0;
  --va-border-strong: #cbd5e1;
  --va-text: #0f172a;
  --va-text-muted: #475569;
  --va-text-subtle: #64748b;
  --va-accent: #2563eb;
  --va-accent-hover: #1d4ed8;
  --va-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(15, 23, 42, 0.04);
  --va-radius: 12px;
}

body.va-dark {
  --va-bg: #0b1120;
  --va-surface: #111827;
  --va-surface-muted: #1e293b;
  --va-border: #1f2937;
  --va-border-strong: #334155;
  --va-text: #f1f5f9;
  --va-text-muted: #cbd5e1;
  --va-text-subtle: #94a3b8;
  --va-accent: #3b82f6;
  --va-accent-hover: #60a5fa;
  --va-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

html, body {
  background: var(--va-bg) !important;
  color: var(--va-text) !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif !important;
  -webkit-font-smoothing: antialiased;
}

.swagger-ui {
  color: var(--va-text) !important;
  font-family: inherit !important;
}

/* Custom Sticky Topbar */
.swagger-ui .topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1e1b4b 100%) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  padding: 12px 0 !important;
  box-shadow: 0 6px 24px rgba(2, 6, 23, 0.22);
  backdrop-filter: blur(10px);
}

.swagger-ui .topbar .wrapper {
  max-width: 1440px;
  padding: 0 24px;
}

.swagger-ui .topbar .topbar-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.swagger-ui .topbar a.link {
  display: none !important;
}

.va-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.va-brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #ffffff;
  font-weight: 800;
  font-size: 15px;
  letter-spacing: -0.03em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.45);
  flex-shrink: 0;
}

.va-brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.va-brand-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.va-brand-sub {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
}

.va-topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.va-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.va-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
}

.va-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  text-decoration: none;
  transition: all 0.16s ease;
}

.va-action-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.32);
  transform: translateY(-1px);
}

.va-action-btn.va-primary {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.35);
}

.va-action-btn.va-primary:hover {
  filter: brightness(1.08);
}

/* Main container width */
.swagger-ui .wrapper {
  max-width: 1440px !important;
  padding: 0 24px !important;
}

/* API Info Card */
.swagger-ui .information-container.wrapper {
  margin-top: 24px;
  margin-bottom: 18px;
}

.swagger-ui .info {
  margin: 0 !important;
  padding: 26px 30px;
  background: var(--va-surface);
  border: 1px solid var(--va-border);
  border-radius: var(--va-radius);
  box-shadow: var(--va-shadow);
}

.swagger-ui .info .title {
  color: var(--va-text) !important;
  font-size: 28px !important;
  font-weight: 800 !important;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.swagger-ui .info .title small {
  background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
  border-radius: 9999px !important;
  padding: 3px 10px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
}

.swagger-ui .info .title small.version-stamp {
  background: #059669 !important;
}

.swagger-ui .info .description p,
.swagger-ui .info .description li,
.swagger-ui .info .description h3 {
  color: var(--va-text-muted) !important;
}

.swagger-ui .info .description code {
  background: var(--va-surface-muted);
  color: var(--va-accent);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.88em;
}

/* Scheme / Server / Authorize Bar */
.swagger-ui .scheme-container {
  background: var(--va-surface) !important;
  border: 1px solid var(--va-border);
  border-radius: var(--va-radius);
  box-shadow: var(--va-shadow) !important;
  margin: 0 auto 18px auto !important;
  max-width: 1392px;
  padding: 16px 24px !important;
}

.swagger-ui .schemes-title {
  color: var(--va-text-subtle) !important;
  font-weight: 600 !important;
}

.swagger-ui select {
  background: var(--va-surface-muted) !important;
  color: var(--va-text) !important;
  border: 1px solid var(--va-border-strong) !important;
  border-radius: 8px !important;
  padding: 7px 12px !important;
  font-weight: 500;
}

.swagger-ui .btn.authorize {
  background: linear-gradient(135deg, #059669, #10b981) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 8px 18px !important;
  font-weight: 700 !important;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.swagger-ui .btn.authorize svg {
  fill: #ffffff !important;
}

.swagger-ui .btn.authorize:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

/* Search Filter Bar */
.swagger-ui .filter-container {
  background: transparent !important;
  margin: 0 0 18px 0 !important;
}

.swagger-ui .filter-container .filter.wrapper {
  padding: 0 !important;
}

.swagger-ui .filter-container .operation-filter-input {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 13px 18px !important;
  border-radius: var(--va-radius) !important;
  border: 1px solid var(--va-border-strong) !important;
  background: var(--va-surface) !important;
  color: var(--va-text) !important;
  font-size: 14px !important;
  font-weight: 500;
  box-shadow: var(--va-shadow);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.swagger-ui .filter-container .operation-filter-input:focus {
  outline: none;
  border-color: var(--va-accent) !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18) !important;
}

/* Tag Section Cards */
.swagger-ui .opblock-tag-section {
  background: var(--va-surface);
  border: 1px solid var(--va-border);
  border-radius: var(--va-radius);
  box-shadow: var(--va-shadow);
  margin-bottom: 14px;
  overflow: hidden;
}

.swagger-ui .opblock-tag {
  margin: 0 !important;
  padding: 16px 22px !important;
  border-bottom: 1px solid var(--va-border) !important;
  color: var(--va-text) !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  transition: background-color 0.15s ease;
}

.swagger-ui .opblock-tag:hover {
  background: var(--va-surface-muted) !important;
}

.swagger-ui .opblock-tag small {
  color: var(--va-text-subtle) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
}

.swagger-ui .opblock-tag svg {
  fill: var(--va-text-subtle) !important;
}

.swagger-ui .opblock-tag-section > .operation-tag-content {
  padding: 12px 16px;
}

/* Endpoint Operation Blocks */
.swagger-ui .opblock {
  border-radius: 10px !important;
  border-width: 1px !important;
  margin: 0 0 10px 0 !important;
  box-shadow: none !important;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.swagger-ui .opblock:last-child {
  margin-bottom: 0 !important;
}

.swagger-ui .opblock:hover {
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.07) !important;
}

.swagger-ui .opblock .opblock-summary {
  padding: 8px 14px !important;
}

.swagger-ui .opblock .opblock-summary-method {
  border-radius: 7px !important;
  min-width: 78px !important;
  padding: 6px 10px !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  letter-spacing: 0.04em;
  text-shadow: none !important;
}

.swagger-ui .opblock .opblock-summary-path {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
  font-size: 13.5px !important;
  font-weight: 600 !important;
  color: var(--va-text) !important;
}

.swagger-ui .opblock .opblock-summary-description {
  color: var(--va-text-muted) !important;
  font-size: 13px !important;
  font-weight: 500;
}

/* Refined Method Colors */
.swagger-ui .opblock.opblock-get {
  background: rgba(14, 165, 233, 0.06) !important;
  border-color: rgba(14, 165, 233, 0.28) !important;
}
.swagger-ui .opblock.opblock-get .opblock-summary-method {
  background: #0284c7 !important;
}

.swagger-ui .opblock.opblock-post {
  background: rgba(16, 185, 129, 0.06) !important;
  border-color: rgba(16, 185, 129, 0.28) !important;
}
.swagger-ui .opblock.opblock-post .opblock-summary-method {
  background: #059669 !important;
}

.swagger-ui .opblock.opblock-put {
  background: rgba(245, 158, 11, 0.07) !important;
  border-color: rgba(245, 158, 11, 0.32) !important;
}
.swagger-ui .opblock.opblock-put .opblock-summary-method {
  background: #d97706 !important;
}

.swagger-ui .opblock.opblock-patch {
  background: rgba(124, 58, 237, 0.07) !important;
  border-color: rgba(124, 58, 237, 0.3) !important;
}
.swagger-ui .opblock.opblock-patch .opblock-summary-method {
  background: #7c3aed !important;
}

.swagger-ui .opblock.opblock-delete {
  background: rgba(239, 68, 68, 0.06) !important;
  border-color: rgba(239, 68, 68, 0.28) !important;
}
.swagger-ui .opblock.opblock-delete .opblock-summary-method {
  background: #dc2626 !important;
}

/* Expanded Operation Body, Tables & Buttons */
.swagger-ui .opblock-body {
  background: var(--va-surface) !important;
  border-top: 1px solid var(--va-border);
}

.swagger-ui .opblock .opblock-section-header {
  background: var(--va-surface-muted) !important;
  border-top: 1px solid var(--va-border);
  border-bottom: 1px solid var(--va-border);
  box-shadow: none !important;
}

.swagger-ui .opblock .opblock-section-header h4,
.swagger-ui .opblock-description-wrapper p,
.swagger-ui .parameter__name,
.swagger-ui .parameter__type,
.swagger-ui table thead tr th,
.swagger-ui table thead tr td,
.swagger-ui .response-col_status,
.swagger-ui .response-col_description,
.swagger-ui .tab li,
.swagger-ui label {
  color: var(--va-text) !important;
}

.swagger-ui .opblock-description-wrapper code {
  background: var(--va-surface-muted);
  color: var(--va-accent);
  padding: 2px 6px;
  border-radius: 5px;
}

.swagger-ui input[type=text],
.swagger-ui input[type=password],
.swagger-ui input[type=search],
.swagger-ui input[type=email],
.swagger-ui textarea {
  background: var(--va-surface-muted) !important;
  color: var(--va-text) !important;
  border: 1px solid var(--va-border-strong) !important;
  border-radius: 8px !important;
  padding: 8px 10px !important;
}

.swagger-ui .btn {
  border-radius: 8px !important;
  font-weight: 600 !important;
}

.swagger-ui .btn.execute {
  background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
  border-color: transparent !important;
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.35);
  padding: 9px 20px !important;
}

.swagger-ui .btn.try-out__btn {
  border-color: var(--va-accent) !important;
  color: var(--va-accent) !important;
}

.swagger-ui .highlight-code pre,
.swagger-ui pre.microlight {
  border-radius: 10px !important;
  padding: 14px !important;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
  font-size: 12.5px !important;
  line-height: 1.55 !important;
}

/* Models / Schemas Section */
.swagger-ui section.models {
  background: var(--va-surface) !important;
  border: 1px solid var(--va-border) !important;
  border-radius: var(--va-radius) !important;
  box-shadow: var(--va-shadow);
  margin: 24px 0 48px 0 !important;
}

.swagger-ui section.models h4 {
  color: var(--va-text) !important;
  font-weight: 700 !important;
  padding: 14px 20px !important;
}

.swagger-ui section.models .model-container {
  background: var(--va-surface-muted) !important;
  border-radius: 8px !important;
  margin: 8px 16px !important;
}

.swagger-ui .model-title,
.swagger-ui .model,
.swagger-ui .prop-name,
.swagger-ui .prop-format {
  color: var(--va-text) !important;
}

body.va-dark .swagger-ui .model-box,
body.va-dark .swagger-ui .responses-inner,
body.va-dark .swagger-ui .dialog-ux .modal-ux {
  background: var(--va-surface) !important;
  color: var(--va-text) !important;
  border-color: var(--va-border-strong) !important;
}

body.va-dark .swagger-ui .dialog-ux .modal-ux-header h3,
body.va-dark .swagger-ui .dialog-ux .modal-ux-content h4,
body.va-dark .swagger-ui .dialog-ux .modal-ux-content p,
body.va-dark .swagger-ui .auth-container h4 {
  color: var(--va-text) !important;
}

body.va-dark .swagger-ui svg.arrow {
  fill: var(--va-text-muted) !important;
}

@media (max-width: 768px) {
  .swagger-ui .wrapper,
  .swagger-ui .topbar .wrapper {
    padding: 0 12px !important;
  }
  .swagger-ui .info {
    padding: 18px;
  }
  .swagger-ui .opblock .opblock-summary-path {
    font-size: 12px !important;
  }
}
`;

const customJsStr = `
(function () {
  var THEME_KEY = 'va_swagger_theme';

  function applyTheme(mode) {
    if (mode === 'dark') {
      document.body.classList.add('va-dark');
    } else {
      document.body.classList.remove('va-dark');
    }
    var toggleBtn = document.getElementById('va-theme-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = mode === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
  }

  function enhanceHeader() {
    var topbarWrapper = document.querySelector('.swagger-ui .topbar .topbar-wrapper');
    if (!topbarWrapper || document.getElementById('va-brand-root')) return false;

    var brand = document.createElement('a');
    brand.id = 'va-brand-root';
    brand.className = 'va-brand';
    brand.href = '/api-docs';

    var logo = document.createElement('span');
    logo.className = 'va-brand-logo';
    logo.textContent = 'VA';

    var brandText = document.createElement('span');
    brandText.className = 'va-brand-text';

    var title = document.createElement('span');
    title.className = 'va-brand-title';
    title.textContent = 'Vector Advert Full ERP';

    var sub = document.createElement('span');
    sub.className = 'va-brand-sub';
    sub.textContent = 'REST API Reference · OpenAPI 3.0.3';

    brandText.appendChild(title);
    brandText.appendChild(sub);
    brand.appendChild(logo);
    brand.appendChild(brandText);

    var actions = document.createElement('div');
    actions.className = 'va-topbar-actions';

    var pill = document.createElement('span');
    pill.className = 'va-pill';
    var dot = document.createElement('span');
    dot.className = 'va-pill-dot';
    var pillLabel = document.createElement('span');
    pillLabel.textContent = '20 Modules · 238 Endpoints';
    pill.appendChild(dot);
    pill.appendChild(pillLabel);

    var downloadBtn = document.createElement('a');
    downloadBtn.className = 'va-action-btn va-primary';
    downloadBtn.href = '/api-docs.json';
    downloadBtn.target = '_blank';
    downloadBtn.rel = 'noopener noreferrer';
    downloadBtn.textContent = 'OpenAPI JSON';

    var themeBtn = document.createElement('button');
    themeBtn.id = 'va-theme-toggle';
    themeBtn.type = 'button';
    themeBtn.className = 'va-action-btn';
    themeBtn.addEventListener('click', function () {
      var next = document.body.classList.contains('va-dark') ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme(next);
    });

    actions.appendChild(pill);
    actions.appendChild(downloadBtn);
    actions.appendChild(themeBtn);

    topbarWrapper.appendChild(brand);
    topbarWrapper.appendChild(actions);

    var filterInput = document.querySelector('.swagger-ui .operation-filter-input');
    if (filterInput) {
      filterInput.setAttribute('placeholder', 'Search 238 endpoints by tag, route path, or keyword...');
    }

    var saved = 'light';
    try {
      saved = localStorage.getItem(THEME_KEY) || 'light';
    } catch (e) {}
    applyTheme(saved);
    return true;
  }

  function boot() {
    if (enhanceHeader()) return;
    var observer = new MutationObserver(function () {
      if (enhanceHeader()) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'complete') {
    boot();
  } else {
    window.addEventListener('load', function () {
      setTimeout(boot, 50);
    });
  }
})();
`;

export const swaggerUiOptions = {
  explorer: false,
  customSiteTitle: 'Vector Advert Full ERP — API Documentation',
  customfavIcon: customFavicon,
  customCss,
  customJsStr,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 2,
    showExtensions: true,
    showCommonExtensions: true,
    tagsSorter: 'alpha',
    operationsSorter: 'method',
    syntaxHighlight: {
      activate: true,
      theme: 'nord'
    }
  }
};

export default swaggerUiOptions;
