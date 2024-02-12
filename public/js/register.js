const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (username === "") {
        alert("Please enter a username");
        return;
    }

    if (password === "") {
        alert("Please enter a password");
        return;
    }

    if (confirmPassword === "") {
        alert("Please confirm your password");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    registerForm.submit();
});
