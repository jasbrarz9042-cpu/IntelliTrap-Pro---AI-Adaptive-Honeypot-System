document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('honeypot-form');
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnIcon = document.getElementById('btn-icon');
    const btnLoader = document.getElementById('btn-loader');
    const errorBox = document.getElementById('login-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide previous errors
        errorBox.classList.add('hidden');
        
        // Change button state
        btnText.textContent = "Processing...";
        btnIcon.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        submitBtn.style.opacity = '0.7';
        submitBtn.disabled = true;

        // Show full screen fake encryption overlay after a short delay
        setTimeout(() => {
            overlay.classList.remove('hidden');
            
            // Fake loading sequence
            setTimeout(() => { loadingText.textContent = "Establishing secure tunnel..."; }, 800);
            setTimeout(() => { loadingText.textContent = "Verifying credentials against database..."; }, 1600);
            setTimeout(() => { loadingText.textContent = "Analyzing risk profile..."; }, 2400);
            
            // Actually send the request after the fake sequence
            setTimeout(async () => {
                const formData = new FormData(form);
                
                try {
                    const response = await fetch('/login', {
                        method: 'POST',
                        body: formData
                    });
                    
                    // We expect a 401 error from our backend logic
                    
                    // Hide overlay
                    overlay.classList.add('hidden');
                    
                    // Reset button
                    btnText.textContent = "Establish Secure Connection";
                    btnIcon.classList.remove('hidden');
                    btnLoader.classList.add('hidden');
                    submitBtn.style.opacity = '1';
                    submitBtn.disabled = false;
                    
                    // Show error
                    errorBox.classList.remove('hidden');
                    
                    // Clear password field
                    document.getElementById('password').value = '';
                    
                } catch (err) {
                    console.error("Connection error");
                }
                
            }, 3200);

        }, 500);
    });
});
