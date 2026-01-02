/* ============================================
   INFO PAGE - Form Handling & Date Picker Logic
   ============================================ */

const API_URL = 'http://localhost:3000';

// DOM Elements
const form = document.getElementById('gatherForm');
const toast = document.getElementById('toast');
const err = document.getElementById('formError');
const birthdayInput = form.querySelector('input[type="date"]');

// Local Storage Key
const STORAGE_KEY = 'gatherForm:draft:v1';

/**
 * Display toast notification
 * @param {string} msg - Message to display
 * @param {boolean} ok - Success or error (default: true)
 */
function showToast(msg, ok = true) {
	toast.textContent = msg;
	toast.style.background = ok ? '#10b981' : '#ef4444';
	toast.style.display = 'block';
	setTimeout(() => (toast.style.display = 'none'), 3000);
}

/**
 * Save form data to localStorage
 */
function saveDraft() {
	const data = {
		name: form.name.value,
		address: form.address.value,
		birthday: form.birthday.value,
		phone: form.phone.value,
		guardian_name: form.guardian_name.value,
		guardian_phone: form.guardian_phone.value,
	};
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (e) {
		console.warn('Failed to save draft:', e);
	}
}

/**
 * Restore form data from localStorage
 */
function restoreDraft() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const data = JSON.parse(raw);
		form.name.value = data.name || '';
		form.address.value = data.address || '';
		form.birthday.value = data.birthday || '';
		form.phone.value = data.phone || '';
		form.guardian_name.value = data.guardian_name || '';
		form.guardian_phone.value = data.guardian_phone || '';
	} catch (e) {
		console.warn('Failed to restore draft:', e);
	}
}

/**
 * Clear form data and localStorage
 */
function clearFormData() {
	localStorage.removeItem(STORAGE_KEY);
	form.reset();
}

/**
 * Handle form submission
 */
form.addEventListener('submit', async (e) => {
	e.preventDefault();
	err.textContent = '';

	// Prepare payload
	const payload = {
		name: form.name.value.trim(),
		address: form.address.value.trim(),
		birthday: form.birthday.value || null,
		phone: form.phone.value.trim(),
		guardian_name: form.guardian_name.value.trim() || null,
		guardian_phone: form.guardian_phone.value.trim() || null,
		source: 'data-gatherer',
	};

	// Validate required fields
	if (!payload.name) return (err.textContent = 'Full name is required.');
	if (!payload.address) return (err.textContent = 'Address is required.');
	if (!payload.birthday) return (err.textContent = 'Birthday is required.');
	if (!payload.phone) return (err.textContent = 'Phone is required.');

	try {
		const res = await fetch(`${API_URL}/api/submissions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const j = await res.json().catch(() => ({ message: res.statusText }));
			throw new Error(j.message || res.statusText);
		}

		const body = await res.json();
		showToast('✓ Data saved successfully (ID: ' + body.id + ')');
		localStorage.removeItem(STORAGE_KEY);
		form.reset();

		// Redirect to dashboard after 1.5 seconds
		setTimeout(() => {
			window.location.href = 'index.html';
		}, 1500);
	} catch (ex) {
		console.error('Submit error:', ex);
		err.textContent = 'Submit failed: ' + (ex.message || 'error');
		showToast('Submit failed', false);
	}
});

/**
 * Save form data on input change
 */
form.addEventListener('input', () => {
	saveDraft();
	err.textContent = '';
});

/**
 * Enhanced Date Picker - Make entire field clickable
 */
if (birthdayInput) {
	birthdayInput.addEventListener('click', () => {
		birthdayInput.showPicker();
	});
}

/**
 * Date Picker - Scroll to change dates quickly
 */
if (birthdayInput) {
	birthdayInput.addEventListener('wheel', (e) => {
		e.preventDefault();
		const step = e.deltaY > 0 ? -1 : 1;
		const currentDate = new Date(birthdayInput.value || new Date());
		currentDate.setDate(currentDate.getDate() + step);
		birthdayInput.value = currentDate.toISOString().split('T')[0];
		saveDraft();
	}, false);
}

/**
 * Date Picker - Keyboard shortcuts
 * Arrow Up: +1 day
 * Arrow Down: -1 day
 * Shift + Arrow Up: +7 days
 * Shift + Arrow Down: -7 days
 */
if (birthdayInput) {
	birthdayInput.addEventListener('keydown', (e) => {
		const currentDate = new Date(birthdayInput.value || new Date());
		let daysToAdd = 0;

		if (e.key === 'ArrowUp') {
			daysToAdd = e.shiftKey ? 7 : 1;
			e.preventDefault();
		} else if (e.key === 'ArrowDown') {
			daysToAdd = e.shiftKey ? -7 : -1;
			e.preventDefault();
		}

		if (daysToAdd !== 0) {
			currentDate.setDate(currentDate.getDate() + daysToAdd);
			birthdayInput.value = currentDate.toISOString().split('T')[0];
			saveDraft();
		}
	});
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
	clearFormData();
	restoreDraft();
});
