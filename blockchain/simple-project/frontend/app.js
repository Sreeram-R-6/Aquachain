// frontend/app.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('data-form');
    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('http://localhost:3000/api/sendData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            resultDiv.textContent = result.message;
        } catch (error) {
            console.error('Error sending data:', error);
            resultDiv.textContent = 'Error sending data.';
        }
    });
});