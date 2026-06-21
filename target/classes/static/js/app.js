const API_URL = '/api/expenses';

// Load all expenses when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();

    // Set default year and month for filters
    const now = new Date();
    document.getElementById('filterYear').value = now.getFullYear();
    document.getElementById('filterMonth').value = now.getMonth() + 1;

    // Load all expenses
    loadAllExpenses();

    // Form submit handler
    document.getElementById('expenseForm').addEventListener('submit', handleFormSubmit);
});

// ==================== CRUD OPERATIONS ====================

// Load all expenses
function loadAllExpenses() {
    fetch(API_URL)
        .then(response => response.json())
        .then(expenses => renderExpenseTable(expenses))
        .catch(error => console.error('Error loading expenses:', error));

    // Hide summary card and reset filter
    document.getElementById('summaryCard').classList.add('d-none');
    document.getElementById('filterCategory').value = 'All';
}

// Handle form submit (Add or Update)
function handleFormSubmit(event) {
    event.preventDefault();

    const id = document.getElementById('expenseId').value;
    const expense = {
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value
    };

    if (id) {
        // Update existing expense
        fetch(API_URL + '/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        })
            .then(response => response.json())
            .then(() => {
                resetForm();
                loadAllExpenses();
            })
            .catch(error => console.error('Error updating expense:', error));
    } else {
        // Add new expense
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        })
            .then(response => response.json())
            .then(() => {
                resetForm();
                loadAllExpenses();
            })
            .catch(error => console.error('Error adding expense:', error));
    }
}

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        fetch(API_URL + '/' + id, { method: 'DELETE' })
            .then(() => loadAllExpenses())
            .catch(error => console.error('Error deleting expense:', error));
    }
}

// Edit expense - populate form with existing data
function editExpense(id, description, amount, category, date) {
    document.getElementById('expenseId').value = id;
    document.getElementById('description').value = description;
    document.getElementById('amount').value = amount;
    document.getElementById('category').value = category;
    document.getElementById('date').value = date;
    document.getElementById('formTitle').textContent = 'Edit Expense';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-pencil"></i> Update';
    document.getElementById('submitBtn').classList.replace('btn-success', 'btn-warning');
    document.getElementById('cancelBtn').classList.remove('d-none');

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cancel edit mode
function cancelEdit() {
    resetForm();
}

// Reset form to default state
function resetForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('formTitle').textContent = 'Add New Expense';
    document.getElementById('submitBtn').innerHTML = '<i class="bi bi-check-lg"></i> Save';
    document.getElementById('submitBtn').classList.replace('btn-warning', 'btn-success');
    document.getElementById('cancelBtn').classList.add('d-none');
}

// ==================== FILTER & REPORTS ====================

// Filter expenses by category
function filterByCategory() {
    const category = document.getElementById('filterCategory').value;
    if (category === 'All') {
        loadAllExpenses();
    } else {
        fetch(API_URL + '/category/' + category)
            .then(response => response.json())
            .then(expenses => renderExpenseTable(expenses))
            .catch(error => console.error('Error filtering:', error));
    }
}

// Load monthly report
function loadMonthlyReport() {
    const year = document.getElementById('filterYear').value;
    const month = document.getElementById('filterMonth').value;

    if (!year || !month) {
        alert('Please select year and month');
        return;
    }

    fetch(API_URL + '/monthly?year=' + year + '&month=' + month)
        .then(response => response.json())
        .then(expenses => renderExpenseTable(expenses))
        .catch(error => console.error('Error loading monthly report:', error));
}

// Load category-wise summary
function loadCategorySummary() {
    fetch(API_URL + '/summary')
        .then(response => response.json())
        .then(data => renderSummary(data))
        .catch(error => console.error('Error loading summary:', error));
}

// ==================== RENDERING ====================

// Render expense table
function renderExpenseTable(expenses) {
    const tbody = document.getElementById('expenseTableBody');
    let total = 0;

    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No expenses found. Add your first expense above!</td></tr>';
        document.getElementById('totalBadge').textContent = 'Total: ₹0.00';
        return;
    }

    let html = '';
    expenses.forEach((expense, index) => {
        total += expense.amount;
        const badgeClass = 'badge-' + expense.category.toLowerCase();
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${expense.description}</td>
                <td>₹${expense.amount.toFixed(2)}</td>
                <td><span class="badge ${badgeClass}">${expense.category}</span></td>
                <td>${formatDate(expense.date)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action me-1"
                            onclick="editExpense(${expense.id}, '${escapeStr(expense.description)}', ${expense.amount}, '${expense.category}', '${expense.date}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-action"
                            onclick="deleteExpense(${expense.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    document.getElementById('totalBadge').textContent = 'Total: ₹' + total.toFixed(2);
}

// Render category summary
function renderSummary(data) {
    const container = document.getElementById('summaryContainer');
    const summaryCard = document.getElementById('summaryCard');

    if (data.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No data available.</p>';
        summaryCard.classList.remove('d-none');
        return;
    }

    let grandTotal = 0;
    data.forEach(item => grandTotal += item.total);

    let html = '';
    data.forEach(item => {
        const percentage = ((item.total / grandTotal) * 100).toFixed(1);
        html += `
            <div class="col-md-3 col-6">
                <div class="summary-card">
                    <h5>${item.category}</h5>
                    <div class="amount">₹${item.total.toFixed(2)}</div>
                    <div class="progress mt-2" style="height: 6px;">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                    <small class="text-muted">${percentage}%</small>
                </div>
            </div>
        `;
    });

    // Add grand total card
    html += `
        <div class="col-md-3 col-6">
            <div class="summary-card" style="border: 2px solid #2c3e50;">
                <h5>Grand Total</h5>
                <div class="amount" style="color: #e74c3c;">₹${grandTotal.toFixed(2)}</div>
            </div>
        </div>
    `;

    container.innerHTML = html;
    summaryCard.classList.remove('d-none');
}

// ==================== UTILITIES ====================

// Format date to dd-MM-yyyy
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return day + '-' + month + '-' + year;
}

// Escape special characters in strings for safe HTML insertion
function escapeStr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
