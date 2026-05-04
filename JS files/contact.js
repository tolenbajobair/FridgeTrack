const API_BASE = "https://fridgetrack-production.up.railway.app/api";

const contactForm = document.querySelector(".contact-form");
const submitBtn = document.querySelector(".contact-form button[type='submit']");

document.addEventListener("DOMContentLoaded", function () {
    if (!contactForm) return;
    contactForm.addEventListener("submit", handleContactSubmit);
});

async function handleContactSubmit(event) {
    event.preventDefault();

    clearAllErrors();

    const formData = {
        first_name: document.getElementById("fname").value.trim(),
        last_name: document.getElementById("lname").value.trim(),
        user_mobile: document.getElementById("mobile").value.trim(),
        user_dob: document.getElementById("dob").value,
        user_email: document.getElementById("email").value.trim(),
        gender: getSelectedRadio("gender"),
        user_lang: document.getElementById("language").value,
        inquiry_type: document.getElementById("inquiry").value,
        user_message: document.getElementById("message").value.trim()
    };

    const errors = validateContactForm(formData);

    if (Object.keys(errors).length > 0) {
        showErrors(errors);
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
        const response = await fetch(`${API_BASE}/contact`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showSuccessMessage(result.message);
            contactForm.reset();
        } else {
            if (result.errors) {
                showErrors(result.errors);
            } else {
                showGlobalError(result.message || "Submission failed. Please try again.");
            }
        }

    } catch (error) {
        console.error(error);
        showGlobalError("Cannot connect to server. Please make sure the backend is running.");
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Message";
}

function validateContactForm(data) {
    const errors = {};

    if (!data.first_name) {
        errors.fname = "First name is required.";
    } else if (!/^[a-zA-Z\s]+$/.test(data.first_name)) {
        errors.fname = "First name must contain letters only.";
    } else if (data.first_name.length > 50) {
        errors.fname = "First name must not exceed 50 characters.";
    }

    if (!data.last_name) {
        errors.lname = "Last name is required.";
    } else if (!/^[a-zA-Z\s]+$/.test(data.last_name)) {
        errors.lname = "Last name must contain letters only.";
    } else if (data.last_name.length > 50) {
        errors.lname = "Last name must not exceed 50 characters.";
    }

    if (!data.user_mobile) {
        errors.mobile = "Mobile number is required.";
    } else if (!/^[0-9]{10}$/.test(data.user_mobile)) {
        errors.mobile = "Mobile must be exactly 10 digits.";
    }

    if (!data.user_dob) {
        errors.dob = "Date of birth is required.";
    } else {
        const dob = new Date(data.user_dob);
        const maxDate = new Date("2015-12-31");
        if (dob > maxDate) {
            errors.dob = "Date of birth must be before 2016.";
        }
    }

    if (!data.user_email) {
        errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.user_email)) {
        errors.email = "Please enter a valid email address.";
    }

    if (!data.gender) {
        errors.gender = "Please select a gender.";
    }

    if (!data.user_lang) {
        errors.language = "Please select a language.";
    }

    if (!data.user_message) {
        errors.message = "Message is required.";
    } else if (data.user_message.length < 10) {
        errors.message = "Message must be at least 10 characters.";
    } else if (data.user_message.length > 1000) {
        errors.message = "Message must not exceed 1000 characters.";
    }

    return errors;
}

// show validation error messages
function showErrors(errors) {
    if (errors.fname) showFieldError("fname", errors.fname);
    if (errors.lname) showFieldError("lname", errors.lname);
    if (errors.mobile) showFieldError("mobile", errors.mobile);
    if (errors.dob) showFieldError("dob", errors.dob);
    if (errors.email) showFieldError("email", errors.email);
    if (errors.gender) showFieldError("male", errors.gender); // show near first radio
    if (errors.language) showFieldError("language", errors.language);
    if (errors.message) showFieldError("message", errors.message);
}

function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let errorSpan = input.parentElement.querySelector(".error");
    if (!errorSpan) {
        errorSpan = document.createElement("span");
        errorSpan.className = "error";
        input.parentElement.appendChild(errorSpan);
    }
    errorSpan.textContent = message;
}

function clearAllErrors() {
    document.querySelectorAll(".contact-form .error").forEach(function (el) {
        el.textContent = "";
    });

    const globalError = document.getElementById("contactGlobalError");
    if (globalError) globalError.remove();

    const successMsg = document.getElementById("contactSuccess");
    if (successMsg) successMsg.remove();
}

function showGlobalError(message) {
    let el = document.getElementById("contactGlobalError");
    if (!el) {
        el = document.createElement("p");
        el.id = "contactGlobalError";
        el.style.color = "#8d4a30";
        el.style.fontStyle = "italic";
        el.style.marginTop = "12px";
        submitBtn.after(el);
    }
    el.textContent = message;
}

function showSuccessMessage(message) {
    let el = document.getElementById("contactSuccess");
    if (!el) {
        el = document.createElement("p");
        el.id = "contactSuccess";
        el.style.color = "#4f6342";
        el.style.fontStyle = "italic";
        el.style.marginTop = "12px";
        el.style.fontWeight = "bold";
        submitBtn.after(el);
    }
    el.textContent = message;
}

function getSelectedRadio(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : "";
}
