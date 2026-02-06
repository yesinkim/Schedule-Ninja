// Schedule Ninja - Parsing Accuracy Test Runner
// Test data will be loaded here
let testCases = [];
let results = [];
let isRunning = false;

// Load test data from JSON files
async function loadTestData() {
    log('📂 Loading test data...', 'info');

    const files = [
        'korean.json',
        'english.json',
        'edge-cases.json',
        'bookings.json',
        'global-events.json',
        'misc.json'
    ];

    for (const file of files) {
        try {
            const response = await fetch(`./datasets/${file}`);
            const data = await response.json();
            testCases.push(...data.testCases);
            log(`✅ Loaded ${data.testCases.length} cases from ${file}`, 'success');
        } catch (error) {
            log(`❌ Failed to load ${file}: ${error.message}`, 'error');
        }
    }

    document.getElementById('totalTests').textContent = testCases.length;
    log(`📊 Total: ${testCases.length} test cases loaded`, 'info');

    // Populate category filter
    const categories = [...new Set(testCases.map(tc => tc.category))];
    const select = document.getElementById('categoryFilter');
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

// Log helper
function log(message, type = 'info') {
    const panel = document.getElementById('logPanel');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    panel.appendChild(entry);
    panel.scrollTop = panel.scrollHeight;
}

// Parse text using Extension's background script
async function parseText(text) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout: No response from extension'));
        }, 30000);

        chrome.runtime.sendMessage(
            { action: 'parseText', eventData: { selectedText: text } },
            (response) => {
                clearTimeout(timeout);
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.success) {
                    resolve(response.eventData);
                } else {
                    reject(new Error(response?.error || 'Unknown error'));
                }
            }
        );
    });
}

// Compare parsed result with expected
function compareResults(parsed, expected) {
    const result = {
        summaryMatch: false,
        startMatch: false,
        endMatch: false,
        locationMatch: false,
        allMatch: false
    };

    if (!parsed || parsed.length === 0) {
        return result;
    }

    const p = parsed[0]; // 첫 번째 이벤트만 비교

    // Summary comparison (contains match)
    if (p.summary && expected.summary) {
        const pSummary = p.summary.toLowerCase().replace(/\s+/g, ' ').trim();
        const eSummary = expected.summary.toLowerCase().replace(/\s+/g, ' ').trim();
        result.summaryMatch = pSummary.includes(eSummary) || eSummary.includes(pSummary) ||
            pSummary === eSummary;
    }

    // Start date/time comparison
    const pStart = p.start?.dateTime || p.start?.date;
    const eStart = expected.start;
    if (pStart && eStart) {
        result.startMatch = pStart.startsWith(eStart.split('T')[0]);
    }

    // End date/time comparison
    const pEnd = p.end?.dateTime || p.end?.date;
    const eEnd = expected.end;
    if (pEnd && eEnd) {
        result.endMatch = pEnd.startsWith(eEnd.split('T')[0]);
    }

    // Location comparison (contains match)
    if (p.location && expected.location) {
        const pLoc = p.location.toLowerCase();
        const eLoc = expected.location.toLowerCase();
        result.locationMatch = pLoc.includes(eLoc) || eLoc.includes(pLoc);
    } else if (!expected.location) {
        result.locationMatch = true; // No expected location = pass
    }

    result.allMatch = result.summaryMatch && result.startMatch &&
        result.endMatch && result.locationMatch;

    return result;
}

// Run single test
async function runTest(testCase, index) {
    const startTime = performance.now();

    try {
        const parsed = await parseText(testCase.input);
        const elapsed = performance.now() - startTime;
        const comparison = compareResults(parsed, testCase.expected);

        return {
            id: testCase.id,
            category: testCase.category,
            input: testCase.input,
            expected: testCase.expected,
            parsed: parsed?.[0],
            comparison,
            passed: comparison.allMatch,
            elapsed,
            error: null
        };
    } catch (error) {
        return {
            id: testCase.id,
            category: testCase.category,
            input: testCase.input,
            expected: testCase.expected,
            parsed: null,
            comparison: { summaryMatch: false, startMatch: false, endMatch: false, locationMatch: false, allMatch: false },
            passed: false,
            elapsed: performance.now() - startTime,
            error: error.message
        };
    }
}

// Update results table
function updateResultsTable(result, index) {
    const tbody = document.getElementById('resultsBody');
    const row = document.createElement('tr');

    const statusClass = result.passed ? 'status-pass' :
        (result.comparison.summaryMatch || result.comparison.startMatch) ? 'status-partial' : 'status-fail';

    const fieldStatus = (match) => match ?
        '<span class="field-match">✓</span>' :
        '<span class="field-mismatch">✗</span>';

    row.innerHTML = `
    <td>${index + 1}</td>
    <td>${result.id}</td>
    <td>${result.category}</td>
    <td class="input-preview" title="${result.input.replace(/"/g, '&quot;')}">${result.input.slice(0, 50)}...</td>
    <td>${fieldStatus(result.comparison.summaryMatch)} ${result.parsed?.summary || '-'}</td>
    <td>${fieldStatus(result.comparison.startMatch)} ${result.parsed?.start?.dateTime || result.parsed?.start?.date || '-'}</td>
    <td>${fieldStatus(result.comparison.endMatch)} ${result.parsed?.end?.dateTime || result.parsed?.end?.date || '-'}</td>
    <td>${fieldStatus(result.comparison.locationMatch)} ${result.parsed?.location || '-'}</td>
    <td class="${statusClass}">${result.passed ? 'PASS' : result.error ? 'ERROR' : 'FAIL'}</td>
    <td>${result.elapsed.toFixed(0)}ms</td>
  `;

    tbody.appendChild(row);
}

// Update stats
function updateStats() {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const avgTime = results.length > 0 ?
        results.reduce((sum, r) => sum + r.elapsed, 0) / results.length : 0;
    const accuracy = results.length > 0 ? (passed / results.length * 100).toFixed(1) : 0;

    document.getElementById('passedTests').textContent = passed;
    document.getElementById('failedTests').textContent = failed;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    document.getElementById('avgTime').textContent = avgTime.toFixed(0);
}

// Run all tests
async function runAllTests() {
    if (isRunning) return;
    isRunning = true;

    const category = document.getElementById('categoryFilter').value;
    const delay = parseInt(document.getElementById('delayMs').value) || 1000;
    const filteredTests = category === 'all' ?
        testCases : testCases.filter(tc => tc.category === category);

    results = [];
    document.getElementById('resultsBody').innerHTML = '';
    document.getElementById('runAllBtn').disabled = true;
    document.getElementById('runSelectedBtn').disabled = true;

    log(`🚀 Starting ${filteredTests.length} tests...`, 'info');

    for (let i = 0; i < filteredTests.length; i++) {
        const testCase = filteredTests[i];
        const progress = ((i + 1) / filteredTests.length * 100).toFixed(1);

        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent =
            `Running test ${i + 1}/${filteredTests.length} (${progress}%)...`;

        log(`🔄 [${i + 1}/${filteredTests.length}] Testing: ${testCase.id}`, 'info');

        const result = await runTest(testCase, i);
        results.push(result);
        updateResultsTable(result, i);
        updateStats();

        if (result.passed) {
            log(`✅ ${testCase.id}: PASS (${result.elapsed.toFixed(0)}ms)`, 'success');
        } else if (result.error) {
            log(`❌ ${testCase.id}: ERROR - ${result.error}`, 'error');
        } else {
            log(`⚠️ ${testCase.id}: FAIL`, 'warn');
        }

        // Delay between tests to avoid overloading
        if (i < filteredTests.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    document.getElementById('progressText').textContent =
        `Completed! ${results.filter(r => r.passed).length}/${results.length} passed`;

    log(`🏁 Test completed! Accuracy: ${(results.filter(r => r.passed).length / results.length * 100).toFixed(1)}%`, 'success');

    document.getElementById('runAllBtn').disabled = false;
    document.getElementById('runSelectedBtn').disabled = false;
    isRunning = false;
}

// Export to CSV
function exportCSV() {
    if (results.length === 0) {
        alert('No results to export');
        return;
    }

    const headers = ['ID', 'Category', 'Input', 'Expected Summary', 'Parsed Summary',
        'Summary Match', 'Start Match', 'End Match', 'Location Match',
        'All Match', 'Time (ms)', 'Error'];

    const rows = results.map(r => [
        r.id,
        r.category,
        `"${r.input.replace(/"/g, '""')}"`,
        `"${r.expected.summary}"`,
        `"${r.parsed?.summary || ''}"`,
        r.comparison.summaryMatch,
        r.comparison.startMatch,
        r.comparison.endMatch,
        r.comparison.locationMatch,
        r.passed,
        r.elapsed.toFixed(0),
        r.error || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-ninja-accuracy-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
}

// Clear results
function clearResults() {
    results = [];
    document.getElementById('resultsBody').innerHTML = '';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = 'Ready to run tests...';
    document.getElementById('passedTests').textContent = '0';
    document.getElementById('failedTests').textContent = '0';
    document.getElementById('accuracy').textContent = '-';
    document.getElementById('avgTime').textContent = '-';
    document.getElementById('logPanel').innerHTML = '';
    log('🗑️ Results cleared', 'info');
}

// Check if extension is available
function checkExtension() {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        log('❌ Chrome Extension API not available. Please open this page from the extension.', 'error');
        document.getElementById('runAllBtn').disabled = true;
        document.getElementById('runSelectedBtn').disabled = true;
        return false;
    }
    log('✅ Chrome Extension API detected', 'success');
    return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    log('🚀 Initializing Test Runner...', 'info');

    if (!checkExtension()) {
        log('⚠️ To run tests, open this page via Chrome Extension context', 'warn');
    }

    await loadTestData();

    document.getElementById('runAllBtn').addEventListener('click', runAllTests);
    document.getElementById('runSelectedBtn').addEventListener('click', runAllTests);
    document.getElementById('exportBtn').addEventListener('click', exportCSV);
    document.getElementById('clearBtn').addEventListener('click', clearResults);
});
