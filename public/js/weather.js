document.getElementById("submitBtn").addEventListener("click", function (event) {
    event.preventDefault(); // Prevent the form from submitting normally
    const city = document.getElementById("city").value;
    window.location.href = `/weather/${city}`;
});
