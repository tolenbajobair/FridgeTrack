const API_BASE = "http://localhost:3000/api";

const EXPIRING_THRESHOLD_DAYS = 3;

const STATUS = {
    FRESH: "Fresh",
    EXPIRING: "Expiring Soon",
    EXPIRED: "Expired"
};

const STATUS_BADGE = {
    "Fresh": "fresh-badge",
    "Expiring Soon": "expiring-badge",
    "Expired": "expired-badge"
};

let items = [];
let editId = null;

const form = document.getElementById("inventoryForm");
const itemNameInput = document.getElementById("itemName");
const categoryInput = document.getElementById("category");
const quantityInput = document.getElementById("quantity");
const unitInput = document.getElementById("unit");
const expiryInput = document.getElementById("expiryDate");
const submitButton = document.getElementById("submitButton");
const statusMessage = document.getElementById("statusMessage");
const tableBody = document.getElementById("inventoryTableBody");

const nameError = document.getElementById("nameError");
const categoryError = document.getElementById("categoryError");
const quantityError = document.getElementById("quantityError");
const unitError = document.getElementById("unitError");
const dateError = document.getElementById("dateError");

document.addEventListener("DOMContentLoaded", function () {
    expiryInput.setAttribute("min", getTodayString());
    form.addEventListener("submit", handleFormSubmit);
    loadItems();
});

async function loadItems() {
    setStatusMessage("Loading items...", false);
    try {
        const response = await fetch(`${API_BASE}/inventory`);
        const result = await response.json();

        if (result.success) {
            items = result.data;
            renderTable();
            updateSummaryCards();
            setStatusMessage("", false);
        } else {
            setStatusMessage("Could not load items. Is the server running?", true);
        }
    } catch (error) {
        console.error(error);
        setStatusMessage("Cannot connect to server. Make sure the backend is running.", true);
    }
}

async function addItem(itemData) {
    const response = await fetch(`${API_BASE}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData)
    });
    return await response.json();
}

async function updateItem(id, itemData) {
    const response = await fetch(`${API_BASE}/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData)
    });
    return await response.json();
}

async function removeItem(id) {
    const response = await fetch(`${API_BASE}/inventory/${id}`, {
        method: "DELETE"
    });
    return await response.json();
}

async function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const itemData = {
        name: itemNameInput.value.trim(),
        category: categoryInput.value,
        quantity: parseInt(quantityInput.value, 10),
        unit: unitInput.value,
        expiry: expiryInput.value
    };

    submitButton.disabled = true;
    submitButton.textContent = editId !== null ? "Saving..." : "Adding...";

    try {
        let result;

        if (editId !== null) {
            result = await updateItem(editId, itemData);
        } else {
            result = await addItem(itemData);
        }

        if (result.success) {
            setStatusMessage(result.message, false);
            resetForm();
            await loadItems();
        } else {
            if (result.errors) {
                showBackendErrors(result.errors);
            } else {
                setStatusMessage(result.message || "Something went wrong.", true);
            }
        }

    } catch (error) {
        console.error(error);
        setStatusMessage("Cannot connect to server. Please try again.", true);
    }

    submitButton.disabled = false;
    submitButton.textContent = editId !== null ? "Save Changes" : "Add Item";
}

function startEdit(id) {
    const item = items.find(function (i) { return i.id === id; });
    if (!item) return;

    itemNameInput.value = item.name;
    categoryInput.value = item.category;
    quantityInput.value = item.quantity;
    unitInput.value = item.unit;
    expiryInput.value = item.expiry_date;

    editId = id;
    submitButton.textContent = "Save Changes";

    clearErrors();
    setStatusMessage(`Editing "${item.name}". Make your changes and click Save.`, false);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteItem(id) {
    const item = items.find(function (i) { return i.id === id; });
    if (!item) return;

    const confirmed = confirm(`Remove "${item.name}" from your fridge?`);
    if (!confirmed) return;

    try {
        const result = await removeItem(id);

        if (result.success) {
            setStatusMessage(result.message, false);
            if (editId === id) resetForm();
            await loadItems();
        } else {
            setStatusMessage(result.message || "Delete failed.", true);
        }
    } catch (error) {
        console.error(error);
        setStatusMessage("Cannot connect to server. Please try again.", true);
    }
}

function validateForm() {
    clearErrors();
    let isValid = true;

    const name = itemNameInput.value.trim();
    if (name === "") {
        nameError.textContent = "Item name is required.";
        isValid = false;
    } else if (name.length < 2) {
        nameError.textContent = "Item name must be at least 2 characters.";
        isValid = false;
    } else if (name.length > 40) {
        nameError.textContent = "Item name must not exceed 40 characters.";
        isValid = false;
    } else if (!/^[a-zA-Z0-9\s\-'().]+$/.test(name)) {
        nameError.textContent = "Item name contains invalid characters.";
        isValid = false;
    }

    if (categoryInput.value === "") {
        categoryError.textContent = "Please select a category.";
        isValid = false;
    }

    const qtyRaw = quantityInput.value.trim();
    if (qtyRaw === "") {
        quantityError.textContent = "Quantity is required.";
        isValid = false;
    } else if (!/^\d+$/.test(qtyRaw)) {
        quantityError.textContent = "Quantity must be a whole number.";
        isValid = false;
    } else if (parseInt(qtyRaw, 10) < 1 || parseInt(qtyRaw, 10) > 100) {
        quantityError.textContent = "Quantity must be between 1 and 100.";
        isValid = false;
    }

    if (unitInput.value === "") {
        unitError.textContent = "Please select a unit.";
        isValid = false;
    }

    const expiry = expiryInput.value;
    if (expiry === "") {
        dateError.textContent = "Expiry date is required.";
        isValid = false;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        dateError.textContent = "Please enter a valid date.";
        isValid = false;
    }

    return isValid;
}

// show errors returned from the backend under the correct fields
function showBackendErrors(errors) {
    if (errors.name) nameError.textContent = errors.name;
    if (errors.category) categoryError.textContent = errors.category;
    if (errors.quantity) quantityError.textContent = errors.quantity;
    if (errors.unit) unitError.textContent = errors.unit;
    if (errors.expiry) dateError.textContent = errors.expiry;
}

function renderTable() {
    tableBody.innerHTML = "";

    if (items.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
            <td colspan="7" style="text-align:center; color:#7a7268; font-style:italic; padding:30px;">
                No items in your fridge yet. Add one above!
            </td>`;
        tableBody.appendChild(emptyRow);
        return;
    }

    items.forEach(function (item) {
        const status = calculateStatus(item.expiry_date);
        const badgeClass = STATUS_BADGE[status];
        const displayDate = formatDateForDisplay(item.expiry_date);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.category)}</td>
            <td>${item.quantity}</td>
            <td>${escapeHtml(item.unit)}</td>
            <td>${displayDate}</td>
            <td><span class="badge ${badgeClass}">${status}</span></td>
            <td>
                <button class="action-btn" onclick="startEdit(${item.id})">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Delete</button>
            </td>`;
        tableBody.appendChild(row);
    });
}

function updateSummaryCards() {
    let fresh = 0, expiring = 0, expired = 0;

    items.forEach(function (item) {
        const status = calculateStatus(item.expiry_date);
        if (status === STATUS.FRESH) fresh++;
        else if (status === STATUS.EXPIRING) expiring++;
        else if (status === STATUS.EXPIRED) expired++;
    });

    document.getElementById("totalItems").textContent = items.length;
    document.getElementById("freshItems").textContent = fresh;
    document.getElementById("expiringItems").textContent = expiring;
    document.getElementById("expiredItems").textContent = expired;
}

// calculate whether an item is fresh, expiring soon, or expired based on today's date
function calculateStatus(expiryDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (days < 0) return STATUS.EXPIRED;
    if (days <= EXPIRING_THRESHOLD_DAYS) return STATUS.EXPIRING;
    return STATUS.FRESH;
}

// convert YYYY-MM-DD from database to DD/MM/YYYY for display
function formatDateForDisplay(dateStr) {
    const parts = String(dateStr).split("T")[0].split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// prevent XSS by escaping any html characters in user input before rendering
function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function clearErrors() {
    nameError.textContent = "";
    categoryError.textContent = "";
    quantityError.textContent = "";
    unitError.textContent = "";
    dateError.textContent = "";
}

function setStatusMessage(msg, isError) {
    statusMessage.textContent = msg;
    statusMessage.style.color = isError ? "#8d4a30" : "#4f6342";
}

function resetForm() {
    editId = null;
    submitButton.textContent = "Add Item";
    form.reset();
    clearErrors();
}
