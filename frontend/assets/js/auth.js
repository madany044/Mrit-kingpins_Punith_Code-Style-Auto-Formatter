import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendEmailVerification, 
    updateProfile,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { firebaseConfig, API_BASE_URL } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM elements
const statusBanner = document.querySelector("[data-auth-status]");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const logoutButton = document.getElementById("logoutButton");

// Status handler
const setStatus = (message, type = "info") => {
    if (!statusBanner) {
        console.log(`Status [${type}]: ${message}`);
        return;
    }
    statusBanner.textContent = message;
    statusBanner.dataset.variant = type;
    statusBanner.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === "success") {
        setTimeout(() => {
            statusBanner.style.display = 'none';
        }, 5000);
    }
};

// Check authentication state
const checkAuthState = () => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
};

// Backend session exchange
const exchangeBackendSession = async (idToken, profile = {}) => {
    try {
        console.log("Exchanging Firebase token for backend session...");
        
        const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ idToken, profile })
        });

        console.log("Backend response status:", response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("Backend session exchange successful:", data);
        
        // Store tokens and user data
        localStorage.setItem("kingpins.jwt", data.token);
        localStorage.setItem("kingpins.user", JSON.stringify({
            uid: data.uid,
            email: data.email,
            displayName: data.displayName,
            emailVerified: data.emailVerified
        }));
        
        return data;
    } catch (error) {
        console.error("Session exchange error:", error);
        throw new Error(`Backend session failed: ${error.message}`);
    }
};

// Registration handler
if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        const formData = new FormData(registerForm);
        const email = formData.get("email").trim();
        const password = formData.get("password");
        const confirm = formData.get("confirm");
        const name = formData.get("name").trim();

        console.log("Registration attempt:", { email, name });

        // Validation
        if (!email || !password || !name) {
            setStatus("Please fill in all fields.", "error");
            return;
        }

        if (password.length < 6) {
            setStatus("Password must be at least 6 characters.", "error");
            return;
        }

        if (password !== confirm) {
            setStatus("Passwords do not match.", "error");
            return;
        }

        setStatus("Creating account...", "info");

        try {
            console.log("Step 1: Creating Firebase user...");
            const credentials = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Firebase user created:", credentials.user.uid);

            console.log("Step 2: Updating profile...");
            await updateProfile(credentials.user, {
                displayName: name
            });
            console.log("Profile updated");

            console.log("Step 3: Sending email verification...");
            await sendEmailVerification(credentials.user);
            console.log("Verification email sent");

            console.log("Step 4: Reloading user...");
            await credentials.user.reload();
            console.log("User reloaded");

            console.log("Step 5: Getting ID token...");
            const idToken = await credentials.user.getIdToken();
            console.log("ID token obtained");

            console.log("Step 6: Exchanging backend session...");
            await exchangeBackendSession(idToken, {
                displayName: name
            });
            console.log("Backend session established");

            setStatus("Registration successful! Verification email sent. Redirecting to dashboard...", "success");
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = "./dashboard.html";
            }, 2000);

        } catch (error) {
            console.error("Registration error:", error);
            
            // Handle specific Firebase errors
            let errorMessage = error.message;
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Email is already registered.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password is too weak.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = "Network error. Please check your connection.";
            }
            
            setStatus(errorMessage, "error");
        }
    });
}

// Login handler
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        const formData = new FormData(loginForm);
        const email = formData.get("email").trim();
        const password = formData.get("password");

        if (!email || !password) {
            setStatus("Please fill in all fields.", "error");
            return;
        }

        setStatus("Signing in...", "info");

        try {
            console.log("Step 1: Signing in with Firebase Auth...");
            const credentials = await signInWithEmailAndPassword(auth, email, password);
            console.log("Firebase sign-in successful:", credentials.user.uid);

            console.log("Step 2: Getting ID token...");
            const idToken = await credentials.user.getIdToken();
            console.log("ID token obtained");

            console.log("Step 3: Exchanging backend session...");
            const sessionData = await exchangeBackendSession(idToken, {
                displayName: credentials.user.displayName
            });
            console.log("Backend session established");

            setStatus("Login successful! Redirecting...", "success");
            
            // Check if email is verified
            if (!credentials.user.emailVerified) {
                setStatus("Please verify your email address.", "warning");
            }
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = "./dashboard.html";
            }, 1000);

        } catch (error) {
            console.error("Login error:", error);
            
            let errorMessage = error.message;
            if (error.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email.";
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = "Invalid password.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = "Network error. Please check your connection.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many failed attempts. Please try again later.";
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = "This account has been disabled.";
            }
            
            setStatus(errorMessage, "error");
        }
    });
}

// Logout handler
if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            setStatus("Logging out...", "info");
            
            // Sign out from Firebase
            await signOut(auth);
            
            // Clear local storage
            localStorage.removeItem("kingpins.jwt");
            localStorage.removeItem("kingpins.user");
            
            setStatus("Logged out successfully", "success");
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = "./login.html";
            }, 1000);
            
        } catch (error) {
            console.error("Logout error:", error);
            setStatus("Error during logout", "error");
        }
    });
}

// Check if user is already logged in
const initializeAuth = async () => {
    const user = await checkAuthState();
    if (user) {
        console.log("User already signed in:", user.uid);
        // Refresh the backend session
        try {
            const idToken = await user.getIdToken();
            await exchangeBackendSession(idToken);
        } catch (error) {
            console.error("Error refreshing session:", error);
        }
    }
};

// Initialize auth state when page loads
document.addEventListener('DOMContentLoaded', initializeAuth);

// Export for use in other files
export { 
    auth, 
    setStatus, 
    exchangeBackendSession, 
    checkAuthState,
    initializeAuth 
};

