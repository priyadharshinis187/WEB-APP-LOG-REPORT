
"use strict";

(() => {

    const $ = id => document.getElementById(id);

    const webInput = $("webFiles");
    const appInput = $("appFiles");
    const preview = document.querySelector(".preview-section");

    if (!webInput || !appInput || !preview) {
        console.error("Required dashboard elements not found.");
        return;
    }

    const PAGE_SIZE = 200;

    let allFilteredRecords = [];
    let displayedRecords = [];
    let currentPage = 0;

    // =====================================
    // CREATE REPORT CONTROLS
    // =====================================

    const controls = document.createElement("div");

    controls.style.cssText = `
        margin-top:22px;
        display:flex;
        gap:12px;
        align-items:center;
        flex-wrap:wrap;
    `;

    controls.innerHTML = `
        <label for="phase3Range">
            <strong>Report Period:</strong>
        </label>

        <select id="phase3Range"
            style="padding:10px;border:1px solid #d7e0ec;border-radius:8px;">
            <option value="1h">Last 1 Hour</option>
            <option value="1d">Last 1 Day</option>
            <option value="7d" selected>Last 7 Days</option>
        </select>

        <button id="phase3Analyze" type="button"
            style="background:#2868cf;color:white;border:0;padding:12px 18px;border-radius:8px;font-weight:bold;cursor:pointer;">
            Generate WEB–APP Report
        </button>

        <span id="phase3Status" style="font-size:12px;color:#718096;">
            Upload WEB and APP logs.
        </span>
    `;

    const report = document.createElement("section");
    report.id = "phase3Report";
    report.style.cssText = "display:grid;gap:18px;margin-top:22px;";

    preview.insertAdjacentElement("afterend", controls);
    controls.insertAdjacentElement("afterend", report);

    // =====================================
    // CSS STYLES
    // =====================================

    const style = document.createElement("style");

    style.textContent = `

        #phase3Report .p3-card {
            background:#fff;
            border:1px solid #e4eaf2;
            border-radius:12px;
            padding:20px;
            color:#17243a;
            min-width:0;
        }

        #phase3Report h2 {
            font-size:20px;
            margin:0 0 10px;
        }

        #phase3Report h3 {
            font-size:16px;
            margin:0 0 14px;
        }

        #phase3Report .p3-muted {
            color:#718096;
            font-size:12px;
            line-height:1.7;
        }

        #phase3Report .p3-grid {
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(145px,1fr));
            gap:12px;
            margin-top:16px;
        }

        #phase3Report .p3-kpi {
            background:#f4f7fb;
            padding:15px;
            border-radius:9px;
        }

        #phase3Report .p3-kpi span {
            display:block;
            color:#718096;
            font-size:12px;
            margin-bottom:8px;
        }

        #phase3Report .p3-kpi strong {
            font-size:23px;
            color:#1c3d68;
        }

        #phase3Report .p3-search {
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
            gap:13px;
            align-items:end;
            margin:15px 0;
        }

        #phase3Report .p3-field label {
            display:block;
            font-size:12px;
            font-weight:700;
            margin-bottom:7px;
            color:#53647b;
        }

        #phase3Report .p3-field input,
        #phase3Report .p3-field select {
            width:100%;
            box-sizing:border-box;
            padding:11px;
            border:1px solid #d7e0ec;
            border-radius:7px;
            background:white;
            color:#24344d;
            font-size:13px;
        }

        #phase3Report .p3-actions {
            display:flex;
            gap:8px;
            flex-wrap:wrap;
        }

        #phase3Report .p3-actions button {
            padding:11px 17px;
            border:0;
            border-radius:7px;
            cursor:pointer;
            font-weight:600;
        }

        #phase3Report .p3-search-btn {
            background:#2868cf;
            color:white;
        }

        #phase3Report .p3-clear-btn {
            background:#e9eef5;
            color:#34445c;
        }

        #phase3Report .p3-table-wrap {
            width:100%;
            overflow:auto;
            max-height:650px;
            border:1px solid #e8edf4;
            border-radius:8px;
        }

        #phase3Report table {
            border-collapse:collapse;
            width:100%;
            min-width:900px;
            font-size:12px;
        }

        #phase3Report th,
        #phase3Report td {
            padding:11px 12px;
            text-align:left;
            border-bottom:1px solid #e8edf4;
            vertical-align:top;
        }

        #phase3Report th {
            position:sticky;
            top:0;
            background:#eef1ff;
            color:#53647b;
            z-index:1;
        }

        #phase3Report tbody tr:nth-child(even) {
            background:#f7f9fc;
        }

        #phase3Report .p3-id {
            font-family:Consolas,monospace;
            overflow-wrap:anywhere;
            color:#1b318e;
        }

        #phase3Report .p3-web {
            color:#2868cf;
            font-weight:700;
        }

        #phase3Report .p3-app {
            color:#209565;
            font-weight:700;
        }

        #phase3Report .p3-level {
            display:inline-block;
            padding:4px 7px;
            border-radius:12px;
            background:#edf1fa;
            font-weight:700;
        }

        #phase3Report .p3-error {
            background:#fff0f0;
            color:#c03939;
        }

        #phase3Report .p3-pagination {
            display:flex;
            align-items:center;
            gap:10px;
            flex-wrap:wrap;
            margin-top:14px;
        }

        #phase3Report .p3-pagination button {
            border:1px solid #d7e0ec;
            background:white;
            border-radius:7px;
            padding:8px 13px;
            cursor:pointer;
        }

        #phase3Report .p3-pagination button:disabled {
            opacity:.45;
            cursor:not-allowed;
        }

        #phase3Report .p3-warning {
            background:#fff7e5;
            color:#805b0b;
            padding:12px;
            border-radius:8px;
            font-size:12px;
            line-height:1.7;
            margin-top:12px;
        }

        #phase3Report .p3-empty,
        #phase3Report .p3-comparison-empty {
            text-align:center;
            padding:20px;
            color:#718096;
            background:#f7f9fc;
            border-radius:8px;
        }

        #phase3Report .p3-compare-grid {
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:14px;
            margin-top:14px;
        }

        #phase3Report .p3-server-card,
        #phase3Report .p3-timeline {
            border:1px solid #e4eaf2;
            border-radius:10px;
            padding:15px;
            background:#fbfcfe;
            min-width:0;
        }

        #phase3Report .p3-event {
            background:#f1f5fa;
            border-radius:8px;
            padding:11px;
            margin-top:9px;
            overflow-wrap:anywhere;
            font-size:12px;
            line-height:1.6;
        }

        #phase3Report .p3-event p {
            margin:6px 0 0;
        }

        #phase3Report .p3-status {
            display:inline-block;
            padding:7px 12px;
            border-radius:20px;
            background:#eaf1ff;
            color:#2456a6;
            font-weight:700;
            font-size:12px;
            margin:5px 0 10px;
        }

        #phase3Report .p3-compare-search {
            display:flex;
            gap:10px;
            margin:14px 0;
            align-items:center;
        }

        #phase3Report #p3RequestIdInput,
        #phase3Report #p3SharedRequestIds {
            flex:1;
            min-width:0;
            box-sizing:border-box;
            padding:12px;
            border:1px solid #d7e0ec;
            border-radius:8px;
            background:#fff;
            color:#24344d;
            font-size:14px;
        }

        #phase3Report #p3CompareBtn {
            padding:12px 20px;
            border:0;
            border-radius:8px;
            background:#2868cf;
            color:#fff;
            font-weight:700;
            cursor:pointer;
        }

        #phase3Report #p3CompareBtn:hover {
            background:#1e55ad;
        }

        /* NEW: CLEAR BUTTON STYLE */

        #phase3Report #p3CompareClearBtn {
            padding:12px 20px;
            border:0;
            border-radius:8px;
            background:#e9eef5;
            color:#34445c;
            font-weight:700;
            cursor:pointer;
        }

        #phase3Report #p3CompareClearBtn:hover {
            background:#dce4ef;
        }

        @media(max-width:700px) {

            #phase3Report .p3-compare-search {
                flex-direction:column;
                align-items:stretch;
            }

            #phase3Report #p3CompareBtn,
            #phase3Report #p3CompareClearBtn {
                width:100%;
            }

            #phase3Report .p3-compare-grid {
                grid-template-columns:1fr;
            }
        }
    `;

    document.head.appendChild(style);

    // =====================================
    // HELPER FUNCTIONS
    // =====================================

    function esc(value) {
        return String(value ?? "").replace(/[&<>"']/g, ch => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[ch]);
    }

    function normalizeId(value) {
        return String(value || "").trim().toLowerCase();
    }

    function parseTimestamp(value) {

        if (!value) return null;

        const text = String(value).trim();

        const special = text.match(
            /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2}):(\d{1,6})$/
        );

        if (special) {

            const [, y, mo, d, h, mi, s, fraction] = special;

            return new Date(
                Number(y),
                Number(mo) - 1,
                Number(d),
                Number(h),
                Number(mi),
                Number(s),
                Number((fraction + "000").slice(0, 3))
            ).getTime();
        }

        const parsed = Date.parse(text);

        return Number.isFinite(parsed) ? parsed : null;
    }

    function extractUser(text) {

        const pattern =
            /\b(?:username|userName|loginId|login|principal|authenticatedUser|user)\s*[=:]\s*["']?([^"',\s;|]+)/i;

        const match = String(text).match(pattern);

        return match && match[1] ? match[1].trim() : "";
    }

    // =====================================
    // REQUEST ID EXTRACTION
    // =====================================

    function extractRequestId(line, columns, tabFormat) {

        const labelled = line.match(
            /\b(?:rid|requestId|request_id|traceId|trace_id|correlationId|correlation_id)\s*[=:]\s*["']?([a-z0-9-]+)/i
        );

        if (labelled) {
            return labelled[1];
        }

        if (tabFormat) {

            const columnId = String(columns[2] || "").trim();

            if (/^[a-f0-9]{16,64}$/i.test(columnId)) {
                return columnId;
            }
        }

        const positional = line.match(
            /\b(?:TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s+([a-f0-9]{16,64})\b/i
        );

        if (positional) {
            return positional[1];
        }

        const uuid = line.match(
            /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i
        );

        return uuid ? uuid[0] : "";
    }

    // =====================================
    // PARSE LOG LINES
    // =====================================

    function parseLine(line, source, lineNumber) {

        if (!line.trim()) return null;

        const columns = line.split("\t");

        let timestamp = "";
        let level = "";
        let rid = "";
        let user = "";
        let message = line;

        const tabFormat =
            columns.length >= 18 &&
            /^\d{4}-\d{2}-\d{2}/.test((columns[0] || "").trim());

        if (tabFormat) {

            timestamp = (columns[0] || "").trim();
            level = (columns[1] || "").trim().toUpperCase();

            rid = extractRequestId(line, columns, true);

            message = (columns[17] || "").trim() || line;

            user = extractUser(line);

        } else {

            const ts = line.match(
                /\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?::\d{1,6}|[.,]\d{1,6})?/
            );

            timestamp = ts ? ts[0] : "";

            const levelMatch = line.match(
                /\b(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\b/i
            );

            level = levelMatch
                ? levelMatch[1].toUpperCase()
                : "";

            rid = extractRequestId(line, columns, false);

            user = extractUser(line);

            message = line;
        }

        return {
            source,
            lineNumber,
            timestamp,
            timeMs: parseTimestamp(timestamp),
            level,
            rid,
            user,
            message
        };
    }

    // =====================================
    // READ NORMAL AND GZIP FILES
    // =====================================

    async function readFile(file) {

        if (!file.name.toLowerCase().endsWith(".gz")) {
            return file.text();
        }

        if (!("DecompressionStream" in window)) {
            throw new Error(
                "GZIP decompression is not supported by this browser."
            );
        }

        const stream = file.stream().pipeThrough(
            new DecompressionStream("gzip")
        );

        return new Response(stream).text();
    }

    async function parseFiles(files, source) {

        const records = [];

        for (const file of files) {

            const content = await readFile(file);

            const lines = content.split(/\r?\n/);

            lines.forEach((line, index) => {

                const record = parseLine(line, source, index + 1);

                if (record) {
                    records.push(record);
                }
            });
        }

        return records;
    }

    // =====================================
    // OUTCOME DETECTION
    // =====================================

    function detectOutcome(records) {

        const text = records
            .map(record => `${record.level || ""} ${record.message || ""}`)
            .join(" ")
            .toLowerCase();

        const hasFailure =
            /\b(error|failed|failure|timeout|exception|rejected|fatal)\b/.test(text);

        const hasSuccess =
            /\b(success|successful|completed|approved|200 ok)\b/.test(text);

        if (hasFailure && hasSuccess) return "MIXED";
        if (hasFailure) return "FAILED";
        if (hasSuccess) return "SUCCESS";

        return "NOT CLEAR";
    }

    // =====================================
    // WEB - APP COMPARISON
    // =====================================

    function renderRequestComparison(requestId) {

        const host = $("p3Comparison");

        if (!host) return;

        if (!requestId) {

            host.innerHTML = `
                <div class="p3-comparison-empty">
                    Enter a Request ID above and click Compare.
                </div>
            `;

            return;
        }

        const normalizedId = normalizeId(requestId);

        const matchingRecords = allFilteredRecords.filter(record =>
            normalizeId(record.rid) === normalizedId
        );

        const webRecords = matchingRecords.filter(
            record => record.source === "WEB"
        );

        const appRecords = matchingRecords.filter(
            record => record.source === "APP"
        );

        const webOutcome = detectOutcome(webRecords);
        const appOutcome = detectOutcome(appRecords);

        let relationship = "INSUFFICIENT DATA";

        if (!webRecords.length && appRecords.length) {

            relationship = "APP ONLY";

        } else if (webRecords.length && !appRecords.length) {

            relationship = "WEB ONLY";

        } else if (webRecords.length && appRecords.length) {

            if (
                (webOutcome === "SUCCESS" && appOutcome === "FAILED") ||
                (webOutcome === "FAILED" && appOutcome === "SUCCESS")
            ) {

                relationship = "MISMATCH DETECTED";

            } else if (
                webOutcome === appOutcome &&
                (webOutcome === "SUCCESS" || webOutcome === "FAILED")
            ) {

                relationship = "OUTCOME MATCH";

            } else {

                relationship = "BOTH SERVERS FOUND";
            }
        }

        function renderEvents(records) {

            if (!records.length) {

                return `
                    <div class="p3-comparison-empty">
                        No matching records found.
                    </div>
                `;
            }

            return records.map(record => `

                <div class="p3-event">

                    <strong>
                        ${esc(record.timestamp || "Time unavailable")}
                    </strong>

                    <span class="p3-level">
                        ${esc(record.level || "UNKNOWN")}
                    </span>

                    <p>${esc(record.message || "-")}</p>

                </div>

            `).join("");
        }

        const timeline = [...matchingRecords].sort((a, b) => {

            const aTime = Number.isFinite(a.timeMs) ? a.timeMs : 0;
            const bTime = Number.isFinite(b.timeMs) ? b.timeMs : 0;

            return aTime - bTime;
        });

        if (!matchingRecords.length) {

            host.innerHTML = `
                <div class="p3-comparison-empty">
                    No records found for Request ID:
                    <strong>${esc(requestId)}</strong>
                </div>
            `;

            return;
        }

        host.innerHTML = `

            <p>
                <strong>Request ID:</strong>
                <span class="p3-id">${esc(requestId)}</span>
            </p>

            <div class="p3-status">
                ${esc(relationship)}
            </div>

            <div class="p3-compare-grid">

                <div class="p3-server-card">

                    <h3>WEB SERVER</h3>

                    <p>
                        <strong>Outcome:</strong>
                        ${esc(webOutcome)}
                    </p>

                    <p class="p3-muted">
                        ${webRecords.length.toLocaleString()} matching records
                    </p>

                    ${renderEvents(webRecords)}

                </div>

                <div class="p3-server-card">

                    <h3>APP SERVER</h3>

                    <p>
                        <strong>Outcome:</strong>
                        ${esc(appOutcome)}
                    </p>

                    <p class="p3-muted">
                        ${appRecords.length.toLocaleString()} matching records
                    </p>

                    ${renderEvents(appRecords)}

                </div>

            </div>

            <div class="p3-timeline" style="margin-top:16px;">

                <h3>Combined Timeline</h3>

                ${timeline.map(record => `

                    <div class="p3-event">

                        <strong class="${record.source === "WEB" ? "p3-web" : "p3-app"}">
                            ${esc(record.source)}
                        </strong>

                        — ${esc(record.timestamp || "Time unavailable")}

                        <span class="p3-level">
                            ${esc(record.level || "UNKNOWN")}
                        </span>

                        <p>${esc(record.message || "-")}</p>

                    </div>

                `).join("")}

            </div>

            <p class="p3-muted" style="margin-top:10px;">
                Note: SUCCESS / FAILED is estimated from log keywords.
                It is not a confirmed business transaction result.
            </p>
        `;
    }

    // =====================================
    // SEARCH FILTER
    // =====================================

    function applySearch() {

        const requestId = $("p3SearchRid").value.trim().toLowerCase();
        const username = $("p3SearchUser").value.trim().toLowerCase();
        const serverType = $("p3SearchServer").value;

        displayedRecords = allFilteredRecords.filter(record => {

            const ridMatch =
                !requestId ||
                normalizeId(record.rid).includes(requestId);

            const userMatch =
                !username ||
                (record.user || "").toLowerCase().includes(username);

            const serverMatch =
                serverType === "ALL" ||
                record.source === serverType;

            return ridMatch && userMatch && serverMatch;
        });

        currentPage = 0;

        renderTablePage();

        $("p3SearchCount").textContent =
            `${displayedRecords.length.toLocaleString()} matching records`;
    }

    // =====================================
    // TABLE PAGINATION
    // =====================================

    function renderTablePage() {

        const tbody = $("p3TableBody");

        if (!tbody) return;

        const pageCount = Math.max(
            1,
            Math.ceil(displayedRecords.length / PAGE_SIZE)
        );

        currentPage = Math.max(
            0,
            Math.min(currentPage, pageCount - 1)
        );

        const start = currentPage * PAGE_SIZE;

        const rows = displayedRecords.slice(
            start,
            start + PAGE_SIZE
        );

        if (!rows.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="p3-empty">
                        No matching records found.
                    </td>
                </tr>
            `;

        } else {

            tbody.innerHTML = rows.map(record => {

                const serverClass =
                    record.source === "WEB" ? "p3-web" : "p3-app";

                const levelClass =
                    ["ERROR", "FATAL"].includes(record.level)
                        ? "p3-error"
                        : "";

                return `

                    <tr>

                        <td>${esc(record.timestamp || "-")}</td>

                        <td class="${serverClass}">
                            ${esc(record.source)}
                        </td>

                        <td class="p3-id">
                            ${esc(record.rid || "-")}
                        </td>

                        <td>${esc(record.user || "-")}</td>

                        <td>
                            <span class="p3-level ${levelClass}">
                                ${esc(record.level || "-")}
                            </span>
                        </td>

                        <td>${esc(record.message || "-")}</td>

                    </tr>

                `;

            }).join("");
        }

        $("p3PageLabel").textContent =
            `Page ${currentPage + 1} of ${pageCount} | ${displayedRecords.length.toLocaleString()} records`;

        $("p3Prev").disabled = currentPage === 0;
        $("p3Next").disabled = currentPage >= pageCount - 1;
    }

    // =====================================
    // DISPLAY REPORT
    // =====================================

    function renderReport(webRecords, appRecords, info, label) {

        allFilteredRecords = [...webRecords, ...appRecords].sort(
            (a, b) => (b.timeMs || 0) - (a.timeMs || 0)
        );

        const webIds = new Set(
            webRecords
                .map(record => normalizeId(record.rid))
                .filter(Boolean)
        );

        const appIds = new Set(
            appRecords
                .map(record => normalizeId(record.rid))
                .filter(Boolean)
        );

        const sharedIds = [...webIds].filter(
            id => appIds.has(id)
        ).sort();

        const webOnlyCount = [...webIds].filter(
            id => !appIds.has(id)
        ).length;

        const appOnlyCount = [...appIds].filter(
            id => !webIds.has(id)
        ).length;

        const users = new Set(
            allFilteredRecords.map(record => record.user).filter(Boolean)
        );

        report.innerHTML = `

            <div class="p3-card">

                <h2>WEB–APP Log Search Report</h2>

                <p class="p3-muted">

                    Period: <strong>${esc(label)}</strong><br>

                    Log range:
                    ${esc(new Date(info.start).toLocaleString())}
                    to
                    ${esc(new Date(info.latest).toLocaleString())}

                </p>

                <div class="p3-grid">

                    <div class="p3-kpi">
                        <span>Total Records</span>
                        <strong>${allFilteredRecords.length.toLocaleString()}</strong>
                    </div>

                    <div class="p3-kpi">
                        <span>WEB Records</span>
                        <strong>${webRecords.length.toLocaleString()}</strong>
                    </div>

                    <div class="p3-kpi">
                        <span>APP Records</span>
                        <strong>${appRecords.length.toLocaleString()}</strong>
                    </div>

                    <div class="p3-kpi">
                        <span>Shared Request IDs</span>
                        <strong>${sharedIds.length.toLocaleString()}</strong>
                    </div>

                    <div class="p3-kpi">
                        <span>WEB Only IDs</span>
                        <strong>${webOnlyCount.toLocaleString()}</strong>
                    </div>

                    <div class="p3-kpi">
                        <span>APP Only IDs</span>
                        <strong>${appOnlyCount.toLocaleString()}</strong>
                    </div>

                    <div class="p3-kpi">
                        <span>Users Found</span>
                        <strong>${users.size.toLocaleString()}</strong>
                    </div>

                </div>

                <div class="p3-warning">

                    Request IDs are extracted from labelled fields or
                    from the token immediately after the log level.
                    Username is extracted only when a labelled user field
                    is present.

                </div>

            </div>

            <div class="p3-card">

                <h3>Search Logs</h3>

                <div class="p3-search">

                    <div class="p3-field">

                        <label for="p3SearchRid">REQUEST ID</label>

                        <input id="p3SearchRid"
                            type="text"
                            placeholder="Enter Request ID">

                    </div>

                    <div class="p3-field">

                        <label for="p3SearchUser">USER NAME</label>

                        <input id="p3SearchUser"
                            type="text"
                            placeholder="Enter User Name">

                    </div>

                    <div class="p3-field">

                        <label for="p3SearchServer">SERVER TYPE</label>

                        <select id="p3SearchServer">

                            <option value="ALL">All Servers</option>
                            <option value="WEB">WEB</option>
                            <option value="APP">APP</option>

                        </select>

                    </div>

                    <div class="p3-actions">

                        <button id="p3SearchBtn" type="button"
                            class="p3-search-btn">
                            Search
                        </button>

                        <button id="p3ClearBtn" type="button"
                            class="p3-clear-btn">
                            Clear
                        </button>

                    </div>

                </div>

                <p id="p3SearchCount" class="p3-muted"></p>

            </div>

            <div class="p3-card">

                <h3>WEB - APP Request ID Comparison</h3>

                <p class="p3-muted">
                    Select a common Request ID to compare records
                    found in both WEB and APP logs.
                </p>

                <div class="p3-field">

                    <label for="p3SharedRequestIds">
                        COMMON REQUEST IDs
                    </label>

                    <select id="p3SharedRequestIds">

                        <option value="">
                            Select a common Request ID
                        </option>

                        ${sharedIds.map(id => `
                            <option value="${esc(id)}">
                                ${esc(id)}
                            </option>
                        `).join("")}

                    </select>

                    <p class="p3-muted">
                        ${sharedIds.length} common Request IDs found
                    </p>

                </div>

                <div class="p3-compare-search">

                    <input
                        type="text"
                        id="p3RequestIdInput"
                        placeholder="Or enter Request ID manually..."
                        autocomplete="off"
                    >

                    <button type="button" id="p3CompareBtn">
                        Compare
                    </button>

                    <!-- NEW CLEAR BUTTON -->

                    <button type="button" id="p3CompareClearBtn">
                        Clear
                    </button>

                </div>

                <div id="p3Comparison">

                    <div class="p3-comparison-empty">
                        Select a common Request ID or enter one manually.
                    </div>

                </div>

            </div>

            <div class="p3-card">

                <h3>Log Search Results</h3>

                <div class="p3-table-wrap">

                    <table>

                        <thead>

                            <tr>
                                <th>TIME</th>
                                <th>SERVER TYPE</th>
                                <th>REQUEST ID</th>
                                <th>USER NAME</th>
                                <th>LEVEL</th>
                                <th>MESSAGE</th>
                            </tr>

                        </thead>

                        <tbody id="p3TableBody"></tbody>

                    </table>

                </div>

                <div class="p3-pagination">

                    <button id="p3Prev" type="button">
                        Previous
                    </button>

                    <span id="p3PageLabel" class="p3-muted"></span>

                    <button id="p3Next" type="button">
                        Next
                    </button>

                </div>

            </div>

        `;

        // =================================
        // SEARCH BUTTON
        // =================================

        $("p3SearchBtn").addEventListener("click", applySearch);

        // =================================
        // COMPARE BUTTON
        // =================================

        $("p3CompareBtn").addEventListener("click", () => {

            const requestId = normalizeId(
                $("p3RequestIdInput").value
            );

            if (!requestId) {

                $("p3Comparison").innerHTML = `
                    <div class="p3-comparison-empty">
                        Please enter a Request ID before clicking Compare.
                    </div>
                `;

                $("p3RequestIdInput").focus();

                return;
            }

            renderRequestComparison(requestId);
        });

        // =================================
        // NEW: CLEAR REQUEST ID COMPARISON
        // =================================

        $("p3CompareClearBtn").addEventListener("click", () => {

            // Clear manually entered Request ID.
            $("p3RequestIdInput").value = "";

            // Reset common Request ID dropdown.
            $("p3SharedRequestIds").value = "";

            // Clear previous comparison result.
            $("p3Comparison").innerHTML = `
                <div class="p3-comparison-empty">
                    Select a common Request ID or enter one manually.
                </div>
            `;

            // Focus the Request ID input.
            $("p3RequestIdInput").focus();

        });

        // =================================
        // ENTER KEY TO COMPARE
        // =================================

        $("p3RequestIdInput").addEventListener("keydown", event => {

            if (event.key === "Enter") {
                $("p3CompareBtn").click();
            }

        });

        // =================================
        // COMMON REQUEST ID DROPDOWN
        // =================================

        $("p3SharedRequestIds").addEventListener("change", function () {

            const requestId = normalizeId(this.value);

            if (!requestId) return;

            $("p3RequestIdInput").value = requestId;

            renderRequestComparison(requestId);
        });

        // =================================
        // CLEAR SEARCH
        // =================================

        $("p3ClearBtn").addEventListener("click", () => {

            $("p3SearchRid").value = "";
            $("p3SearchUser").value = "";
            $("p3SearchServer").value = "ALL";

            applySearch();
        });

        ["p3SearchRid", "p3SearchUser"].forEach(id => {

            $(id).addEventListener("keydown", event => {

                if (event.key === "Enter") {
                    applySearch();
                }

            });

        });

        // =================================
        // PAGINATION
        // =================================

        $("p3Prev").addEventListener("click", () => {

            currentPage--;

            renderTablePage();
        });

        $("p3Next").addEventListener("click", () => {

            currentPage++;

            renderTablePage();
        });

        applySearch();

        return sharedIds.length;
    }

    // =====================================
    // GENERATE REPORT BUTTON
    // =====================================

    $("phase3Analyze").addEventListener("click", async () => {

        const button = $("phase3Analyze");
        const status = $("phase3Status");
        const period = $("phase3Range").value;

        const labels = {
            "1h": "Last 1 Hour",
            "1d": "Last 1 Day",
            "7d": "Last 7 Days"
        };

        const durations = {
            "1h": 60 * 60 * 1000,
            "1d": 24 * 60 * 60 * 1000,
            "7d": 7 * 24 * 60 * 60 * 1000
        };

        const webFiles = Array.from(webInput.files || []);
        const appFiles = Array.from(appInput.files || []);

        if (!webFiles.length || !appFiles.length) {

            status.textContent =
                "Please upload both WEB and APP log files.";

            return;
        }

        button.disabled = true;
        button.textContent = "Analyzing...";
        status.textContent = "Reading and analyzing logs...";

        try {

            const [allWeb, allApp] = await Promise.all([

                parseFiles(webFiles, "WEB"),
                parseFiles(appFiles, "APP")

            ]);

            const all = [...allWeb, ...allApp];

            const validTimes = all
                .map(record => record.timeMs)
                .filter(Number.isFinite);

            if (!validTimes.length) {

                throw new Error(
                    "No readable timestamps found in the uploaded logs."
                );
            }

            // Latest timestamp in uploaded logs.
            // Find latest timestamp safely for large log files.

            const latest = validTimes.reduce(
                (max, time) => time > max ? time : max,
                -Infinity
            );

            const start = latest - durations[period];

            const webRecords = allWeb.filter(record =>
                record.timeMs !== null &&
                record.timeMs >= start &&
                record.timeMs <= latest
            );

            const appRecords = allApp.filter(record =>
                record.timeMs !== null &&
                record.timeMs >= start &&
                record.timeMs <= latest
            );

            if (!webRecords.length && !appRecords.length) {

                report.innerHTML = `
                    <div class="p3-card">

                        <h2>No data available</h2>

                        <p class="p3-muted">
                            No records found in ${esc(labels[period])}.
                        </p>

                    </div>
                `;

                status.textContent = "No data available.";

                return;
            }

            const sharedCount = renderReport(
                webRecords,
                appRecords,
                { start, latest },
                labels[period]
            );

            const webIds = new Set(
                webRecords.map(record => normalizeId(record.rid)).filter(Boolean)
            );

            const appIds = new Set(
                appRecords.map(record => normalizeId(record.rid)).filter(Boolean)
            );

            status.textContent =
                `Report generated. ${allFilteredRecords.length.toLocaleString()} records loaded. ${sharedCount} shared Request IDs.`;

            console.log("WEB records:", webRecords.length);
            console.log("APP records:", appRecords.length);
            console.log("WEB Request IDs:", webIds.size);
            console.log("APP Request IDs:", appIds.size);
            console.log("Shared Request IDs:", sharedCount);

            report.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {

            console.error("Report error:", error);

            report.innerHTML = `
                <div class="p3-card">

                    <h2>Analysis Failed</h2>

                    <p class="p3-muted">
                        ${esc(error.message)}
                    </p>

                </div>
            `;

            status.textContent = "Error: " + error.message;

        } finally {

            button.disabled = false;
            button.textContent = "Generate WEB–APP Report";

        }

    });

    console.log("WEB–APP Search and Correlation module loaded.");

})();
