const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 3000;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// remove html tags and trim whitespace from string inputs
function sanitizeString(value) {
    if (typeof value !== "string") return "";
    return value.trim().replace(/<[^>]*>/g, "");
}

// convert input to integer, return null if not a valid number
function sanitizeNumber(value) {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
}

// validate item name
function validateItemName(name) {
    if (!name || name.length === 0) return "Item name is required.";
    if (name.length < 2) return "Item name must be at least 2 characters.";
    if (name.length > 40) return "Item name must not exceed 40 characters.";
    if (!/^[a-zA-Z0-9\s\-'().]+$/.test(name)) return "Item name contains invalid characters.";
    return null;
}

function validateCategory(category) {
    const allowed = ["Vegetables", "Fruits", "Dairy", "Meat", "Drinks", "Other"];
    if (!category) return "Category is required.";
    if (!allowed.includes(category)) return "Invalid category selected.";
    return null;
}

function validateQuantity(qty) {
    if (qty === null || qty === undefined || String(qty).trim() === "") return "Quantity is required.";
    const num = sanitizeNumber(qty);
    if (num === null) return "Quantity must be a whole number.";
    if (num < 1 || num > 100) return "Quantity must be between 1 and 100.";
    return null;
}

function validateUnit(unit) {
    const allowed = ["pcs", "kg", "g", "L", "ml"];
    if (!unit) return "Unit is required.";
    if (!allowed.includes(unit)) return "Invalid unit selected.";
    return null;
}

function validateExpiryDate(dateStr) {
    if (!dateStr) return "Expiry date is required.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "Expiry date must be in YYYY-MM-DD format.";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Expiry date is not a valid date.";
    return null;
}

// validate all contact form fields and return any errors
function validateContactForm(data) {
    const errors = {};

    const firstName = sanitizeString(data.first_name);
    if (!firstName) errors.first_name = "First name is required.";
    else if (firstName.length > 50) errors.first_name = "First name must not exceed 50 characters.";
    else if (!/^[a-zA-Z\s]+$/.test(firstName)) errors.first_name = "First name must contain letters only.";

    const lastName = sanitizeString(data.last_name);
    if (!lastName) errors.last_name = "Last name is required.";
    else if (lastName.length > 50) errors.last_name = "Last name must not exceed 50 characters.";
    else if (!/^[a-zA-Z\s]+$/.test(lastName)) errors.last_name = "Last name must contain letters only.";

    const mobile = sanitizeString(data.user_mobile);
    if (!mobile) errors.user_mobile = "Mobile number is required.";
    else if (!/^[0-9]{10}$/.test(mobile)) errors.user_mobile = "Mobile must be exactly 10 digits.";

    const dob = sanitizeString(data.user_dob);
    if (!dob) {
        errors.user_dob = "Date of birth is required.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        errors.user_dob = "Date of birth must be in YYYY-MM-DD format.";
    } else {
        const dobDate = new Date(dob);
        const maxDate = new Date("2015-12-31");
        if (dobDate > maxDate) errors.user_dob = "Date of birth must be before 2016.";
    }

    const email = sanitizeString(data.user_email);
    if (!email) {
        errors.user_email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.user_email = "Please enter a valid email address.";
    } else if (email.length > 100) {
        errors.user_email = "Email address must not exceed 100 characters.";
    }

    const gender = sanitizeString(data.gender);
    if (!gender || !["male", "female"].includes(gender)) {
        errors.gender = "Please select a gender.";
    }

    const language = sanitizeString(data.user_lang);
    if (!language || !["arabic", "english", "french"].includes(language)) {
        errors.user_lang = "Please select a language.";
    }

    const message = sanitizeString(data.user_message);
    if (!message) errors.user_message = "Message is required.";
    else if (message.length < 10) errors.user_message = "Message must be at least 10 characters.";
    else if (message.length > 1000) errors.user_message = "Message must not exceed 1000 characters.";

    return errors;
}

// get all inventory items from the database
app.get("/api/inventory", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM inventory ORDER BY expiry_date ASC");
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to retrieve inventory. Please try again." });
    }
});

// add a new item to the database
app.post("/api/inventory", async (req, res) => {
    const name = sanitizeString(req.body.name);
    const category = sanitizeString(req.body.category);
    const quantity = sanitizeNumber(req.body.quantity);
    const unit = sanitizeString(req.body.unit);
    const expiry = sanitizeString(req.body.expiry);

    // run validation on all fields
    const errors = {};
    const nameErr = validateItemName(name);
    const categoryErr = validateCategory(category);
    const quantityErr = validateQuantity(quantity);
    const unitErr = validateUnit(unit);
    const dateErr = validateExpiryDate(expiry);

    if (nameErr) errors.name = nameErr;
    if (categoryErr) errors.category = categoryErr;
    if (quantityErr) errors.quantity = quantityErr;
    if (unitErr) errors.unit = unitErr;
    if (dateErr) errors.expiry = dateErr;

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO inventory (name, category, quantity, unit, expiry_date) VALUES (?, ?, ?, ?, ?)",
            [name, category, quantity, unit, expiry]
        );
        res.status(201).json({ success: true, message: `"${name}" has been added to your fridge.`, id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to add item. Please try again." });
    }
});

// update an existing item by id
app.put("/api/inventory/:id", async (req, res) => {
    const id = sanitizeNumber(req.params.id);
    if (!id) {
        return res.status(400).json({ success: false, message: "Invalid item ID." });
    }

    const name = sanitizeString(req.body.name);
    const category = sanitizeString(req.body.category);
    const quantity = sanitizeNumber(req.body.quantity);
    const unit = sanitizeString(req.body.unit);
    const expiry = sanitizeString(req.body.expiry);

    const errors = {};
    const nameErr = validateItemName(name);
    const categoryErr = validateCategory(category);
    const quantityErr = validateQuantity(quantity);
    const unitErr = validateUnit(unit);
    const dateErr = validateExpiryDate(expiry);

    if (nameErr) errors.name = nameErr;
    if (categoryErr) errors.category = categoryErr;
    if (quantityErr) errors.quantity = quantityErr;
    if (unitErr) errors.unit = unitErr;
    if (dateErr) errors.expiry = dateErr;

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    try {
        const [result] = await db.query(
            "UPDATE inventory SET name=?, category=?, quantity=?, unit=?, expiry_date=? WHERE id=?",
            [name, category, quantity, unit, expiry, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Item not found." });
        }
        res.json({ success: true, message: `"${name}" has been updated.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to update item. Please try again." });
    }
});

// delete an item by id
app.delete("/api/inventory/:id", async (req, res) => {
    const id = sanitizeNumber(req.params.id);
    if (!id) {
        return res.status(400).json({ success: false, message: "Invalid item ID." });
    }

    try {
        await db.query("DELETE FROM inventory WHERE id=?", [id]);
        res.json({ success: true, message: "Item has been removed from your fridge." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete item. Please try again." });
    }
});

// save a contact form submission to the database
app.post("/api/contact", async (req, res) => {
    const errors = validateContactForm(req.body);

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    const firstName = sanitizeString(req.body.first_name);
    const lastName = sanitizeString(req.body.last_name);
    const mobile = sanitizeString(req.body.user_mobile);
    const dob = sanitizeString(req.body.user_dob);
    const email = sanitizeString(req.body.user_email);
    const gender = sanitizeString(req.body.gender);
    const language = sanitizeString(req.body.user_lang);
    const inquiryType = sanitizeString(req.body.inquiry_type) || "general";
    const message = sanitizeString(req.body.user_message);

    try {
        await db.query(
            `INSERT INTO contact_submissions (first_name, last_name, mobile, date_of_birth, email, gender, language, inquiry_type, message)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, mobile, dob, email, gender, language, inquiryType, message]
        );
        res.status(201).json({ success: true, message: "Thank you for reaching out! We will respond within 24 hours." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to submit your message. Please try again." });
    }
});

app.listen(PORT, () => {
    console.log(`FridgeTrack server running at http://localhost:${PORT}`);
});
