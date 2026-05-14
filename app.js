const $ = (id) => document.getElementById(id);

const state = {
  summary: [],
  details: [],
  meta: null,
  activeTab: "summary"
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateBR(date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatDateTimeBR(date) {
  return `${formatDateBR(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDateTimeInput(date) {
  return `${toDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getSelectedRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value;
}

function getDefaultCycleDate() {
  const now = new Date();
  if (now.getHours() < 3) now.setDate(now.getDate() - 1);
  return toDateInput(now);
}

function getCycleByDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const start = new Date(year, month - 1, day, 3, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 2, 59, 59, 0);
  return { start, end };
}

function getScopeLabel(scope) {
  return scope === "trilhos" ? "Trilhos" : "Garagens";
}

function getScopeMeta(scope = getSelectedRadio("scope") || "garagens") {
  const isTrilhos = scope === "trilhos";
  return {
    scope,
    label: isTrilhos ? "Trilhos" : "Garagens",
    targetLabel: isTrilhos ? "Trilho" : "Garagem",
    schemaLabel: isTrilhos ? "Base" : "Schema",
    originQtyLabel: isTrilhos ? "Qtd Trilhos" : "Qtd Garagem",
    originOnlyLabel: isTrilhos ? "Só nos Trilhos" : "Só na Garagem",
    title: isTrilhos ? "ETL - Comparação Autopass vs Trilhos" : "ETL - Comparação Autopass vs Garagens"
  };
}

function getAllTargets(scope) {
  const config = window.ALVO_CONFIG || { garagens: [], trilhos: [] };
  if (scope === "trilhos") {
    return config.trilhos.map((target) => ({
      tipo: "Trilho",
      origemLabel: "Trilhos",
      nome: target.nome,
      schemaBase: target.base || "—",
      tpIds: target.tpIds || []
    }));
  }

  return config.garagens.map((target) => ({
    tipo: "Garagem",
    origemLabel: "Garagem",
    nome: target.nome,
    schemaBase: target.schema || "—",
    tpIds: target.tpIds || []
  }));
}

function updateTargetCounter() {
  const scope = getSelectedRadio("scope") || "garagens";
  const targets = getAllTargets(scope);
  const meta = getScopeMeta(scope);
  $("targetCounter").innerHTML = `
    <strong>${targets.length} alvo(s) carregado(s) para esta consulta.</strong><br />
    Consulta selecionada: Autopass x ${meta.label}. A seleção individual de alvos fica desabilitada para padronizar a operação.
  `;
  updateTableHeaders(scope);
}

function updateTableHeaders(scope = getSelectedRadio("scope") || "garagens") {
  const meta = getScopeMeta(scope);
  $("targetHeader").textContent = meta.targetLabel;
  $("schemaHeader").textContent = meta.schemaLabel;
  $("originQtyHeader").textContent = meta.originQtyLabel;
  $("originOnlyHeader").textContent = meta.originOnlyLabel;
  $("detailsTargetHeader").textContent = meta.targetLabel;
  $("detailsSchemaHeader").textContent = meta.schemaLabel;
  $("metricOriginOnlyLabel").textContent = meta.originOnlyLabel;
}

function updatePeriodMode() {
  const mode = getSelectedRadio("periodMode") || "auto";
  $("autoPeriodBox").classList.toggle("hidden", mode !== "auto");
  $("manualPeriodBox").classList.toggle("hidden", mode !== "manual");
  updateCyclePreview();
}

function updateCyclePreview() {
  const dateValue = $("cycleDate").value || getDefaultCycleDate();
  const { start, end } = getCycleByDate(dateValue);
  $("cyclePreview").textContent = `Consulta de ${formatDateTimeBR(start)} até ${formatDateTimeBR(end)}.`;
}

function getPeriod() {
  const mode = getSelectedRadio("periodMode") || "auto";
  if (mode === "auto") {
    const dateValue = $("cycleDate").value || getDefaultCycleDate();
    return { mode, ...getCycleByDate(dateValue) };
  }

  const startValue = $("startDateTime").value;
  const endValue = $("endDateTime").value;
  if (!startValue || !endValue) throw new Error("Preencha início e fim do período manual.");

  const start = new Date(startValue);
  const end = new Date(endValue);
  if (end <= start) throw new Error("A data final precisa ser maior que a data inicial.");
  return { mode, start, end };
}

function cloneRows(rows) {
  return JSON.parse(JSON.stringify(rows || []));
}

function formatDateTimeApi(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getApiBaseUrl() {
  return String(window.API_BASE_URL || "").replace(/\/$/, "");
}

function buildApiPayload(scope, period) {
  return {
    scope,
    period: {
      mode: period.mode,
      start: formatDateTimeApi(period.start),
      end: formatDateTimeApi(period.end)
    }
  };
}

function normalizeApiResult(result, scope, period) {
  if (!result || !Array.isArray(result.summary) || !Array.isArray(result.details)) {
    throw new Error("A API respondeu em um formato inválido. Ela precisa retornar summary[] e details[].");
  }

  return {
    summary: cloneRows(result.summary),
    details: cloneRows(result.details),
    fixture: {
      sourceLabel: result.sourceLabel || "API Oracle interna",
      periodLabel: result.periodLabel || `${formatDateTimeBR(period.start)} até ${formatDateTimeBR(period.end)}`,
      generatedAt: result.generatedAt || formatDateTimeBR(new Date()),
      modeLabel: result.modeLabel || `Valores reais Autopass x ${getScopeLabel(scope)}`
    }
  };
}

async function fetchRealResult(scope, period) {
  const apiBaseUrl = getApiBaseUrl();
  const endpoint = `${apiBaseUrl}/api/comparacao`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildApiPayload(scope, period))
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`A API respondeu algo que não é JSON. Retorno: ${text.slice(0, 120)}`);
  }

  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || `Erro HTTP ${response.status} ao consultar a API.`);
  }

  return normalizeApiResult(payload, scope, period);
}

async function executeQuery(scope, period) {
  // Agora o front envia SEMPRE o período escolhido pelo usuário para a API.
  // Isso corrige o problema de usar uma amostra fixa para qualquer data.
  // Para valores reais, a API precisa estar em uma VM/servidor com acesso ao Oracle.
  try {
    return await fetchRealResult(scope, period);
  } catch (error) {
    if (window.USE_STATIC_SAMPLE === true) {
      const fixture = window.RESULT_FIXTURES?.[scope];
      if (fixture?.summary?.length) {
        return {
          summary: cloneRows(fixture.summary),
          details: cloneRows(fixture.details),
          fixture
        };
      }
    }

    throw new Error(
      `${error.message}\n\n` +
      "Para puxar valores reais de todas as datas, publique o backend/autopass_api.py em um servidor com acesso aos bancos Oracle e configure window.API_BASE_URL em data/alvos.js."
    );
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCellValue(value) {
  return value === null || value === undefined || value === "" ? "—" : value;
}

function statusBadge(status) {
  if (status === "OK") return `<span class="badge ok">● OK</span>`;
  if (status === "Divergente") return `<span class="badge issue">● Divergente</span>`;
  return `<span class="badge pending">● Aguardando API</span>`;
}

function rowClassByStatus(status) {
  if (status === "OK") return "ok-row";
  if (status === "Divergente") return "issue-row";
  return "pending-row";
}

function situationBadge(row) {
  const klass = row.situacaoTipo === "origem" ? "origin" : "autopass";
  return `<span class="badge ${klass}">${escapeHtml(row.situacao)}</span>`;
}

function getFilteredData() {
  const term = $("searchInput").value.trim().toLowerCase();
  if (!term) return { summary: state.summary, details: state.details };
  const includesTerm = (row) => Object.values(row).some((value) => String(value).toLowerCase().includes(term));
  return {
    summary: state.summary.filter(includesTerm),
    details: state.details.filter(includesTerm)
  };
}

function renderMetrics() {
  const total = state.summary.length;
  const ok = state.summary.filter((row) => row.status === "OK").length;
  const issues = state.summary.filter((row) => row.status === "Divergente").length;
  const originOnly = state.summary.reduce((sum, row) => sum + (Number.isFinite(row.originOnly) ? row.originOnly : 0), 0);
  const autopassOnly = state.summary.reduce((sum, row) => sum + (Number.isFinite(row.autopassOnly) ? row.autopassOnly : 0), 0);

  $("metricTargets").textContent = total;
  $("metricOk").textContent = ok;
  $("metricIssues").textContent = issues;
  $("metricOriginOnly").textContent = originOnly;
  $("metricAutopassOnly").textContent = autopassOnly;
}

function renderSummaryTable() {
  const { summary } = getFilteredData();
  const body = $("summaryTableBody");
  if (!summary.length) {
    body.innerHTML = `<tr><td colspan="8" class="empty">Nenhum resultado encontrado para o filtro atual.</td></tr>`;
    return;
  }

  body.innerHTML = summary.map((row) => `
    <tr class="${rowClassByStatus(row.status)}">
      <td><strong>${escapeHtml(row.alvo)}</strong></td>
      <td>${escapeHtml(row.schemaBase)}</td>
      <td>${escapeHtml(row.tpId)}</td>
      <td>${escapeHtml(formatCellValue(row.origem))}</td>
      <td>${escapeHtml(formatCellValue(row.autopass))}</td>
      <td>${escapeHtml(formatCellValue(row.originOnly))}</td>
      <td>${escapeHtml(formatCellValue(row.autopassOnly))}</td>
      <td>${statusBadge(row.status)}</td>
    </tr>
  `).join("");
}

function renderDetailsTable() {
  const { details } = getFilteredData();
  const body = $("detailsTableBody");
  if (!details.length) {
    body.innerHTML = `<tr><td colspan="5" class="empty">Nenhuma divergência encontrada.</td></tr>`;
    return;
  }

  body.innerHTML = details.map((row) => `
    <tr class="issue-row">
      <td><strong>${escapeHtml(row.alvo)}</strong></td>
      <td>${escapeHtml(row.schemaBase)}</td>
      <td>${escapeHtml(row.tpId)}</td>
      <td>${escapeHtml(row.arquivo)}</td>
      <td>${situationBadge(row)}</td>
    </tr>
  `).join("");
}

function getReportPeriodLabel() {
  if (state.meta?.fixture?.periodLabel) return state.meta.fixture.periodLabel;
  if (!state.meta?.period) return "—";
  return `${formatDateTimeBR(state.meta.period.start)} até ${formatDateTimeBR(state.meta.period.end)}`;
}

function getReportPeriodTitle() {
  const fixtureLabel = state.meta?.fixture?.periodLabel;
  if (fixtureLabel) {
    const dates = fixtureLabel.match(/(\d{2}\/\d{2}\/\d{4}).*(\d{2}\/\d{2}\/\d{4})/);
    if (dates) return `${dates[1]} a ${dates[2]}`;
  }
  if (!state.meta?.period) return "—";
  return `${formatDateBR(state.meta.period.start)} a ${formatDateBR(state.meta.period.end)}`;
}

function getGeneratedAtLabel() {
  return state.meta?.fixture?.generatedAt || formatDateTimeBR(state.meta.executedAt);
}

function renderExecutionInfo() {
  if (!state.meta) return;
  $("executedPeriod").textContent = getReportPeriodLabel();
  $("executedScope").textContent = `Autopass x ${state.meta.scopeLabel}`;
  $("executedAt").textContent = getGeneratedAtLabel();
}

function renderAll() {
  renderMetrics();
  renderSummaryTable();
  renderDetailsTable();
  renderExecutionInfo();
}

function setActiveTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  $("summaryView").classList.toggle("hidden", tab !== "summary");
  $("detailsView").classList.toggle("hidden", tab !== "details");
}

function rowsToCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const sanitize = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(";"), ...rows.map((row) => headers.map((key) => sanitize(row[key])).join(";"))].join("\n");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const rows = state.activeTab === "summary" ? getFilteredData().summary : getFilteredData().details;
  if (!rows.length) {
    alert("Não há dados para exportar.");
    return;
  }
  const scope = state.meta?.scope || getSelectedRadio("scope") || "garagens";
  downloadFile(`comparacao-autopass-${scope}-${state.activeTab}.csv`, rowsToCsv(rows), "text/csv;charset=utf-8");
}

function clearResults() {
  state.summary = [];
  state.details = [];
  state.meta = null;
  $("searchInput").value = "";
  $("executedPeriod").textContent = "Nenhuma execução realizada";
  $("executedScope").textContent = "—";
  $("executedAt").textContent = "—";
  renderMetrics();
  $("summaryTableBody").innerHTML = `<tr><td colspan="8" class="empty">Execute uma automação para visualizar os resultados.</td></tr>`;
  $("detailsTableBody").innerHTML = `<tr><td colspan="5" class="empty">Nenhuma divergência carregada.</td></tr>`;
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnLetter(index) {
  let result = "";
  let number = index;
  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }
  return result;
}

function cellXml(rowIndex, colIndex, value, style = 0) {
  const ref = `${columnLetter(colIndex)}${rowIndex}`;
  const styleAttr = style ? ` s="${style}"` : "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"${styleAttr}><v>${value}</v></c>`;
  }
  return `<c r="${ref}"${styleAttr} t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
}

function rowXml(rowIndex, cells, height = null) {
  const ht = height ? ` ht="${height}" customHeight="1"` : "";
  return `<row r="${rowIndex}"${ht}>${cells.join("")}</row>`;
}

function emptyCells(rowIndex, columns, style = 0) {
  return Array.from({ length: columns }, (_, idx) => cellXml(rowIndex, idx + 1, "", style));
}

function worksheetXml({ rows, merges = [], cols = [], freezeRow = null, dimension }) {
  const colsXml = cols.length
    ? `<cols>${cols.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const paneXml = freezeRow
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${freezeRow}" topLeftCell="A${freezeRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
  const mergeXml = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="${dimension}"/>
  ${paneXml}
  ${colsXml}
  <sheetData>${rows.join("")}</sheetData>
  ${mergeXml}
</worksheet>`;
}

function buildResumoSheetXml() {
  const meta = getScopeMeta(state.meta.scope);
  const filtered = getFilteredData();
  const summary = filtered.summary;
  const title = `${meta.title}  |  Período: ${getReportPeriodTitle()}`;
  const generated = `Gerado em: ${getGeneratedAtLabel()}`;
  const rows = [];

  rows.push(rowXml(1, [cellXml(1, 1, title, 1)], 27));
  rows.push(rowXml(2, [cellXml(2, 1, generated, 2)], 22));
  rows.push(rowXml(3, emptyCells(3, 7), 8));
  rows.push(rowXml(4, [
    cellXml(4, 1, meta.targetLabel, 3),
    cellXml(4, 2, meta.schemaLabel, 3),
    cellXml(4, 3, "TP_ID", 3),
    cellXml(4, 4, meta.originQtyLabel, 3),
    cellXml(4, 5, "Qtd Autopass", 3),
    cellXml(4, 6, meta.originOnlyLabel, 3),
    cellXml(4, 7, "Só no Autopass", 3)
  ], 20));

  let currentRow = 5;
  summary.forEach((item) => {
    const style = item.status === "OK" ? 4 : (item.status === "Divergente" ? 5 : 12);
    rows.push(rowXml(currentRow, [
      cellXml(currentRow, 1, item.alvo, style),
      cellXml(currentRow, 2, item.schemaBase, style),
      cellXml(currentRow, 3, item.tpId, style),
      cellXml(currentRow, 4, item.origem, style),
      cellXml(currentRow, 5, item.autopass, style),
      cellXml(currentRow, 6, item.originOnly, style),
      cellXml(currentRow, 7, item.autopassOnly, style)
    ], 18));
    currentRow += 1;
  });

  const totalOriginOnly = summary.reduce((sum, item) => sum + (Number.isFinite(item.originOnly) ? item.originOnly : 0), 0);
  const totalAutopassOnly = summary.reduce((sum, item) => sum + (Number.isFinite(item.autopassOnly) ? item.autopassOnly : 0), 0);
  rows.push(rowXml(currentRow, [
    cellXml(currentRow, 1, "TOTAL DE DIVERGÊNCIAS", 6),
    cellXml(currentRow, 2, "", 6),
    cellXml(currentRow, 3, "", 6),
    cellXml(currentRow, 4, "", 6),
    cellXml(currentRow, 5, "", 6),
    cellXml(currentRow, 6, totalOriginOnly, 6),
    cellXml(currentRow, 7, totalAutopassOnly, 6)
  ], 20));

  const legendStart = currentRow + 2;
  rows.push(rowXml(currentRow + 1, emptyCells(currentRow + 1, 7), 8));
  rows.push(rowXml(legendStart, [cellXml(legendStart, 1, "LEGENDA", 7), ...emptyCells(legendStart, 6).slice(1)], 19));
  rows.push(rowXml(legendStart + 1, [cellXml(legendStart + 1, 1, "Verde", 8), cellXml(legendStart + 1, 2, "Sem divergência", 8)], 18));
  rows.push(rowXml(legendStart + 2, [cellXml(legendStart + 2, 1, "Vermelho", 8), cellXml(legendStart + 2, 2, "Possui arquivos divergentes", 8)], 18));
  rows.push(rowXml(legendStart + 3, [cellXml(legendStart + 3, 1, "Amarelo", 8), cellXml(legendStart + 3, 2, "Alvo real carregado, porém sem consulta Oracle neste protótipo estático", 8)], 18));
  rows.push(rowXml(legendStart + 4, [cellXml(legendStart + 4, 1, meta.originOnlyLabel, 8), cellXml(legendStart + 4, 2, `Arquivo existe em ${meta.label} mas não no Autopass`, 8)], 18));
  rows.push(rowXml(legendStart + 5, [cellXml(legendStart + 5, 1, "Só no Autopass", 8), cellXml(legendStart + 5, 2, `Arquivo existe no Autopass mas não em ${meta.label}`, 8)], 18));

  const lastRow = legendStart + 5;
  return worksheetXml({
    rows,
    merges: [`A1:G1`, `A2:G2`, `A${currentRow}:E${currentRow}`],
    cols: [42, 18, 12, 16, 16, 18, 18],
    freezeRow: 4,
    dimension: `A1:G${lastRow}`
  });
}

function buildDivergenciasSheetXml() {
  const meta = getScopeMeta(state.meta.scope);
  const details = getFilteredData().details;
  const rows = [];
  rows.push(rowXml(1, [cellXml(1, 1, "Arquivos com Divergência (presentes em apenas uma das bases)", 9)], 27));
  rows.push(rowXml(2, emptyCells(2, 5), 8));
  rows.push(rowXml(3, [
    cellXml(3, 1, meta.targetLabel, 3),
    cellXml(3, 2, meta.schemaLabel, 3),
    cellXml(3, 3, "TP_ID", 3),
    cellXml(3, 4, "Arquivo", 3),
    cellXml(3, 5, "Situação", 3)
  ], 20));

  let currentRow = 4;
  if (!details.length) {
    rows.push(rowXml(currentRow, [cellXml(currentRow, 1, "Sem divergências carregadas para esta consulta.", 4), ...emptyCells(currentRow, 5, 4).slice(1)], 20));
  } else {
    details.forEach((item) => {
      const style = item.situacaoTipo === "origem" ? 11 : 10;
      rows.push(rowXml(currentRow, [
        cellXml(currentRow, 1, item.alvo, style),
        cellXml(currentRow, 2, item.schemaBase, style),
        cellXml(currentRow, 3, item.tpId, style),
        cellXml(currentRow, 4, item.arquivo, style),
        cellXml(currentRow, 5, item.situacao, style)
      ], 18));
      currentRow += 1;
    });
    currentRow -= 1;
  }

  return worksheetXml({
    rows,
    merges: ["A1:E1", ...(details.length ? [] : ["A4:E4"])],
    cols: [42, 18, 12, 76, 24],
    freezeRow: 3,
    dimension: `A1:E${Math.max(currentRow, 4)}`
  });
}

function workbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="RESUMO" sheetId="1" r:id="rId1"/>
    <sheet name="DIVERGÊNCIAS" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;
}

function workbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="6">
    <font><sz val="11"/><color rgb="FF111827"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><i/><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF111827"/><name val="Calibri"/></font>
    <font><sz val="11"/><color rgb="FF111827"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F3F6D"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDFF0D8"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8D8D8"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD30000"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF4CC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFC7CED9"/></left>
      <right style="thin"><color rgb="FFC7CED9"/></right>
      <top style="thin"><color rgb="FFC7CED9"/></top>
      <bottom style="thin"><color rgb="FFC7CED9"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="13">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="5" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="6" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="6" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function coreXml() {
  const nowIso = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Painel Autopass</dc:creator>
  <cp:lastModifiedBy>Painel Autopass</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified>
</cp:coreProperties>`;
}

function appXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Painel Autopass</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>2</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="2" baseType="lpstr"><vt:lpstr>RESUMO</vt:lpstr><vt:lpstr>DIVERGÊNCIAS</vt:lpstr></vt:vector></TitlesOfParts>
</Properties>`;
}

async function exportXlsx() {
  if (!state.summary.length || !state.meta) {
    alert("Execute uma consulta antes de baixar o Excel.");
    return;
  }
  if (!window.JSZip) {
    alert("Não foi possível carregar a biblioteca de Excel. Verifique se o navegador tem acesso ao CDN configurado.");
    return;
  }

  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypesXml());
  zip.folder("_rels").file(".rels", rootRelsXml());
  zip.folder("docProps").file("core.xml", coreXml()).file("app.xml", appXml());
  const xl = zip.folder("xl");
  xl.file("workbook.xml", workbookXml());
  xl.file("styles.xml", stylesXml());
  xl.folder("_rels").file("workbook.xml.rels", workbookRelsXml());
  const worksheets = xl.folder("worksheets");
  worksheets.file("sheet1.xml", buildResumoSheetXml());
  worksheets.file("sheet2.xml", buildDivergenciasSheetXml());

  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const dateStamp = `${state.meta.period.start.getFullYear()}${pad(state.meta.period.start.getMonth() + 1)}${pad(state.meta.period.start.getDate())}`;
  const filename = `comparacao_autopass_${state.meta.scope}_${dateStamp}.xlsx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setupDefaultDates() {
  const cycleDate = getDefaultCycleDate();
  $("cycleDate").value = cycleDate;
  const { start, end } = getCycleByDate(cycleDate);
  $("startDateTime").value = toDateTimeInput(start);
  $("endDateTime").value = toDateTimeInput(end);
  updateCyclePreview();
}

async function handleSubmit(event) {
  event.preventDefault();
  const submitButton = $("runButton");
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Executando...";

  try {
    const scope = getSelectedRadio("scope") || "garagens";
    const period = getPeriod();
    const result = await executeQuery(scope, period);
    state.summary = result.summary;
    state.details = result.details;
    state.meta = {
      scope,
      scopeLabel: getScopeLabel(scope),
      period,
      fixture: result.fixture,
      executedAt: new Date()
    };
    updateTableHeaders(scope);
    setActiveTab("summary");
    renderAll();
  } catch (error) {
    alert(error.message || "Não foi possível executar a automação.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

function bindEvents() {
  document.querySelectorAll('input[name="periodMode"]').forEach((input) => input.addEventListener("change", updatePeriodMode));
  document.querySelectorAll('input[name="scope"]').forEach((input) => input.addEventListener("change", updateTargetCounter));
  $("cycleDate").addEventListener("change", updateCyclePreview);
  $("executionForm").addEventListener("submit", handleSubmit);
  $("clearButton").addEventListener("click", clearResults);
  $("searchInput").addEventListener("input", renderAll);
  $("exportCsvButton").addEventListener("click", exportCsv);
  $("exportXlsxButton").addEventListener("click", exportXlsx);
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });
}

setupDefaultDates();
updatePeriodMode();
updateTargetCounter();
bindEvents();
