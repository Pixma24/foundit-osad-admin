// script.js
// ==========================================
// ENVIRONMENT SETUP
// ==========================================
const API_BASE = "https://foundit-backend-qgsb.onrender.com";

function parseSpringDate(date) {
    if (!date || date === "N/A" || date === "null") return "Not submitted";
    try {
        if (Array.isArray(date)) {
            return new Date(date[0], date[1] - 1, date[2]).toLocaleDateString('en-PH', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }
        const d = new Date(date);
        if (isNaN(d.getTime())) return "Not submitted";
        return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return "Not submitted";
    }
}

// ==========================================
// SYSTEM UI & MODALS
// ==========================================
function openModal(modalId) { document.getElementById(modalId).style.display = 'flex'; }
function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

function showCustomAlert(message, type = "error") {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '9999';

    const box = document.createElement('div');
    box.className = 'modal-box';
    box.style.textAlign = 'center';
    box.style.padding = '30px';

    const icon = document.createElement('div');
    icon.style.fontSize = '50px';
    icon.style.marginBottom = '15px';
    
    if (type === "success") {
        icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        icon.style.color = '#10b981';
    } else {
        icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        icon.style.color = '#ef4444';
    }

    const text = document.createElement('h3');
    text.innerText = message;
    text.style.marginBottom = '20px';
    text.style.color = '#333';
    text.style.fontSize = '18px';

    const btn = document.createElement('button');
    btn.innerText = 'Understood';
    btn.className = 'btn-yellow';
    btn.style.width = '100%';
    btn.onclick = () => document.body.removeChild(overlay);

    box.appendChild(icon);
    box.appendChild(text);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function toggleAnyPassword(inputId, icon) {
    const passwordInput = document.getElementById(inputId);
    if (passwordInput && icon) {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            icon.classList.replace("fa-eye-slash", "fa-eye");
        } else {
            passwordInput.type = "password";
            icon.classList.replace("fa-eye", "fa-eye-slash");
        }
    }
}

function showLoading(message) {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader';
        loader.innerHTML = `<div class="spinner"></div><h3 id="loaderMsg" style="margin-top:20px; font-weight:bold;">Loading...</h3>`;
        document.body.appendChild(loader);
    }
    document.getElementById('loaderMsg').innerText = message || "Processing...";
    loader.style.display = 'flex';
}

function hideLoading() {
    let loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

function openFullscreenImage(src) {
    let viewer = document.getElementById('fsImageViewer');
    if (!viewer) {
        viewer = document.createElement('div');
        viewer.id = 'fsImageViewer';
        viewer.className = 'fs-image-viewer';
        viewer.innerHTML = `<span class="fs-close" onclick="document.getElementById('fsImageViewer').style.display='none'">&times;</span><img id="fsImg">`;
        document.body.appendChild(viewer);
    }
    document.getElementById('fsImg').src = src;
    viewer.style.display = 'flex';
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    const greeting = document.getElementById("adminGreeting");
    if (greeting) {
        const storedName = localStorage.getItem("foundit_admin_name") || sessionStorage.getItem("foundit_admin_name") || "Admin";
        greeting.innerText = `Hello, ${storedName}!`;
    }

    if (document.getElementById("liveClock")) startLiveClock();
    
    // Auto-Load Tables
    if (document.getElementById("lostTableBody")) loadLostItems();
    if (document.getElementById("foundTableBody")) loadFoundItems(); 
    if (document.getElementById("matchTableBody")) loadMatches(); 
    if (document.getElementById("claimedTableBody")) loadClaimedItems(); 
    if (document.getElementById("archivedTableBody")) loadArchivedItems(); 
    if (document.getElementById("claimingTableBody")) loadClaimingItems();

    if (document.getElementById("founditChart")) {
        renderSidebarCalendar();
        initDashboardChartAndStats();
    }
    
    // Updated Password validation logic
    const passwordInput = document.getElementById('password') || document.getElementById('regPassword') || document.getElementById('newPassword'); 
    const confirmPasswordInput = document.getElementById('confirmPassword') || document.getElementById('confirmNewPassword');
    const matchMessage = document.getElementById('matchMessage');

    if (passwordInput && confirmPasswordInput && matchMessage) {
        // Target the outer box wrapper
        const confirmPassBox = confirmPasswordInput.closest('.input-box');

        const validatePasswordMatch = () => {
            const pass = passwordInput.value;
            const confirmPass = confirmPasswordInput.value;
            
            if (confirmPass === '') {
                matchMessage.textContent = '';
                if(confirmPassBox) confirmPassBox.style.borderColor = 'white';
                return;
            }
            
            if (pass === confirmPass) {
                matchMessage.textContent = 'Passwords match!';
                matchMessage.className = 'validation-text text-success';
                // Use the exact emerald green hex to match the top box
                if(confirmPassBox) confirmPassBox.style.borderColor = '#10b981'; 
            } else {
                matchMessage.textContent = 'Passwords do not match.';
                matchMessage.className = 'validation-text text-error';
                // Apply the red error border
                if(confirmPassBox) confirmPassBox.style.borderColor = '#ef4444'; 
            }
        };
        passwordInput.addEventListener('input', validatePasswordMatch);
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
});

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================
let isEmailValid = false;
let isPasswordStrong = false;

function checkEmailExists() {
    const emailInput = document.getElementById("regEmail").value.trim();
    const errorMsg = document.getElementById("emailErrorMsg");
    const successMsg = document.getElementById("emailSuccessMsg");
    const box = document.getElementById("regEmailBox");

    if (!errorMsg || !successMsg || !box) return;
    if (!emailInput.includes("@")) {
        errorMsg.style.display = "none";
        successMsg.style.display = "none";
        box.style.borderColor = "white";
        isEmailValid = false;
        return;
    }

    fetch(`${API_BASE}/api/items/admin/check-email?email=${encodeURIComponent(emailInput)}`, { headers: { "ngrok-skip-browser-warning": "69420" }})
    .then(res => res.text()).then(result => {
        if (result === "Taken") {
            box.style.borderColor = "#ef4444"; 
            errorMsg.style.display = "block";
            successMsg.style.display = "none";
            isEmailValid = false;
        } else {
            box.style.borderColor = "#10b981"; 
            errorMsg.style.display = "none";
            successMsg.style.display = "block";
            isEmailValid = true;
        }
    }).catch(err => console.error(err));
}

function checkPasswordStrength() {
    const pass = document.getElementById("regPassword").value;
    const msg = document.getElementById("passwordStrengthMsg");
    const box = document.getElementById("regPassBox");

    if (!msg || !box) return;
    if (pass.length === 0) {
        msg.style.display = "none";
        box.style.borderColor = "white";
        isPasswordStrong = false;
        return;
    }

    msg.style.display = "block";
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSymbols = /[^a-zA-Z0-9]/.test(pass); 
    const isLongEnough = pass.length >= 8;

    if (!isLongEnough) {
        box.style.borderColor = "#ef4444"; msg.style.color = "#ef4444";
        msg.innerText = "Password must be at least 8 characters."; isPasswordStrong = false;
    } else if (!hasLetters || !hasNumbers || !hasSymbols) {
        box.style.borderColor = "#f59e0b"; msg.style.color = "#f59e0b";
        msg.innerText = "Must contain letters, numbers, AND symbols."; isPasswordStrong = false;
    } else {
        box.style.borderColor = "#10b981"; msg.style.color = "#10b981";
        msg.innerText = "Strong password! Ready to go."; isPasswordStrong = true;
    }
}

function registerAccount() {
    const name = document.getElementById("regName").value.trim() || "Admin"; 
    const email = document.getElementById("regEmail").value.trim();
    const pass = document.getElementById("regPassword").value;
    const confirmPass = document.getElementById("confirmPassword").value;
    
    if (!email || !pass || !confirmPass) { showCustomAlert("Please fill out all required fields."); return; }
    if (!isEmailValid) { showCustomAlert("You cannot register. That email is already in use."); return; }
    if (pass !== confirmPass) { showCustomAlert("Passwords do not match!"); return; }
    if (!isPasswordStrong) { showCustomAlert("Your password is too weak."); return; }

    fetch(`${API_BASE}/api/items/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "ngrok-skip-browser-warning": "69420" },
        body: new URLSearchParams({ fullName: name, email: email, password: pass })
    }).then(res => res.text()).then(message => {
        if (message === "Success") openModal('registrationSuccessModal');
        else showCustomAlert(message);
    }).catch(error => showCustomAlert("An error occurred during registration."));
}

function attemptLogin() {
    const emailInput = document.getElementById("email").value;
    const passInput = document.getElementById("password").value;
    const rememberMe = document.getElementById("remember") ? document.getElementById("remember").checked : false;

    // Send credentials securely in the body, NOT the URL
    fetch(`${API_BASE}/api/items/admin/login`, {
        method: 'POST', 
        headers: { 
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: emailInput, password: passInput })
    })
    .then(res => res.text()) 
    .then(result => {
        if (result.startsWith("Success")) {
            let adminName = result.replace("Success", "").replace(",", "").replace("|", "").trim() || "Admin";
            
            const storage = rememberMe ? localStorage : sessionStorage;
            
            // Store a token identifier instead of a true/false boolean.
            // When you upgrade the backend to generate real JWTs, save that string here.
            storage.setItem("foundit_admin_token", "active_session_token"); 
            storage.setItem("foundit_admin_name", adminName); 
            
            window.location.href = "admin-dashboard.html"; 
        } else {
            document.getElementById("errorMsg").style.display = "block";
        }
    })
    .catch(err => {
        console.error("Login error:", err);
        document.getElementById("errorMsg").style.display = "block";
    });
}

function logoutAdmin() {
    // Clear the new token keys
    localStorage.removeItem("foundit_admin_token"); 
    localStorage.removeItem("foundit_admin_name"); 
    sessionStorage.removeItem("foundit_admin_token"); 
    sessionStorage.removeItem("foundit_admin_name"); 
    
    window.location.href = "admin-login.html"; 
}

// ==========================================
// FORGOT PASSWORD LOGIC
// ==========================================
let savedResetEmail = "";
let savedResetCode = "";
let isResetEmailValid = false;

function checkResetEmailLive() {
    const emailInput = document.getElementById("resetEmail").value.trim();
    const errorMsg = document.getElementById("resetEmailErrorMsg");
    const box = document.getElementById("resetEmailBox");

    if (!errorMsg || !box) return;

    if (!emailInput.includes("@")) {
        errorMsg.style.display = "none";
        box.style.borderColor = "white";
        isResetEmailValid = false;
        return;
    }

    fetch(`${API_BASE}/api/items/admin/check-email?email=${encodeURIComponent(emailInput)}`, { headers: { "ngrok-skip-browser-warning": "69420" }})
    .then(res => res.text())
    .then(result => {
        if (result === "Available") {
            box.style.borderColor = "#ef4444"; 
            errorMsg.style.display = "block";
            isResetEmailValid = false;
        } else {
            box.style.borderColor = "#10b981"; 
            errorMsg.style.display = "none";
            isResetEmailValid = true;
        }
    }).catch(err => console.error(err));
}

function requestOtp() {
    const email = document.getElementById("resetEmail").value;
    if (!email) { showCustomAlert("Please enter an email address first."); return; }
    if (!isResetEmailValid) { showCustomAlert("We cannot find an account with that email address."); return; }
    
    showLoading("Sending Emails...");
    fetch(`${API_BASE}/api/items/admin/request-otp?email=${encodeURIComponent(email)}`, { method: 'POST', headers: { "ngrok-skip-browser-warning": "69420" }})
    .then(res => res.text()).then(result => {
        hideLoading();
        if (result === "Success") { 
            savedResetEmail = email; 
            document.getElementById("page1-email").style.display = "none"; 
            document.getElementById("page2-code").style.display = "block"; 
            document.getElementById("resetSubtitle").innerText = "Enter Verification Code";
        } else {
            showCustomAlert(result);
        }
    });
}

function verifyOtp() {
    const code = document.getElementById("otpCode").value;
    if (code.length !== 6) { showCustomAlert("Code must be exactly 6 digits."); return; }
    
    fetch(`${API_BASE}/api/items/admin/verify-otp?email=${encodeURIComponent(savedResetEmail)}&code=${code}`, { method: 'POST', headers: { "ngrok-skip-browser-warning": "69420" }})
    .then(res => res.text()).then(result => {
        if (result === "Success") { 
            savedResetCode = code; 
            document.getElementById("page2-code").style.display = "none"; 
            document.getElementById("page3-password").style.display = "block"; 
            document.getElementById("resetSubtitle").innerText = "Create New Password";

            // --- ADD THIS LINE ---
            // This triggers the check immediately in case the browser auto-filled the password!
            checkResetPasswordLive(); 
            
        } else {
            showCustomAlert(result);
        }
    });
}

let isResetPasswordUniqueAndStrong = false;
function isStrongPassword(password) { return /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(password); }

function checkResetPasswordLive() {
    const newPass = document.getElementById("newPassword").value;
    const errorMsg = document.getElementById("passwordErrorMsg");
    const passBox = document.getElementById("newPassBox");

    if (newPass.length === 0) {
        passBox.style.borderColor = "white";
        errorMsg.style.display = "none";
        isResetPasswordUniqueAndStrong = false;
        return;
    }

    fetch(`${API_BASE}/api/items/admin/check-password-history?email=${encodeURIComponent(savedResetEmail)}&code=${savedResetCode}&newPassword=${encodeURIComponent(newPass)}`, { 
        method: 'POST', headers: { "ngrok-skip-browser-warning": "69420" }
    })
    .then(res => res.text())
    .then(result => {
        if (result === "Used") {
            passBox.style.borderColor = "#ef4444"; 
            errorMsg.style.color = "#ef4444"; 
            errorMsg.innerText = "This password was already used.";
            errorMsg.style.display = "block";
            isResetPasswordUniqueAndStrong = false;
        } else {
            if (!isStrongPassword(newPass)) {
                passBox.style.borderColor = "#f59e0b"; 
                errorMsg.style.color = "#f59e0b"; 
                errorMsg.innerText = "Too weak! Add letters, numbers, and symbols.";
                errorMsg.style.display = "block";
                isResetPasswordUniqueAndStrong = false;
            } else {
                passBox.style.borderColor = "#10b981"; 
                errorMsg.style.color = "#10b981"; 
                errorMsg.innerText = "Strong and available!";
                errorMsg.style.display = "block";
                isResetPasswordUniqueAndStrong = true;
            }
        }
    }).catch(err => console.error(err));

    checkConfirmPasswordLive();
}

function submitFinalPassword() {
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmNewPassword").value;

    if (newPass !== confirmPass) { showCustomAlert("Passwords do not match!"); return; }
    if (!isResetPasswordUniqueAndStrong) { showCustomAlert("Please resolve the password errors before submitting."); return; }
    
    fetch(`${API_BASE}/api/items/admin/apply-new-password?email=${encodeURIComponent(savedResetEmail)}&code=${savedResetCode}&newPassword=${encodeURIComponent(newPass)}`, { method: 'POST', headers: { "ngrok-skip-browser-warning": "69420" }})
    .then(res => res.text()).then(result => {
        if (result === "Success") {
            openModal('resetSuccessModal'); 
        } else {
            showCustomAlert(result);
        }
    });
}

function checkConfirmPasswordLive() {
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmNewPassword").value;
    const confirmBox = document.getElementById("confirmPassBox"); 
    const matchMsg = document.getElementById("confirmMatchMsg");

    if (!matchMsg || !confirmBox) return;

    // If the box is empty, reset everything back to white/hidden
    if (confirmPass.length === 0) {
        confirmBox.style.borderColor = "white";
        matchMsg.style.display = "none";
        return;
    }

    // Check if they match exactly
    if (newPass === confirmPass) {
        confirmBox.style.borderColor = "#10b981"; // Emerald green
        matchMsg.style.color = "#10b981";
        matchMsg.innerText = "Passwords match!";
        matchMsg.style.display = "block";
    } else {
        confirmBox.style.borderColor = "#ef4444"; // Error red
        matchMsg.style.color = "#ef4444";
        matchMsg.innerText = "Passwords do not match.";
        matchMsg.style.display = "block";
    }
}

// ==========================================
// DATA FETCHING & LIST RENDERERS
// ==========================================
function loadLostItems() {
    const tableBody = document.getElementById("lostTableBody");
    if (!tableBody) return;
    fetch(`${API_BASE}/api/items/lost`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(response => response.json())
        .then(data => {
            const activeItems = data.filter(item => item.status === "Unmatched");
            tableBody.innerHTML = ""; 
            if (activeItems.length === 0) { tableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>No active lost reports.</td></tr>"; return; }
            activeItems.forEach(item => {
                tableBody.innerHTML += `<tr>
                    <td style="font-weight: bold;">${item.lostId}</td>
                    <td>${item.studentName}</td>
                    <td>${item.category}</td>
                    <td>${item.color}</td>
                    <td>${item.dateLost}</td>
                    <td style="color: #f59e0b; font-weight: bold;">${item.status}</td>
                    <td><button onclick="viewDetails('${item.lostId}')" class="btn-action"><i class="fa-solid fa-eye"></i> View</button></td>
                </tr>`;
            });
        });
}

function loadFoundItems() {
    const tableBody = document.getElementById("foundTableBody");
    if (!tableBody) return;
    fetch(`${API_BASE}/api/items/found`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(response => response.json())
        .then(data => {
            const now = new Date();
            const activeItems = data.filter(item => {
                if (item.status !== "Unmatched") return false;
                let rawDate = item.dateSubmitted || item.dateFound;
                let submissionDate = Array.isArray(rawDate) ? new Date(rawDate[0], rawDate[1] - 1, rawDate[2]) : new Date(rawDate);
                return Math.ceil(Math.abs(now - submissionDate) / (1000 * 60 * 60 * 24)) <= 7; 
            });

            tableBody.innerHTML = ""; 
            if (activeItems.length === 0) { tableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>No active found reports.</td></tr>"; return; }
            activeItems.forEach(item => {
                tableBody.innerHTML += `<tr>
                    <td style="font-weight: bold;">${item.foundId}</td>
                    <td>${item.finderName}</td>
                    <td>${item.category}</td>
                    <td>${item.color}</td>
                    <td>${item.dateFound}</td>
                    <td style="color: #3b82f6; font-weight: bold;">${item.status}</td>
                    <td><button onclick="viewDetails('${item.foundId}')" class="btn-action"><i class="fa-solid fa-eye"></i> View</button></td>
                </tr>`;
            });
        });
}

function loadMatches() {
    const tableBody = document.getElementById("matchTableBody");
    if (!tableBody) return;
    fetch(`${API_BASE}/api/items/matches`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = ""; 
            const pendingMatches = data.filter(match => match.matchStatus && match.matchStatus.toLowerCase() === "pending");
            pendingMatches.sort((a, b) => b.confidenceScore - a.confidenceScore);
            if (pendingMatches.length === 0) { tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No automated matches found yet.</td></tr>`; return; }
            pendingMatches.forEach(match => {
                tableBody.innerHTML += `<tr>
                    <td><strong>${match.matchId}</strong></td>
                    <td><span style="color: #8c1515; font-weight: bold;">${match.lostId}</span></td>
                    <td><span style="color: #10b981; font-weight: bold;">${match.foundId}</span></td>
                    <td><span style="font-size: 13px; font-weight: bold;"><i class="fa-solid fa-circle-check" style="color: #10b981; margin-right: 5px;"></i>${match.confidenceScore}% Match</span></td>
                    <td><button class="btn-outline" onclick="reviewMatch('${match.matchId}', '${match.lostId}', '${match.foundId}')">Review Match</button></td>
                </tr>`;
            });
        });
}

function loadClaimedItems() {
    const tableBody = document.getElementById("claimedTableBody");
    if (!tableBody) return;
    fetch(`${API_BASE}/api/items/transactions`, { headers: { "ngrok-skip-browser-warning": "69420" } })
    .then(response => response.json())
    .then(data => {
        tableBody.innerHTML = ""; 
        if (data.length === 0) { tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No claimed items found.</td></tr>"; return; }
        data.forEach(txn => {
            let dateOnly = txn.dateClaimed ? txn.dateClaimed.split('T')[0] : "N/A";
            tableBody.innerHTML += `
                <tr>
                    <td style="font-weight: bold;">${txn.txnId}</td>
                    <td>${txn.matchId}</td>
                    <td>${txn.verificationMethod}</td>
                    <td>${dateOnly}</td>
                    <td style="color: #2e7d32; font-weight: bold;">Successfully Returned</td>
                    <td><button onclick="viewTransactionDetails('${txn.matchId}', '${txn.txnId}', '${txn.claimedBy}', '${txn.dateClaimed}')" class="btn-action"><i class="fa-solid fa-eye"></i> View</button></td>
                </tr>`;
        });
    });
}

function loadArchivedItems() {
    const tableBody = document.getElementById("archivedTableBody");
    if (!tableBody) return;
    
    fetch(`${API_BASE}/api/items/found`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = ""; 
            const now = new Date();
            const archivedItems = data.filter(item => {
                if (item.status === "Claimed") return false;
                let rawDate = item.dateSubmitted || item.dateFound;
                let submissionDate = Array.isArray(rawDate) ? new Date(rawDate[0], rawDate[1] - 1, rawDate[2]) : new Date(rawDate);
                const diffDays = Math.ceil(Math.abs(now - submissionDate) / (1000 * 60 * 60 * 24));
                item.daysInSystem = diffDays; 
                return diffDays > 7; 
            });
            
            if (archivedItems.length === 0) { tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No items currently archived.</td></tr>"; return; }
            archivedItems.forEach(item => {
                tableBody.innerHTML += `
                    <tr>
                        <td style="font-weight: bold;">${item.foundId}</td>
                        <td>${item.category}</td>
                        <td>${item.color}</td>
                        <td>${item.dateFound}</td>
                        <td style="color: #f59e0b; font-weight: bold;">${item.daysInSystem} Days</td>
                        <td style="color: #666; font-style: italic;">Archived</td>
                    </tr>`;
            });
        });
}

function loadClaimingItems() {
    const tbody = document.getElementById("claimingTableBody");
    if (!tbody) return;

    closeModal('dynamicSplitModal');

    fetch(`${API_BASE}/api/items/matches`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then(data => {
            const awaiting = data.filter(m => m.matchStatus === "Awaiting Claim");
            
            if(awaiting.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No items currently awaiting claim.</td></tr>`;
                return;
            }
            
            tbody.innerHTML = ""; 
            awaiting.forEach(match => {
                tbody.innerHTML += `<tr>
                    <td><strong>${match.matchId}</strong></td>
                    <td style="color:#8c1515; font-weight:bold; font-size:16px;" class="searchable-lost-id">${match.lostId}</td>
                    <td style="color:#10b981;">${match.foundId}</td>
                    <td><span style="background:#fef08a; color:#854d0e; padding:5px 10px; border-radius:15px; font-size:12px; font-weight:bold;">Awaiting Owner</span></td>
                    <td style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn-outline" onclick="reviewMatch('${match.matchId}', '${match.lostId}', '${match.foundId}')">View Details</button>
                        <button onclick="releaseItem('${match.matchId}')" style="background:#10b981; color:white; border:none; padding:8px 15px; border-radius:4px; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-check"></i> Release</button>
                    </td>
                </tr>`;
            });
        })
        .catch(err => console.error("Error loading claiming items:", err));
}

// Live Search Filter Function for the Claiming Dashboard
function filterClaimingTable() {
    const input = document.getElementById("searchInput") ? document.getElementById("searchInput").value.toUpperCase() : "";
    const tbody = document.getElementById("claimingTableBody");
    if (!tbody) return;

    const rows = tbody.getElementsByTagName("tr");
    for (let i = 0; i < rows.length; i++) {
        const lostIdCell = rows[i].getElementsByClassName("searchable-lost-id");
        if (lostIdCell) {
            const txtValue = lostIdCell.textContent || lostIdCell.innerText;
            rows[i].style.display = txtValue.toUpperCase().indexOf(input) > -1 ? "" : "none";
        }
    }
}

// ==========================================
// MODAL DETAILS & CAROUSELS
// ==========================================
function extractTypeAndDesc(rawText) {
    let text = String(rawText && rawText !== "null" ? rawText : "N/A");
    let itemType = "N/A";
    let cleanDesc = text;

    try {
        const match = text.match(/\[type:\s*(.*?)\]/i);
        if (match && match[1]) {
            itemType = match[1].trim(); 
            cleanDesc = text.replace(/\[type:\s*.*?\]/i, '').trim();
            if (!cleanDesc) cleanDesc = "None provided.";
        }
    } catch (e) { console.error("Extraction error:", e); }
    return { type: itemType, desc: cleanDesc };
}

function generateCarouselHTML(photoPathStr, prefix) {
    const photos = (photoPathStr && photoPathStr !== "null") ? photoPathStr.split(",") : ["no-image.jpg"];
    const carouselId = `carousel-${prefix}`;
    
    let html = `<div class="image-carousel" id="${carouselId}" data-index="0" style="position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; background: #f3f4f6; border-radius: 8px; padding: 10px; min-height: 180px; border: 1px solid #ddd;">`;
    
    if (photos.length > 1) {
        html += `<button type="button" onclick="moveCarousel('${carouselId}', -1)" style="position: absolute; left: 5px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-chevron-left"></i></button>`;
    }
    
    html += `<div style="width: 100%; text-align: center; overflow: hidden;">`;
    photos.forEach((photo, idx) => {
        let display = idx === 0 ? "block" : "none";
        html += `<img class="${carouselId}-img" src="${API_BASE}/api/items/images/${photo.trim()}?ngrok-skip-browser-warning=true" style="max-width: 100%; max-height: 200px; display: ${display}; margin: 0 auto; border-radius: 5px; cursor: pointer; object-fit: contain;" onclick="openFullscreenImage(this.src)" onerror="this.src='https://via.placeholder.com/300x200?text=No+Photo+Available';">`;
    });
    html += `</div>`;
    
    if (photos.length > 1) {
        html += `<button type="button" onclick="moveCarousel('${carouselId}', 1)" style="position: absolute; right: 5px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-chevron-right"></i></button>`;
        
        html += `<div style="position: absolute; bottom: 5px; display: flex; gap: 5px;">`;
        photos.forEach((_, idx) => {
            let color = idx === 0 ? "#8c1515" : "#ccc";
            html += `<span class="${carouselId}-dot" style="width: 8px; height: 8px; background: ${color}; border-radius: 50%; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.3);"></span>`;
        });
        html += `</div>`;
    }
    html += `</div>`;
    return html;
}

function moveCarousel(carouselId, direction) {
    const carousel = document.getElementById(carouselId);
    let currentIndex = parseInt(carousel.getAttribute('data-index'));
    const images = document.querySelectorAll(`.${carouselId}-img`);
    const dots = document.querySelectorAll(`.${carouselId}-dot`);
    
    images[currentIndex].style.display = 'none';
    if (dots.length > 0) dots[currentIndex].style.background = '#ccc';
    
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = images.length - 1;
    if (currentIndex >= images.length) currentIndex = 0;
    
    carousel.setAttribute('data-index', currentIndex);
    images[currentIndex].style.display = 'block';
    if (dots.length > 0) dots[currentIndex].style.background = '#8c1515';
}

function viewDetails(itemId) {
    const endpoint = itemId.startsWith("LST") ? "lost" : "found";
    fetch(`${API_BASE}/api/items/${endpoint}`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(response => response.json())
        .then(data => {
            const item = data.find(i => i.lostId === itemId || i.foundId === itemId);
            if (item) {
                document.getElementById("modalTitle").innerText = `Item Details: ${itemId}`;
                const photoPath = endpoint === "lost" ? item.referencePhotoPath : item.foundPhotoPath;
                const info = extractTypeAndDesc(item.nameOnItem || item.finderNotes);

                document.getElementById("modalContent").innerHTML = `
                    ${generateCarouselHTML(photoPath, itemId)}
                    <p><strong>Student:</strong> ${item.studentName || item.finderName} (${item.studentId || 'No ID'})</p>
                    <p><strong>Course & Section:</strong> ${item.courseSection || 'N/A'}</p>
                    <p><strong>Sex:</strong> ${item.sex || 'N/A'}</p>
                    <p><strong>Contact Email:</strong> ${item.contactInfo || 'N/A'}</p>
                    <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;">
                    <p><strong>Category:</strong> ${item.category || 'N/A'}</p>
                    <p><strong>Type:</strong> ${info.type}</p>
                    <p><strong>Brand/Model:</strong> ${item.brand || 'N/A'} ${item.model ? '- ' + item.model : ''}</p>
                    <p><strong>Color:</strong> ${item.color || 'N/A'}</p>
                    <p><strong>Description:</strong> ${info.desc}</p>
                    <p><strong>Location:</strong> ${item.location || 'N/A'}</p>
                    <p><strong>Date ${endpoint === 'lost' ? 'Lost' : 'Found'}:</strong> ${parseSpringDate(item.dateLost || item.dateFound)}</p>
                    ${endpoint === 'lost' ? `<p><strong>Security Proof:</strong> ${item.distinctiveFeature || 'N/A'}</p>` : ''}
                `;
                openModal('dynamicFoundModal'); 
            }
        })
        .catch(error => console.error("Error fetching details:", error));
}

let currentMatchId = ""; 

function reviewMatch(matchId, lostId, foundId) {
    currentMatchId = matchId;
    document.getElementById("splitModalTitle").innerText = `Review Match: ${matchId}`;

    document.getElementById("lostItemDetails").innerHTML = "Loading...";
    document.getElementById("foundItemDetails").innerHTML = "Loading...";

    fetch(`${API_BASE}/api/items/lost`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(response => response.json())
        .then(data => {
            const lostItem = data.find(i => i.lostId === lostId);
            if (lostItem) {
                const info = extractTypeAndDesc(lostItem.nameOnItem);
                document.getElementById("lostItemDetails").innerHTML = `
                    ${generateCarouselHTML(lostItem.referencePhotoPath, 'rev-lost-' + lostItem.lostId)}
                    <p><strong>Ref ID:</strong> <span style="color: #8c1515; font-weight: bold;">${lostItem.lostId}</span></p>
                    <p><strong>Student:</strong> ${lostItem.studentName || 'Unknown'} (${lostItem.studentId || 'No ID'})</p>
                    <p><strong>Course:</strong> ${lostItem.courseSection || 'N/A'}</p>
                    <p><strong>Sex:</strong> ${lostItem.sex || 'N/A'}</p>
                    <p><strong>Category:</strong> ${lostItem.category || 'N/A'}</p>
                    <p><strong>Type:</strong> ${info.type}</p>
                    <p><strong>Brand/Model:</strong> ${lostItem.brand || 'N/A'} ${lostItem.model ? '- ' + lostItem.model : ''}</p>
                    <p><strong>Color:</strong> ${lostItem.color || 'N/A'}</p>
                    <p><strong>Description:</strong> ${info.desc}</p>
                    <p><strong>Location:</strong> ${lostItem.location || 'N/A'}</p>
                    <p><strong>Date Lost:</strong> ${parseSpringDate(lostItem.dateLost)}</p>
                    <p><strong>Security Proof:</strong> ${lostItem.distinctiveFeature || 'None'}</p>
                `;
            } else { document.getElementById("lostItemDetails").innerHTML = "<p style='color:red;'>Item not found.</p>"; }
        }).catch(err => { document.getElementById("lostItemDetails").innerHTML = "<p style='color:red;'>Failed to load Lost Item.</p>"; });

    fetch(`${API_BASE}/api/items/found`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(response => response.json())
        .then(data => {
            const foundItem = data.find(i => i.foundId === foundId);
            if (foundItem) {
                const info = extractTypeAndDesc(foundItem.finderNotes);
                document.getElementById("foundItemDetails").innerHTML = `
                    ${generateCarouselHTML(foundItem.foundPhotoPath, 'rev-found-' + foundItem.foundId)}
                    <p><strong>Ref ID:</strong> <span style="color: #10b981; font-weight: bold;">${foundItem.foundId}</span></p>
                    <p><strong>Finder:</strong> ${foundItem.finderName || 'Unknown'} (${foundItem.studentId || 'No ID'})</p>
                    <p><strong>Course:</strong> ${foundItem.courseSection || 'N/A'}</p>
                    <p><strong>Sex:</strong> ${foundItem.sex || 'N/A'}</p>
                    <p><strong>Category:</strong> ${foundItem.category || 'N/A'}</p>
                    <p><strong>Type:</strong> ${info.type}</p>
                    <p><strong>Brand/Model:</strong> ${foundItem.brand || 'N/A'} ${foundItem.model ? '- ' + foundItem.model : ''}</p>
                    <p><strong>Color:</strong> ${foundItem.color || 'N/A'}</p>
                    <p><strong>Description:</strong> ${info.desc}</p>
                    <p><strong>Location:</strong> ${foundItem.location || 'N/A'}</p>
                    <p><strong>Date Found:</strong> ${parseSpringDate(foundItem.dateFound)}</p>
                `;
            } else { document.getElementById("foundItemDetails").innerHTML = "<p style='color:red;'>Item not found.</p>"; }
        }).catch(err => { document.getElementById("foundItemDetails").innerHTML = "<p style='color:red;'>Failed to load Found Item.</p>"; });
        
    openModal('dynamicSplitModal');
}

function viewTransactionDetails(matchId, txnId, claimedBy, dateClaimed) {
    document.getElementById("txnModalTitle").innerText = `Transaction Details: ${txnId}`;
    document.getElementById("txnClaimedBy").innerText = claimedBy || "Unknown";
    document.getElementById("txnDate").innerText = parseSpringDate(dateClaimed);

    document.getElementById("txnLostDetails").innerHTML = "Loading...";
    document.getElementById("txnFoundDetails").innerHTML = "Loading...";
    openModal('transactionDetailsModal');

    fetch(`${API_BASE}/api/items/matches`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then(matches => {
            const match = matches.find(m => m.matchId === matchId);
            if (match) {
                // FETCH LOST ITEM
                fetch(`${API_BASE}/api/items/lost`, { headers: { "ngrok-skip-browser-warning": "69420" } })
                    .then(res => res.json())
                    .then(lostData => {
                        const lostItem = lostData.find(i => i.lostId === match.lostId);
                        if (lostItem) {
                            const info = extractTypeAndDesc(lostItem.nameOnItem);
                            document.getElementById("txnLostDetails").innerHTML = `
                                ${generateCarouselHTML(lostItem.referencePhotoPath, 'txn-lost-' + lostItem.lostId)}
                                <p><strong>Ref ID:</strong> <span style="color: #8c1515; font-weight: bold;">${lostItem.lostId}</span></p>
                                <p><strong>Student:</strong> ${lostItem.studentName || 'Unknown'} (${lostItem.studentId || 'No ID'})</p>
                                <p><strong>Course:</strong> ${lostItem.courseSection || 'N/A'}</p>
                                <p><strong>Category:</strong> ${lostItem.category || 'N/A'}</p>
                                <p><strong>Type:</strong> ${info.type}</p>
                                <p><strong>Brand/Model:</strong> ${lostItem.brand || 'N/A'} ${lostItem.model ? '- ' + lostItem.model : ''}</p>
                                <p><strong>Color:</strong> ${lostItem.color || 'N/A'}</p>
                                <p><strong>Description:</strong> ${info.desc}</p>
                                <p><strong>Location:</strong> ${lostItem.location || 'N/A'}</p>
                                <p><strong>Date Lost:</strong> ${parseSpringDate(lostItem.dateLost)}</p>
                            `;
                        } else { document.getElementById("txnLostDetails").innerHTML = "<p style='color:red;'>Lost item not found.</p>"; }
                    });
                
                // FETCH FOUND ITEM
                fetch(`${API_BASE}/api/items/found`, { headers: { "ngrok-skip-browser-warning": "69420" } })
                    .then(res => res.json())
                    .then(foundData => {
                        const foundItem = foundData.find(i => i.foundId === match.foundId);
                        if (foundItem) {
                            const info = extractTypeAndDesc(foundItem.finderNotes);
                            document.getElementById("txnFoundDetails").innerHTML = `
                                ${generateCarouselHTML(foundItem.foundPhotoPath, 'txn-found-' + foundItem.foundId)}
                                <p><strong>Ref ID:</strong> <span style="color: #10b981; font-weight: bold;">${foundItem.foundId}</span></p>
                                <p><strong>Finder:</strong> ${foundItem.finderName || 'Unknown'} (${foundItem.studentId || 'No ID'})</p>
                                <p><strong>Course:</strong> ${foundItem.courseSection || 'N/A'}</p>
                                <p><strong>Category:</strong> ${foundItem.category || 'N/A'}</p>
                                <p><strong>Type:</strong> ${info.type}</p>
                                <p><strong>Brand/Model:</strong> ${foundItem.brand || 'N/A'} ${foundItem.model ? '- ' + foundItem.model : ''}</p>
                                <p><strong>Color:</strong> ${foundItem.color || 'N/A'}</p>
                                <p><strong>Description:</strong> ${info.desc}</p>
                                <p><strong>Location:</strong> ${foundItem.location || 'N/A'}</p>
                                <p><strong>Date Found:</strong> ${parseSpringDate(foundItem.dateFound)}</p>
                            `; 
                        } else { document.getElementById("txnFoundDetails").innerHTML = "<p style='color:red;'>Found item not found.</p>"; }
                    });
            } else {
                document.getElementById("txnLostDetails").innerHTML = "<p style='color:red;'>Match record missing.</p>";
                document.getElementById("txnFoundDetails").innerHTML = "<p style='color:red;'>Match record missing.</p>";
            }
        });
}

function confirmMatch() {
    showLoading("Sending Emails...");
    fetch(`${API_BASE}/api/items/matches/${currentMatchId}/confirm`, {
        method: "POST" // Removed unnecessary ngrok header
    })
    .then(response => response.text())
    .then(message => {
        hideLoading();
        if (message === "Success") {
            closeModal('dynamicSplitModal');
            // Use your dynamic success alert instead of a hardcoded HTML modal
            showCustomAlert("Match Confirmed! Items are marked 'Ready to Claim' and emails have been sent.", "success");
            loadMatches(); // Refresh the table
        } else {
            showCustomAlert("Error confirming match.", "error");
        }
    })
    .catch(err => {
        hideLoading();
        showCustomAlert("Network error while confirming match.", "error");
    });
}

function rejectMatch() { 
    showLoading("Rejecting Match...");
    fetch(`${API_BASE}/api/items/matches/${currentMatchId}/reject`, { 
        method: "POST" 
    })
    .then(() => { 
        hideLoading();
        closeModal('dynamicSplitModal'); 
        showCustomAlert("Match Rejected successfully.", "success"); 
        loadMatches(); 
    })
    .catch(err => {
        hideLoading();
        showCustomAlert("Network error while rejecting match.", "error");
    });
}

function triggerReleaseFromModal() {
    if (currentMatchId) {
        closeModal('dynamicSplitModal');
        releaseItem(currentMatchId);
    }
}

let matchIdToRelease = ""; 

function releaseItem(matchId) {
    matchIdToRelease = matchId;
    openModal('releaseConfirmModal');
}

function executeRelease() {
    closeModal('releaseConfirmModal');
    showLoading("Logging Transaction...");
    
    fetch(`${API_BASE}/api/items/matches/${matchIdToRelease}/release`, { 
        method: "POST"
    })
    .then(res => res.text())
    .then(msg => {
        hideLoading();
        if (msg === "Success") {
            showCustomAlert("Item successfully released and logged to Claimed Items!", "success");
            if (document.getElementById("claimingTableBody")) {
                loadClaimingItems(); // Refresh the table
            }
        } else {
            showCustomAlert("Error releasing item: " + msg);
        }
    })
    .catch(err => {
        hideLoading();
        console.error("Release Item Error:", err);
        showCustomAlert("Network error. Please check your connection.");
    });
}

// ==========================================
// DASHBOARD UI LOGIC (Bar Chart & Countdowns)
// ==========================================
function startLiveClock() {
    const clockElement = document.getElementById("liveClock");
    if (!clockElement) return; 
    
    setInterval(() => {
        const now = new Date();
        let hours = now.getHours();
        let minutes = String(now.getMinutes()).padStart(2, '0');
        let ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; 
        hours = String(hours).padStart(2, '0');
        
        clockElement.innerText = `${hours}:${minutes} ${ampm}`;
    }, 1000);
}

function renderSidebarCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById("calMonthYear").innerText = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let calBody = document.getElementById("calBody");
    calBody.innerHTML = "";
    
    let date = 1;
    for (let i = 0; i < 6; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < 7; j++) {
            let cell = document.createElement("td");
            if (i === 0 && j < firstDay) { cell.innerText = ""; } 
            else if (date > daysInMonth) { break; } 
            else {
                cell.innerText = date;
                if (date === today.getDate()) cell.classList.add("today");
                date++;
            }
            row.appendChild(cell);
        }
        calBody.appendChild(row);
    }
}

let dashboardChartInstance = null; 

function initDashboardChartAndStats() {
    Promise.all([
        fetch(`${API_BASE}/api/items/lost`, { headers: { "ngrok-skip-browser-warning": "69420" } }).then(res => res.json()),
        fetch(`${API_BASE}/api/items/found`, { headers: { "ngrok-skip-browser-warning": "69420" } }).then(res => res.json()),
        fetch(`${API_BASE}/api/items/transactions`, { headers: { "ngrok-skip-browser-warning": "69420" } }).then(res => res.json())
    ]).then(([lostData, foundData, txnData]) => {
        
        const now = new Date();
        const filterElement = document.getElementById("statFilter");
        const filter = filterElement ? filterElement.value : "all";

        const getValidDate = (rawDate) => {
            if (!rawDate) return new Date();
            if (Array.isArray(rawDate)) return new Date(rawDate[0], rawDate[1] - 1, rawDate[2]);
            return new Date(rawDate);
        };

        const isWithinFilter = (dateObj) => {
            const itemDate = getValidDate(dateObj);
            if (filter === "all") return true;
            if (filter === "today") return itemDate.toDateString() === now.toDateString();
            if (filter === "month") return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
            if (filter === "week") {
                const diff = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1); 
                const startOfWeek = new Date(now.setDate(diff));
                return itemDate >= startOfWeek;
            }
            return true;
        };

        const statLost = document.getElementById("statLost");
        if (statLost) statLost.innerText = lostData.filter(item => item.status === "Unmatched" && isWithinFilter(item.dateSubmitted || item.dateLost)).length;
        
        const statFound = document.getElementById("statFound");
        if (statFound) statFound.innerText = foundData.filter(item => item.status === "Unmatched" && isWithinFilter(item.dateSubmitted || item.dateFound)).length;
        
        const statClaimed = document.getElementById("statClaimed");
        if (statClaimed) statClaimed.innerText = txnData.filter(txn => isWithinFilter(txn.dateClaimed)).length;

        const renderTable = (data, elementId, isClaimed = false) => {
            const tbody = document.getElementById(elementId);
            if (!tbody) return;
            tbody.innerHTML = "";
            
            let activeData = isClaimed ? data : data.filter(item => item.status === "Unmatched");
            activeData.sort((a, b) => getValidDate(b.dateSubmitted || b.dateClaimed || b.dateLost || b.dateFound) - getValidDate(a.dateSubmitted || a.dateClaimed || a.dateLost || a.dateFound));
            
            activeData.slice(0, 4).forEach(item => {
                const itemDate = getValidDate(item.dateSubmitted || item.dateClaimed || item.dateLost || item.dateFound);
                const formattedDate = `${String(itemDate.getMonth() + 1).padStart(2, '0')}/${String(itemDate.getDate()).padStart(2, '0')}/${String(itemDate.getFullYear()).slice(-2)}`;
                
                if (isClaimed) {
                    tbody.innerHTML += `<tr><td>${formattedDate}</td><td class="right-align" style="color: #10b981;">Claimed</td></tr>`;
                } else {
                    const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
                    let daysLeft = 14 - diffDays;
                    if (daysLeft < 0) daysLeft = 0;
                    const textColor = elementId.includes("Lost") ? "#c62828" : "#0284c7";
                    tbody.innerHTML += `<tr><td>${formattedDate}</td><td class="right-align" style="color: ${textColor};">${daysLeft} DAYS</td></tr>`;
                }
            });

            if(activeData.length === 0) { tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;">No data available</td></tr>`; }
        };

        renderTable(lostData, "sideTableLost", false);
        renderTable(foundData, "sideTableFound", false);
        renderTable(txnData, "sideTableClaimed", true);

        const canvas = document.getElementById('founditChart');
        if (canvas) {
            const monthNames = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
            let monthlyStats = {};

            for(let i = 2; i >= 0; i--) {
                let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                monthlyStats[monthNames[d.getMonth()]] = { lost: 0, found: 0, claimed: 0 };
            }

            const aggregateData = (dataArray, typeKey, fallbackKey) => {
                dataArray.forEach(item => {
                    let d = getValidDate(item.dateSubmitted || item[fallbackKey]);
                    let mName = monthNames[d.getMonth()];
                    if (monthlyStats[mName] !== undefined) {
                        monthlyStats[mName][typeKey]++;
                    }
                });
            };

            aggregateData(lostData, 'lost', 'dateLost');
            aggregateData(foundData, 'found', 'dateFound');
            aggregateData(txnData, 'claimed', 'dateClaimed');

            const labels = Object.keys(monthlyStats);
            const lostCounts = labels.map(m => monthlyStats[m].lost);
            const foundCounts = labels.map(m => monthlyStats[m].found);
            const claimedCounts = labels.map(m => monthlyStats[m].claimed);

            const ctx = canvas.getContext('2d');
            if(dashboardChartInstance) dashboardChartInstance.destroy();

            dashboardChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Lost Items', data: lostCounts, backgroundColor: '#c62828' },
                        { label: 'Found Items', data: foundCounts, backgroundColor: '#7dd3fc' },
                        { label: 'Items Claimed', data: claimedCounts, backgroundColor: '#10b981' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } },
                    scales: { y: { beginAtZero: true, suggestedMax: 10 } }
                }
            });
        }

    }).catch(err => console.error("Error loading dashboard UI:", err));
}

function updateDashboardStats() {
    if (document.getElementById("founditChart")) {
        initDashboardChartAndStats();
    }
}

// ==========================================
// EXPORTING TO EXCEL
// ==========================================
async function executeQuickExport() {
    if (typeof XLSX === 'undefined') {
        showCustomAlert("Export library is missing. Make sure xlsx.full.min.js is loaded.");
        return;
    }
    showLoading("Generating Excel File...");
    try {
        const [lostResponse, foundResponse] = await Promise.all([
            fetch(`${API_BASE}/api/items/lost`, { headers: { "ngrok-skip-browser-warning": "69420" } }),
            fetch(`${API_BASE}/api/items/found`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        ]);
        const lostData = await lostResponse.json();
        const foundData = await foundResponse.json();
        let combinedData = [];
        const exportDate = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

        lostData.forEach(item => {
            combinedData.push({
                "Name": item.studentName || 'Unknown',
                "Section": item.courseSection || 'N/A',
                "Student Number": item.studentId || 'N/A',
                "Sex": item.sex || 'N/A',
                "Purpose": "Lost Item Ticket",
                "Date Submitted": parseSpringDate(item.dateSubmitted || item.dateLost),
                "Export Date": exportDate 
            });
        });
        foundData.forEach(item => {
            combinedData.push({
                "Name": item.finderName || 'Unknown',
                "Section": item.courseSection || 'N/A',
                "Student Number": item.studentId || 'N/A',
                "Sex": item.sex || 'N/A',
                "Purpose": "Found Item Ticket",
                "Date Submitted": parseSpringDate(item.dateSubmitted || item.dateFound),
                "Export Date": exportDate 
            });
        });

        if (combinedData.length === 0) { hideLoading(); showCustomAlert("No records found to export."); return; }

        let worksheet = XLSX.utils.json_to_sheet(combinedData);
        let workbook = XLSX.utils.book_new();
        worksheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, worksheet, "All OSAD Tickets");
        XLSX.writeFile(workbook, "OSAD_General_Tickets.xlsx");
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error("Export Error:", error);
        showCustomAlert("An error occurred while generating the Excel file.");
    }
}