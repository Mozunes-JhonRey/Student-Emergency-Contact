/* ============================================
   DASHBOARD PAGE - Data Display & Management
   ============================================ */

const API_URL = 'http://localhost:3000';

/**
 * Load data from API and render table
 */
async function loadData() {
	try {
		const response = await fetch(`${API_URL}/api/submissions`);
		if (!response.ok) throw new Error('Failed to fetch data');

		const data = await response.json();
		renderTable(data.rows);
		updateStats(data);
		showToast('Data loaded successfully', 'success');
	} catch (err) {
		console.error('Error loading data:', err);
		showToast('Failed to load data: ' + err.message, 'error');
		renderEmpty();
	}
}

/**
 * Render table with data rows
 * @param {Array} rows - Array of submission records
 */
function renderTable(rows) {
	const tableBody = document.getElementById('tableBody');

	if (rows.length === 0) {
		tableBody.innerHTML = `
			<tr>
				<td colspan="8" class="empty">
					<div class="empty-icon">📭</div>
					<p>No data found. <a href="info.html" style="color:var(--accent);text-decoration:none;font-weight:600">Add your first entry</a></p>
				</td>
			</tr>
		`;
		return;
	}

	tableBody.innerHTML = rows
		.map(
			(row) => `
		<tr>
			<td><strong>${row.id}</strong></td>
			<td>${escapeHtml(row.name)}</td>
			<td>${escapeHtml(row.address.substring(0, 40))}${row.address.length > 40 ? '...' : ''}</td>
			<td>${formatDate(row.birthday)}</td>
			<td>${escapeHtml(row.phone)}</td>
			<td>${escapeHtml(row.guardian_name || '-')}</td>
			<td>${formatDateTime(row.created_at)}</td>
			<td>
				<div class="actions">
					<button onclick="deleteRecord(${row.id})" class="danger">🗑️ Delete</button>
				</div>
			</td>
		</tr>
	`
		)
		.join('');
}

/**
 * Render empty state when no data available
 */
function renderEmpty() {
	const tableBody = document.getElementById('tableBody');
	tableBody.innerHTML = `
		<tr>
			<td colspan="8" class="empty">
				<div class="empty-icon">❌</div>
				<p>Failed to load data. Please check if the server is running.</p>
				<button onclick="loadData()" style="margin-top:12px">Try Again</button>
			</td>
		</tr>
	`;
}

/**
 * Update statistics cards
 * @param {Object} data - Data object containing total and count
 */
function updateStats(data) {
	const statsDiv = document.getElementById('stats');
	statsDiv.innerHTML = `
		<div class="stat-card">
			<div class="stat-value">${data.total}</div>
			<div class="stat-label">Total Records</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">${data.count}</div>
			<div class="stat-label">Showing</div>
		</div>
	`;
}

/**
 * Delete a single record by ID
 * @param {number} id - Record ID to delete
 */
async function deleteRecord(id) {
	if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
		return;
	}

	try {
		const response = await fetch(`${API_URL}/api/submissions/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) throw new Error('Failed to delete');

		showToast('Record deleted successfully', 'success');
		loadData();
	} catch (err) {
		console.error('Error deleting record:', err);
		showToast('Failed to delete record: ' + err.message, 'error');
	}
}

/**
 * Delete all records and reset auto-increment
 */
async function deleteAllData() {
	if (!confirm('⚠️ WARNING: This will delete ALL records and reset the ID counter to 1.\n\nAre you absolutely sure?')) {
		return;
	}

	if (!confirm('This action CANNOT be undone. Please confirm again.')) {
		return;
	}

	try {
		const response = await fetch(`${API_URL}/api/submissions`, {
			method: 'DELETE',
		});

		if (!response.ok) throw new Error('Failed to delete all data');

		showToast('✓ All data deleted and ID counter reset to 1', 'success');
		setTimeout(() => loadData(), 500);
	} catch (err) {
		console.error('Error deleting all data:', err);
		showToast('Failed to delete all data: ' + err.message, 'error');
	}
}

/**
 * Format date to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

/**
 * Format date and time to readable format
 * @param {string} dateString - ISO datetime string
 * @returns {string} Formatted date and time
 */
function formatDateTime(dateString) {
	const date = new Date(dateString);
	return (
		date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		}) +
		' ' +
		date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		})
	);
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
	if (!text) return '';
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
	const toast = document.getElementById('toast');
	toast.textContent = message;
	toast.className = `toast ${type}`;
	toast.style.display = 'block';

	setTimeout(() => {
		toast.style.display = 'none';
	}, 3000);
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', loadData);
