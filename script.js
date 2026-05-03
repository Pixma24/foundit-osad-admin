// ==========================================
// ENVIRONMENT SETUP
// ==========================================
const API_BASE = "https://foundit-backend-qgsb.onrender.com";

function parseSpringDate(date) {
    if (!date || date === "N/A" || date === "null") {
        return "Not submitted";
    }

    try {
        // Handle Spring Boot Arrays like
        if (Array.isArray(date)) {
            return new Date(date[0], date[1] - 1, date[2]).toLocaleDateString('en-PH', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return "Not submitted";

        return d.toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) {
        return "Not submitted";
    }
}

// ==========================================
// 1. SYSTEM UI & MODALS (Dedicated Error UI)
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

    // Switch the icon and color based on the alert type
    if (type === "success") {
        icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        icon.style.color = '#10b981'; // Green
    } else {
        icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        icon.style.color = '#ef4444'; // Red
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

function togglePassword() {
    const passwordInput = document.getElementById("password");
    const icon = document.querySelector(".toggle-password");
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

function toggleRegPassword(icon) {
    const passwordInput = document.getElementById("regPassword");
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

function toggleResetPassword(icon) {
    const passwordInput = document.getElementById("newPassword") || document.getElementById("resetPassword");
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

function closeTransactionModal() {
    closeModal('transactionSuccessModal');
    if (typeof loadMatches === "function") {
        loadMatches();
    }
}

// ==========================================
// 2. INITIALIZATION, CLOCK, & RESTRICTIONS
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    const greeting = document.getElementById("adminGreeting");
    if (greeting) {
        const storedName = localStorage.getItem("foundit_admin_name") || sessionStorage.getItem("foundit_admin_name") || "Admin";
        greeting.innerText = `Hello, ${storedName}!`;
    }

    if (document.getElementById("liveClock")) {
        startLiveClock();
    }
    
    // Auto-Load Tables
    if (document.getElementById("lostTableBody")) loadLostItems();
    if (document.getElementById("foundTableBody")) loadFoundItems(); 
    if (document.getElementById("matchTableBody")) loadMatches(); 
    if (document.getElementById("claimedTableBody")) loadClaimedItems(); 
    if (document.getElementById("archivedTableBody")) loadArchivedItems(); 
    if (document.getElementById("claimingTableBody")) loadClaimingItems();

    // Setup the new Dashboard Charts and Countdowns
    if (document.getElementById("founditChart")) {
        renderSidebarCalendar();
        initDashboardChartAndStats();
    }

    // Calendar Lock (Max: Today, Min: 1 Month Ago)
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const pastDate = new Date();
    pastDate.setMonth(today.getMonth() - 1);
    const formattedPastLimit = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;

    ['dateLost', 'dateFound'].forEach(id => {
        const dateInput = document.getElementById(id);
        if (dateInput) {
            dateInput.setAttribute("max", formattedToday);
            dateInput.setAttribute("min", formattedPastLimit);
            dateInput.addEventListener("change", function() {
                if (this.value > formattedToday) {
                    showCustomAlert("You cannot select a date in the future.");
                    this.value = "";
                } else if (this.value !== "" && this.value < formattedPastLimit) {
                    showCustomAlert("You can only report items from within the last 1 month.");
                    this.value = "";
                }
            });
        }
    });

    const studentIdInput = document.getElementById("studentId");
    if (studentIdInput) {
        studentIdInput.addEventListener('input', function() { 
            this.value = this.value.replace(/[^0-9]/g, ''); 
            validateStudentId(); 
        });
    }

    ['studentName', 'finderName'].forEach(id => {
        const nameInput = document.getElementById(id);
        if (nameInput) {
            nameInput.addEventListener('input', function() { 
                this.value = this.value.replace(/[^a-zA-Z\s]/g, ''); 
            });
        }
    });

    const emailInput = document.getElementById("email");
    if (emailInput) {
        emailInput.addEventListener('input', validateEmailField);
    }
});

function validateStudentId() {
    const input = document.getElementById("studentId");
    const errorMsg = document.getElementById("studentIdError");
    if (input && input.value.length !== 10 && input.value.length > 0) {
        input.style.borderColor = "red"; 
        if(errorMsg) errorMsg.style.display = "block";
        return false;
    } else if (input && input.value.length === 10) {
        input.style.borderColor = "#10b981"; 
        if(errorMsg) errorMsg.style.display = "none";
        return true;
    }
    return false;
}

function validateEmailField() {
    const input = document.getElementById("email");
    const errorMsg = document.getElementById("emailError");
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (input && input.value.length > 0 && !regex.test(input.value)) {
        input.style.borderColor = "red"; 
        if(errorMsg) errorMsg.style.display = "block";
        return false;
    } else if (input && regex.test(input.value)) {
        input.style.borderColor = "#10b981"; 
        if(errorMsg) errorMsg.style.display = "none";
        return true;
    }
    return false;
}

// ==========================================
// 3. DYNAMIC CATEGORY UI
// ==========================================
function toggleCategoryFields() {
    const category = document.getElementById("category").value;
    const container = document.getElementById("dynamicFieldsContainer");
    
    if (!category) { 
        container.style.display = "none"; 
        container.innerHTML = ""; 
        return; 
    }

    container.style.display = "block";
    if (category === "Electronics") {
        container.innerHTML = `
            <div class="input-group" style="margin-bottom: 10px;">
                <label style="display: block; font-weight: bold; color: black; font-size: 14px;">What kind of electronics?</label>
                <input type="text" id="specificType" placeholder="e.g. Phone, Headphone, Powerbank" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: black; background: white;">
            </div>
            <div style="display: flex; gap: 15px;">
                <div class="input-group" style="flex: 1;">
                    <label style="display: block; font-weight: bold; color: black; font-size: 14px;">Brand (if known):</label>
                    <input type="text" id="brand" placeholder="e.g. Apple" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: black; background: white;">
                </div>
                <div class="input-group" style="flex: 1;">
                    <label style="display: block; font-weight: bold; color: black; font-size: 14px;">Model (if known):</label>
                    <input type="text" id="model" placeholder="e.g. iPhone 13" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: black; background: white;">
                </div>
            </div>`;
    } else if (category === "Personal Items") {
        container.innerHTML = `
            <div class="input-group">
                <label style="display: block; font-weight: bold; color: black; font-size: 14px;">What kind of personal item?</label>
                <input type="text" id="specificType" placeholder="e.g. Wallet, Umbrella, Tumbler" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: black; background: white;">
            </div>`;
    } else if (category === "Documents/IDs") {
        container.innerHTML = `
            <div class="input-group">
                <label style="display: block; font-weight: bold; color: black; font-size: 14px;">What kind of Document or ID?</label>
                <input type="text" id="specificType" placeholder="e.g. Student ID, Driver's License, Notebook" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: black; background: white;">
            </div>`;
    } else if (category === "Others") {
        container.innerHTML = `
            <div class="input-group">
                <label style="display: block; font-weight: bold; color: black; font-size: 14px;">Specify the Item:</label>
                <input type="text" id="specificType" placeholder="What exactly is the item?" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; color: black; background: white;">
            </div>`;
    }
}

// ==========================================
// 4. SUBMISSION MODULE (POST)
// ==========================================
async function submitLostReport() {
    const studentId = document.getElementById("studentId") ? document.getElementById("studentId").value.trim() : "";
    const studentName = document.getElementById("studentName") ? document.getElementById("studentName").value.trim() : "";
    const courseSection = document.getElementById("courseSection") ? document.getElementById("courseSection").value.trim() : "";
    const email = document.getElementById("email") ? document.getElementById("email").value.trim() : "";
    const dateInput = document.getElementById("dateLost") ? document.getElementById("dateLost").value : "";
    const location = document.getElementById("location") ? document.getElementById("location").value.trim() : "";
    const category = document.getElementById("category") ? document.getElementById("category").value : "";
    const color = document.getElementById("color") ? document.getElementById("color").value.trim() : "";
    const securityProof = document.getElementById("securityProof") ? document.getElementById("securityProof").value.trim() : "";

    if (!studentId || !studentName || !courseSection || !email || !dateInput || !location || !category || !color || !securityProof) {
        showCustomAlert("Submission Failed: Please ensure ALL required fields are filled out before submitting.");
        return;
    }

    if (!validateStudentId() || !validateEmailField()) {
        showCustomAlert("Please fix the errors in your Student Number or Email Address. Student number must be exactly 10 digits.");
        return;
    }

    const photoInput = document.getElementById("lostPhoto");
    // --- UPDATED LOST PHOTO UPLOAD LOGIC ---
    let savedFileNames = [];

    if (currentSelectedFiles.length > 0) { // Check our array instead of photoInput
        for (let i = 0; i < currentSelectedFiles.length; i++) {
            const file = currentSelectedFiles[i];
            const fileData = new FormData();
            fileData.append("file", file);
            
            try {
                const uploadResponse = await fetch(`${API_BASE}/api/items/upload-image`, {
                    method: "POST", headers: { "ngrok-skip-browser-warning": "69420" }, body: fileData
                });
                if (uploadResponse.ok) {
                    const uploadedName = await uploadResponse.text();
                    savedFileNames.push(uploadedName); 
                }
            } catch (error) { console.error("Image upload failed:", error); }
        }
    }
    
    // Join the filenames with a comma, or use default
    let finalPhotoStr = savedFileNames.length > 0 ? savedFileNames.join(",") : "no-image.jpg";

    let finalDesc = document.getElementById("description").value || "";
    let specificType = document.getElementById("specificType") ? document.getElementById("specificType").value : "";
    if (specificType) finalDesc = `[Type: ${specificType}] ` + finalDesc;

    const randomId = "LST-" + Math.floor(1000 + Math.random() * 9000);
    const reportData = {
        lostId: randomId,
        studentId: studentId,
        studentName: studentName,
        courseSection: courseSection,
        contactInfo: email,
        category: category,
        brand: document.getElementById("brand") ? document.getElementById("brand").value : "",
        model: document.getElementById("model") ? document.getElementById("model").value : "",
        color: color,
        location: location,
        dateLost: dateInput,
        nameOnItem: finalDesc, 
        distinctiveFeature: securityProof,
        referencePhotoPath: finalPhotoStr,
        status: "Unmatched"
    };

    fetch(`${API_BASE}/api/items/lost`, {
        method: "POST", headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify(reportData)
    }).then(response => {
        if (response.ok) {
            document.getElementById("displayTicketId").innerText = randomId;
            openModal('successModal');
            currentSelectedFiles = []; // Clear array on success
            document.querySelector("form").reset();
            document.getElementById("dynamicFieldsContainer").style.display = "none";
            renderFilePreview(); // <--- ADD THIS LINE HERE TOO!
        } else {
            showCustomAlert("Error: Server rejected the data.");
        }
    });
}

async function submitFoundReport() {
    const studentId = document.getElementById("studentId") ? document.getElementById("studentId").value.trim() : "";
    const finderName = document.getElementById("finderName") ? document.getElementById("finderName").value.trim() : "";
    const courseSection = document.getElementById("courseSection") ? document.getElementById("courseSection").value.trim() : "";
    const email = document.getElementById("email") ? document.getElementById("email").value.trim() : "";
    const dateInput = document.getElementById("dateFound") ? document.getElementById("dateFound").value : "";
    const location = document.getElementById("location") ? document.getElementById("location").value.trim() : "";
    const category = document.getElementById("category") ? document.getElementById("category").value : "";
    const color = document.getElementById("color") ? document.getElementById("color").value.trim() : "";

    // BUG 1 FIXED: Removed securityProof from this check
    if (!studentId || !finderName || !courseSection || !email || !dateInput || !location || !category || !color) {
        showCustomAlert("Submission Failed: Please ensure ALL required fields are filled out before submitting.");
        return;
    }
    
    // BUG 2 FIXED: Checking our custom array instead of the native photo input
    if (currentSelectedFiles.length === 0) {
        showCustomAlert("Submission Failed: You MUST upload a reference photo for a found item.");
        return;
    }

    if (!validateStudentId() || !validateEmailField()) {
        showCustomAlert("Please fix the errors in your Student Number or Email Address. Student number must be exactly 10 digits.");
        return;
    }

    // --- UPDATED FOUND PHOTO UPLOAD LOGIC ---
    let savedFileNames = [];

    for (let i = 0; i < currentSelectedFiles.length; i++) {
        const file = currentSelectedFiles[i];
        const fileData = new FormData();
        fileData.append("file", file);
        
        try {
            const uploadResponse = await fetch(`${API_BASE}/api/items/upload-image`, {
                method: "POST", headers: { "ngrok-skip-browser-warning": "69420" }, body: fileData
            });
            if (uploadResponse.ok) {
                const uploadedName = await uploadResponse.text();
                savedFileNames.push(uploadedName); 
            }
        } catch (error) { console.error("Image upload failed:", error); }
    }
    
    // Join the filenames with a comma, or use default
    let finalPhotoStr = savedFileNames.length > 0 ? savedFileNames.join(",") : "no-image.jpg";

    let finalDesc = document.getElementById("description").value || "";
    let specificType = document.getElementById("specificType") ? document.getElementById("specificType").value : "";
    if (specificType) finalDesc = `[Type: ${specificType}] ` + finalDesc;

    const randomId = "FND-" + Math.floor(1000 + Math.random() * 9000);
    const reportData = {
        foundId: randomId,
        studentId: studentId,
        finderName: finderName,
        courseSection: courseSection,
        contactInfo: email,
        category: category,
        brand: document.getElementById("brand") ? document.getElementById("brand").value : "",
        model: document.getElementById("model") ? document.getElementById("model").value : "",
        color: color,
        location: location,
        dateFound: dateInput,
        finderNotes: finalDesc,
        distinctiveFeature: "", // Left blank intentionally for Found Items
        foundPhotoPath: finalPhotoStr, 
        status: "Unmatched"
    };

    fetch(`${API_BASE}/api/items/found`, {
        method: "POST", headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
        body: JSON.stringify(reportData)
    }).then(response => {
        if (response.ok) {
            document.getElementById("displayTicketId").innerText = randomId;
            openModal('successModal');
            currentSelectedFiles = []; // Clear array on success
            document.querySelector("form").reset();
            document.getElementById("dynamicFieldsContainer").style.display = "none";
            renderFilePreview(); // Clears the UI stacked photos
        } else {
            showCustomAlert("Error: Server rejected the data.");
        }
    });
}

// ==========================================
// 5. DATA FETCHING & LIST RENDERERS
// ==========================================
function loadLostItems() {
    const tableBody = document.getElementById("lostTableBody");
    if (!tableBody) return;

    fetch(`${API_BASE}/api/items/lost`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(response => response.json())
        .then(data => {
            const activeItems = data.filter(item => item.status === "Unmatched");
            tableBody.innerHTML = ""; 
            if (activeItems.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>No active lost reports.</td></tr>";
                return;
            }
            activeItems.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td style="font-weight: bold;">${item.lostId}</td>
                    <td>${item.studentName}</td>
                    <td>${item.category}</td>
                    <td>${item.color}</td>
                    <td>${item.dateLost}</td>
                    <td style="color: #f59e0b; font-weight: bold;">${item.status}</td>
                    <td>
                        <button onclick="viewDetails('${item.lostId}')" style="background: #8c1515; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;"><i class="fa-solid fa-eye"></i> View</button>
                    </td>
                `;
                tableBody.appendChild(row);
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

                let submissionDate;
                let rawDate = item.dateSubmitted || item.dateFound;
                if (Array.isArray(rawDate)) {
                    submissionDate = new Date(rawDate[0], rawDate[1] - 1, rawDate[2]);
                } else {
                    submissionDate = new Date(rawDate);
                }

                const diffDays = Math.ceil(Math.abs(now - submissionDate) / (1000 * 60 * 60 * 24));
                return diffDays <= 7; 
            });

            tableBody.innerHTML = ""; 
            if (activeItems.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>No active found reports.</td></tr>";
                return;
            }
            activeItems.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td style="font-weight: bold;">${item.foundId}</td>
                    <td>${item.finderName}</td>
                    <td>${item.category}</td>
                    <td>${item.color}</td>
                    <td>${item.dateFound}</td>
                    <td style="color: #3b82f6; font-weight: bold;">${item.status}</td>
                    <td>
                        <button onclick="viewDetails('${item.foundId}')" style="background: #1d4ed8; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;"><i class="fa-solid fa-eye"></i> View</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        });
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

function loadMatches() {
    const tableBody = document.getElementById("matchTableBody");
    if (!tableBody) return;
    
    fetch(`${API_BASE}/api/items/matches`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = ""; 
            // Filter to show only matches currently awaiting admin review
            const pendingMatches = data.filter(match => match.matchStatus && match.matchStatus.toLowerCase() === "pending");
            
            // SORT: Highest confidence score to lowest confidence score
            pendingMatches.sort((a, b) => b.confidenceScore - a.confidenceScore);

            if (pendingMatches.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No automated matches found yet.</td></tr>`;
                return;
            }
            
            pendingMatches.forEach(match => {
                tableBody.innerHTML += `<tr>
                    <td><strong>${match.matchId}</strong></td>
                    <td><span style="color: #8c1515; font-weight: bold;">${match.lostId}</span></td>
                    <td><span style="color: #10b981; font-weight: bold;">${match.foundId}</span></td>
                    <td>
                        <span style="font-size: 13px; font-weight: bold;">
                            <i class="fa-solid fa-circle-check" style="color: #10b981; margin-right: 5px;"></i>${match.confidenceScore}% Match
                        </span>
                    </td>
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
        if (data.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No claimed items found.</td></tr>";
            return;
        }
        data.forEach(txn => {
            let dateOnly = txn.dateClaimed ? txn.dateClaimed.split('T') : "N/A";
            tableBody.innerHTML += `
                <tr>
                    <td style="font-weight: bold;">${txn.txnId}</td>
                    <td>${txn.matchId}</td>
                    <td>${txn.verificationMethod}</td>
                    <td>${dateOnly}</td>
                    <td style="color: #2e7d32; font-weight: bold;">Successfully Returned</td>
                    <td>
                        <button onclick="viewTransactionDetails('${txn.matchId}', '${txn.txnId}', '${txn.claimedBy}', '${txn.dateClaimed}')" style="background: #1d4ed8; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;"><i class="fa-solid fa-eye"></i> View</button>
                    </td>
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
                
                let submissionDate;
                let rawDate = item.dateSubmitted || item.dateFound;
                
                if (Array.isArray(rawDate)) {
                    submissionDate = new Date(rawDate[0], rawDate[1] - 1, rawDate[2]);
                } else {
                    submissionDate = new Date(rawDate);
                }

                const diffDays = Math.ceil(Math.abs(now - submissionDate) / (1000 * 60 * 60 * 24));
                item.daysInSystem = diffDays; 
                
                return diffDays > 7; 
            });
            
            if (archivedItems.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No items currently archived.</td></tr>";
                return;
            }
            
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

function extractTypeAndDesc(rawText) {
    let text = String(rawText && rawText !== "null" ? rawText : "N/A");
    let itemType = "N/A";
    let cleanDesc = text;

    try {
        const match = text.match(/\[type:\s*(.*?)\]/i);

        if (match && match[1]) {
            itemType = match[1].trim(); // ✅ Extract "Phone"
            
            // ✅ Remove [Type: ...] from description
            cleanDesc = text.replace(/\[type:\s*.*?\]/i, '').trim();

            if (!cleanDesc) cleanDesc = "None provided.";
        }
    } catch (e) {
        console.error("Extraction error:", e);
    }

    return { type: itemType, desc: cleanDesc };
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
                                <p><strong>Security Proof:</strong> ${foundItem.distinctiveFeature || 'None'}</p>
                            `; 
                        } else { document.getElementById("txnFoundDetails").innerHTML = "<p style='color:red;'>Found item not found.</p>"; }
                    });
            } else {
                document.getElementById("txnLostDetails").innerHTML = "<p style='color:red;'>Match record missing.</p>";
                document.getElementById("txnFoundDetails").innerHTML = "<p style='color:red;'>Match record missing.</p>";
            }
        });
}

let currentMatchId = ""; 

function reviewMatch(matchId, lostId, foundId) {
    currentMatchId = matchId;
    document.getElementById("splitModalTitle").innerText = `Review Match: ${matchId}`;

    document.getElementById("lostItemDetails").innerHTML = "Loading...";
    document.getElementById("foundItemDetails").innerHTML = "Loading...";

    // 1. FETCH LOST ITEM (Left Side - Keeps Security Proof)
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
                    <p><strong>Category:</strong> ${lostItem.category || 'N/A'}</p>
                    <p><strong>Type:</strong> ${info.type}</p>
                    <p><strong>Brand/Model:</strong> ${lostItem.brand || 'N/A'} ${lostItem.model ? '- ' + lostItem.model : ''}</p>
                    <p><strong>Color:</strong> ${lostItem.color || 'N/A'}</p>
                    <p><strong>Description:</strong> ${info.desc}</p>
                    <p><strong>Location:</strong> ${lostItem.location || 'N/A'}</p>
                    <p><strong>Date Lost:</strong> ${parseSpringDate(lostItem.dateLost)}</p>
                    <p><strong>Date Submitted:</strong> ${parseSpringDate(lostItem.dateSubmitted)}</p>
                    <p><strong>Security Proof:</strong> ${lostItem.distinctiveFeature || 'None'}</p>
                `;
            } else { document.getElementById("lostItemDetails").innerHTML = "<p style='color:red;'>Item not found.</p>"; }
        }).catch(err => { document.getElementById("lostItemDetails").innerHTML = "<p style='color:red;'>Failed to load Lost Item.</p>"; });

    // 2. FETCH FOUND ITEM (Right Side - Security Proof Removed)
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
                    <p><strong>Category:</strong> ${foundItem.category || 'N/A'}</p>
                    <p><strong>Type:</strong> ${info.type}</p>
                    <p><strong>Brand/Model:</strong> ${foundItem.brand || 'N/A'} ${foundItem.model ? '- ' + foundItem.model : ''}</p>
                    <p><strong>Color:</strong> ${foundItem.color || 'N/A'}</p>
                    <p><strong>Description:</strong> ${info.desc}</p>
                    <p><strong>Location:</strong> ${foundItem.location || 'N/A'}</p>
                    <p><strong>Date Found:</strong> ${parseSpringDate(foundItem.dateFound)}</p>
                    <p><strong>Date Submitted:</strong> ${parseSpringDate(foundItem.dateSubmitted)}</p>
                `;
            } else { document.getElementById("foundItemDetails").innerHTML = "<p style='color:red;'>Item not found.</p>"; }
        }).catch(err => { document.getElementById("foundItemDetails").innerHTML = "<p style='color:red;'>Failed to load Found Item.</p>"; });
        
    openModal('dynamicSplitModal');
}

function confirmMatch() {
    showLoading("Sending Emails...");
    fetch(`${API_BASE}/api/items/matches/${currentMatchId}/confirm`, {
        method: "POST", headers: { "ngrok-skip-browser-warning": "69420" }
    }).then(response => response.text()).then(message => {
        hideLoading();
        if (message === "Success") {
            closeModal('dynamicSplitModal');
            document.getElementById("transactionIcon").innerHTML = '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i>';
            document.getElementById("transactionTitle").innerText = "Match Confirmed!";
            document.getElementById("transactionMessage").innerText = "Items have been marked as Ready to Claim and emails have been sent.";
            openModal('transactionSuccessModal');
        } else alert("Error confirming match.");
    });
}

function rejectMatch() { fetch(`${API_BASE}/api/items/matches/${currentMatchId}/reject`, { method: "POST", headers: { "ngrok-skip-browser-warning": "69420" }}).then(() => { closeModal('dynamicSplitModal'); showCustomAlert("Match Rejected."); loadMatches(); }); }

// ==========================================
// 6. ADMIN AUTHENTICATION, OTP & SECURITY
// ==========================================

let isEmailValid = false;

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
    .then(res => res.text())
    .then(result => {
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

let isResetEmailValid = false;

// Real-Time Checker for the Forgot Password Page
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

    // We ping the same backend endpoint used for registration!
    fetch(`${API_BASE}/api/items/admin/check-email?email=${encodeURIComponent(emailInput)}`, { headers: { "ngrok-skip-browser-warning": "69420" }})
    .then(res => res.text())
    .then(result => {
        // Here, the logic is reversed! 
        if (result === "Available") {
            // "Available" means nobody registered with this email. That's BAD for resetting a password!
            box.style.borderColor = "#ef4444"; // Turn Red
            errorMsg.style.display = "block";
            isResetEmailValid = false;
        } else {
            // "Taken" means the account EXISTS in the DB. That's GOOD!
            box.style.borderColor = "#10b981"; // Turn Green
            errorMsg.style.display = "none";
            isResetEmailValid = true;
        }
    }).catch(err => console.error(err));
}

let isPasswordStrong = false;

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
        box.style.borderColor = "#ef4444"; 
        msg.style.color = "#ef4444";
        msg.innerText = "Password must be at least 8 characters.";
        isPasswordStrong = false;
    } else if (hasLetters && !hasNumbers && !hasSymbols) {
        box.style.borderColor = "#f59e0b"; 
        msg.style.color = "#f59e0b";
        msg.innerText = "Weak: Add numbers and special symbols.";
        isPasswordStrong = false;
    } else if (!hasLetters && hasNumbers && !hasSymbols) {
        box.style.borderColor = "#f59e0b";
        msg.style.color = "#f59e0b";
        msg.innerText = "Weak: Add letters and special symbols.";
        isPasswordStrong = false;
    } else if (hasLetters && hasNumbers && !hasSymbols) {
        box.style.borderColor = "#f59e0b";
        msg.style.color = "#f59e0b";
        msg.innerText = "Almost there: Add a special symbol (e.g., @, $, !).";
        isPasswordStrong = false;
    } else if (!hasLetters || !hasNumbers || !hasSymbols) {
        box.style.borderColor = "#f59e0b";
        msg.style.color = "#f59e0b";
        msg.innerText = "Must contain letters, numbers, AND symbols.";
        isPasswordStrong = false;
    } else {
        box.style.borderColor = "#10b981"; 
        msg.style.color = "#10b981";
        msg.innerText = "Strong password! Ready to go.";
        isPasswordStrong = true;
    }
}

function isStrongPassword(password) { return /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(password); }

function registerAccount() {
    const nameEl = document.getElementById("regName");
    const name = nameEl ? nameEl.value.trim() : "Admin"; 
    
    const email = document.getElementById("regEmail").value.trim();
    const pass = document.getElementById("regPassword").value;
    const confirmPass = document.getElementById("confirmPassword").value;
    
    // THE FIX: Changed to match the actual ID in your HTML file!
    const passError = document.getElementById("passwordStrengthMsg"); 
    const passBox = document.getElementById("regPassBox");

    if (!passError || !passBox) {
        console.error("Crash prevented: Missing password UI elements in HTML.");
        return;
    }

    passError.style.display = "none";
    passBox.style.borderColor = "white";

    if (!email || !pass || !confirmPass) {
        showCustomAlert("Please fill out all required fields.");
        return;
    }
    if (!isEmailValid) {
        showCustomAlert("You cannot register. That email is already in use.");
        return;
    }
    if (pass !== confirmPass) {
        showCustomAlert("Passwords do not match!");
        return;
    }
    
    if (!isPasswordStrong) {
        showCustomAlert("Your password is too weak. Please follow the instructions on the screen to make it stronger.");
        return;
    }

    fetch(`${API_BASE}/api/items/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "ngrok-skip-browser-warning": "69420" },
        body: new URLSearchParams({ fullName: name, email: email, password: pass })
    })
    .then(res => res.text())
    .then(message => {
        if (message === "Success") {
            // Replaced the standard alert with your nice modal!
            openModal('registrationSuccessModal');
        } else {
            showCustomAlert(message);
        }
    })
    .catch(error => {
        console.error("Registration error:", error);
        showCustomAlert("An error occurred during registration.");
    });
}

function attemptLogin() {
    const emailInput = document.getElementById("email").value;
    const passInput = document.getElementById("password").value;
    const rememberMe = document.getElementById("remember") ? document.getElementById("remember").checked : false; 

    fetch(`${API_BASE}/api/items/admin/login?username=${emailInput}&password=${passInput}`, {
        method: 'POST', headers: { "ngrok-skip-browser-warning": "69420" }
    }).then(res => res.text()).then(result => {
        if (result.startsWith("Success")) {
            let adminName = result.replace("Success", "").replace(",", "").replace("|", "").trim() || "Admin";
            (rememberMe ? localStorage : sessionStorage).setItem("foundit_admin_logged_in", "true");
            (rememberMe ? localStorage : sessionStorage).setItem("foundit_admin_name", adminName); 
            window.location.href = "admin-dashboard.html"; 
        } else {
            document.getElementById("errorMsg").style.display = "block";
        }
    });
}

function logoutAdmin() {
    localStorage.removeItem("foundit_admin_logged_in"); localStorage.removeItem("foundit_admin_name"); 
    sessionStorage.removeItem("foundit_admin_logged_in"); sessionStorage.removeItem("foundit_admin_name"); 
    window.location.href = "admin-login.html"; 
}

let savedResetEmail = "";
let savedResetCode = "";

// STEP 1: Request the Code
function requestOtp() {
    const email = document.getElementById("resetEmail").value;
    
    if (!email) {
        showCustomAlert("Please enter an email address first.");
        return;
    }
    
    // Prevent submission if the email box is red (not in the database)
    if (!isResetEmailValid) {
        showCustomAlert("We cannot find an account with that email address.");
        return;
    }
    
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
    if (code.length !== 6) {
        showCustomAlert("Code must be exactly 6 digits.");
        return;
    }
    
    fetch(`${API_BASE}/api/items/admin/verify-otp?email=${encodeURIComponent(savedResetEmail)}&code=${code}`, { method: 'POST', headers: { "ngrok-skip-browser-warning": "69420" }})
    .then(res => res.text()).then(result => {
        if (result === "Success") { 
            savedResetCode = code; 
            document.getElementById("page2-code").style.display = "none"; 
            document.getElementById("page3-password").style.display = "block"; 
            document.getElementById("resetSubtitle").innerText = "Create New Password";
        } else {
            showCustomAlert(result);
        }
    });
}

let isResetPasswordUniqueAndStrong = false;

// Real-Time Checker for the Reset Page
function checkResetPasswordLive() {
    const newPass = document.getElementById("newPassword").value;
    const errorMsg = document.getElementById("passwordErrorMsg");
    const passBox = document.getElementById("newPassBox");

    // Reset UI if empty
    if (newPass.length === 0) {
        passBox.style.borderColor = "white";
        errorMsg.style.display = "none";
        isResetPasswordUniqueAndStrong = false;
        return;
    }

    // Ping the DB to see if the password is old
    fetch(`${API_BASE}/api/items/admin/check-password-history?email=${encodeURIComponent(savedResetEmail)}&code=${savedResetCode}&newPassword=${encodeURIComponent(newPass)}`, { 
        method: 'POST', 
        headers: { "ngrok-skip-browser-warning": "69420" }
    })
    .then(res => res.text())
    .then(result => {
        if (result === "Used") {
            passBox.style.borderColor = "#ef4444"; // Red box
            errorMsg.style.color = "#ef4444"; // Red text
            errorMsg.innerText = "This password was already used.";
            errorMsg.style.display = "block";
            isResetPasswordUniqueAndStrong = false;
        } else {
            // It's a new password, but is it strong?
            if (!isStrongPassword(newPass)) {
                passBox.style.borderColor = "#f59e0b"; // Orange box
                errorMsg.style.color = "#f59e0b"; // Orange text
                errorMsg.innerText = "Too weak! Add letters, numbers, and symbols.";
                errorMsg.style.display = "block";
                isResetPasswordUniqueAndStrong = false;
            } else {
                passBox.style.borderColor = "#10b981"; // Green box
                errorMsg.style.color = "#10b981"; // Green text
                errorMsg.innerText = "Strong and available!";
                errorMsg.style.display = "block";
                isResetPasswordUniqueAndStrong = true;
            }
        }
    }).catch(err => console.error(err));
}

function submitFinalPassword() {
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmNewPassword").value;

    if (newPass !== confirmPass) {
        showCustomAlert("Passwords do not match!");
        return;
    }
    
    // Uses the live-checker variable from our previous update
    if (!isResetPasswordUniqueAndStrong) {
        showCustomAlert("Please resolve the password errors before submitting.");
        return;
    }
    
    fetch(`${API_BASE}/api/items/admin/apply-new-password?email=${encodeURIComponent(savedResetEmail)}&code=${savedResetCode}&newPassword=${encodeURIComponent(newPass)}`, { method: 'POST', headers: { "ngrok-skip-browser-warning": "69420" }})
    .then(res => res.text()).then(result => {
        if (result === "Success") {
            openModal('resetSuccessModal'); 
        } else {
            showCustomAlert(result);
        }
    });
}

// ==========================================
// 7. TRUE XLSX EXPORT MODULE (Quick Export)
// ==========================================
async function executeQuickExport() {
    showLoading("Generating Excel File...");
    
    try {
        // Fetch both Lost and Found data simultaneously
        const [lostResponse, foundResponse] = await Promise.all([
            fetch(`${API_BASE}/api/items/lost`, { headers: { "ngrok-skip-browser-warning": "69420" } }),
            fetch(`${API_BASE}/api/items/found`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        ]);

        const lostData = await lostResponse.json();
        const foundData = await foundResponse.json();

        let combinedData = [];

        // Generate the exact date the admin clicked the export button
        const exportDate = new Date().toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Format Lost Items using the beautifully formatted date
        lostData.forEach(item => {
            let systemDate = parseSpringDate(item.dateSubmitted || item.dateLost);
            combinedData.push({
                "Name": item.studentName || 'Unknown',
                "Section": item.courseSection || 'N/A',
                "Student Number": item.studentId || 'N/A',
                "Purpose": "Lost Item Ticket",
                "Date Submitted": systemDate,
                "Export Date": exportDate // <-- NEW COLUMN ADDED HERE
            });
        });

        // Format Found Items using the beautifully formatted date
        foundData.forEach(item => {
            let systemDate = parseSpringDate(item.dateSubmitted || item.dateFound);
            combinedData.push({
                "Name": item.finderName || 'Unknown',
                "Section": item.courseSection || 'N/A',
                "Student Number": item.studentId || 'N/A',
                "Purpose": "Found Item Ticket",
                "Date Submitted": systemDate,
                "Export Date": exportDate // <-- NEW COLUMN ADDED HERE
            });
        });

        if (combinedData.length === 0) {
            hideLoading();
            showCustomAlert("No records found to export.");
            return;
        }

        // Generate the Excel Sheet
        let worksheet = XLSX.utils.json_to_sheet(combinedData);
        let workbook = XLSX.utils.book_new();
        
        // Make the columns wide enough to read easily (Added a 6th width for the Export Date)
        worksheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 20 }];
        
        XLSX.utils.book_append_sheet(workbook, worksheet, "All OSAD Tickets");
        XLSX.writeFile(workbook, "OSAD_General_Tickets.xlsx");
        
        hideLoading();

    } catch (error) {
        hideLoading();
        console.error("Export Error:", error);
        showCustomAlert("An error occurred while generating the Excel file.");
    }
}

// ==========================================
// 8. NEW DASHBOARD UI LOGIC (Bar Chart & Countdowns)
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

// Function to trigger graph/stats refresh on dropdown selection
function updateDashboardStats() {
    if (document.getElementById("founditChart")) {
        initDashboardChartAndStats();
    }
}

// ==========================================
// 9. NEW CLAIMING & UI ENHANCEMENTS
// ==========================================

function releaseItem(matchId) {
    if (confirm("Are you sure you want to release this item to the student and log the transaction?")) {
        showLoading("Logging Transaction...");
        
        fetch(`${API_BASE}/api/items/matches/${matchId}/release`, { 
            method: "POST", 
            headers: { "ngrok-skip-browser-warning": "69420" } 
        })
        .then(res => res.text())
        .then(msg => {
            hideLoading();
            if (msg === "Success") {
                showCustomAlert("Item successfully released and logged to Claimed Items!");
                
                // Refresh the table if the function exists on the current page (claiming-items.html)
                if (typeof window.onload === 'function') {
                    window.onload();
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
}

function loadClaimingItems() {
    const tbody = document.getElementById("claimingTableBody");
    if (!tbody) return;

    // Force the modal to close if the table reloads after a successful release
    closeModal('dynamicSplitModal');

    fetch(`${API_BASE}/api/items/matches`, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then(res => res.json())
        .then(data => {
            const awaiting = data.filter(m => m.matchStatus === "Awaiting Claim");
            
            if(awaiting.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No items currently awaiting claim.</td></tr>`;
                return;
            }
            
            tbody.innerHTML = ""; // Clear existing rows
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

// Grabs the global currentMatchId variable to release from the split modal
function triggerReleaseFromModal() {
    if (currentMatchId) {
        // 1. Close the large review modal first to prevent UI overlap
        closeModal('dynamicSplitModal');
        
        // 2. Trigger the standard release flow (opens the confirmation popup)
        releaseItem(currentMatchId);
    }
}

let matchIdToRelease = ""; // Global variable to remember which item is being released

// This replaces the old native confirm() popup
function releaseItem(matchId) {
    matchIdToRelease = matchId;
    openModal('releaseConfirmModal');
}

// This runs when they click "Yes, Release" inside the new custom modal
function executeRelease() {
    closeModal('releaseConfirmModal');
    showLoading("Logging Transaction...");
    
    fetch(`${API_BASE}/api/items/matches/${matchIdToRelease}/release`, { 
        method: "POST", 
        headers: { "ngrok-skip-browser-warning": "69420" } 
    })
    .then(res => res.text())
    .then(msg => {
        hideLoading();
        if (msg === "Success") {
            // ADD "success" HERE to trigger the green checkmark
            showCustomAlert("Item successfully released and logged to Claimed Items!", "success");
            
            // Dynamically reload the table so the item vanishes from the list immediately
            if (document.getElementById("claimingTableBody")) {
                loadClaimingItems();
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
// 10. DYNAMIC IMAGE CAROUSEL LOGIC
// ==========================================
function generateCarouselHTML(photoPathStr, prefix) {
    const photos = (photoPathStr && photoPathStr !== "null") ? photoPathStr.split(",") : ["no-image.jpg"];
    const carouselId = `carousel-${prefix}`;
    
    let html = `<div class="image-carousel" id="${carouselId}" data-index="0" style="position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; background: #f3f4f6; border-radius: 8px; padding: 10px; min-height: 180px; border: 1px solid #ddd;">`;
    
    // Add Left Arrow if multiple photos
    if (photos.length > 1) {
        html += `<button type="button" onclick="moveCarousel('${carouselId}', -1)" style="position: absolute; left: 5px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-chevron-left"></i></button>`;
    }
    
    html += `<div style="width: 100%; text-align: center; overflow: hidden;">`;
    photos.forEach((photo, idx) => {
        let display = idx === 0 ? "block" : "none";
        html += `<img class="${carouselId}-img" src="${API_BASE}/api/items/images/${photo.trim()}?ngrok-skip-browser-warning=true" style="max-width: 100%; max-height: 200px; display: ${display}; margin: 0 auto; border-radius: 5px; cursor: pointer; object-fit: contain;" onclick="openFullscreenImage(this.src)" onerror="this.src='https://via.placeholder.com/300x200?text=No+Photo+Available';">`;
    });
    html += `</div>`;
    
    // Add Right Arrow and Dots if multiple photos
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

// ==========================================
// CUSTOM FILE UPLOAD UI LOGIC
// ==========================================
let currentSelectedFiles = []; // Global array to hold the files

function handleFileSelection(event) {
    const newFiles = event.target.files;
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];

        if (currentSelectedFiles.length >= 3) {
            showCustomAlert("You can only upload a maximum of 3 photos.");
            break; // Stop adding if they hit the limit
        }
        if (!validTypes.includes(file.type)) {
            showCustomAlert(`Invalid file type for ${file.name}. Only JPG/PNG allowed.`);
            continue;
        }
        if (file.size > 10 * 1024 * 1024) {
            showCustomAlert(`${file.name} is too large. Maximum size is 10MB.`);
            continue;
        }

        currentSelectedFiles.push(file);
    }

    renderFilePreview();
    event.target.value = ""; // Clear the native input so you can re-select the same file if needed
}

function renderFilePreview() {
    const container = document.getElementById("photoPreviewContainer");
    if (!container) return;

    container.innerHTML = ""; // Clear current list

    currentSelectedFiles.forEach((file, index) => {
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #e5e7eb; padding: 10px 15px; border-radius: 6px; border: 1px solid #ccc;">
                <span style="font-size: 13px; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80%;">
                    <i class="fa-solid fa-image" style="color: #8c1515; margin-right: 8px;"></i> ${file.name}
                </span>
                <button type="button" onclick="removeFile(${index})" style="background: #ef4444; color: white; border: none; width: 25px; height: 25px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    });
}

function removeFile(index) {
    currentSelectedFiles.splice(index, 1); // Remove from array
    renderFilePreview(); // Re-draw the UI
}

// Grab the elements by their IDs (update these if your HTML IDs are different)
const passwordInput = document.getElementById('password'); 
const confirmPasswordInput = document.getElementById('confirmPassword');
const matchMessage = document.getElementById('matchMessage');

function validatePasswordMatch() {
    const pass = passwordInput.value;
    const confirmPass = confirmPasswordInput.value;

    // Don't show an error if they haven't typed anything in the confirm box yet
    if (confirmPass === '') {
        matchMessage.textContent = '';
        confirmPasswordInput.classList.remove('border-success', 'border-error');
        return;
    }

    // Check if they match
    if (pass === confirmPass) {
        matchMessage.textContent = 'Passwords match!';
        matchMessage.className = 'validation-text text-success';
        
        // Optional: Make the input border green
        confirmPasswordInput.classList.remove('border-error');
        confirmPasswordInput.classList.add('border-success');
    } else {
        matchMessage.textContent = 'Passwords do not match.';
        matchMessage.className = 'validation-text text-error';
        
        // Optional: Make the input border red
        confirmPasswordInput.classList.remove('border-success');
        confirmPasswordInput.classList.add('border-error');
    }
}

// Run the check whenever the user types in EITHER box
passwordInput.addEventListener('input', validatePasswordMatch);
confirmPasswordInput.addEventListener('input', validatePasswordMatch);