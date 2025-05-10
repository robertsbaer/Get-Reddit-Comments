// script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const commentForm = document.getElementById('commentForm');
    const usernameInput = document.getElementById('username');
    const limitInput = document.getElementById('limit');
    const fetchButton = document.getElementById('fetchButton');
    const buttonText = document.getElementById('buttonText');
    const fetchIcon = document.getElementById('fetchIcon');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const statusContainer = document.getElementById('statusContainer');
    const downloadContainer = document.getElementById('downloadContainer');
    const downloadLink = document.getElementById('downloadLink');
    const currentYearSpan = document.getElementById('currentYear');

    // API Endpoint (Replace with your actual ngrok URL or deployed backend URL)
    // IMPORTANT: This ngrok URL is temporary and will change.
    // You should replace this with your stable backend service URL.
    const API_BASE_URL = 'https://e211-2601-152-302-fe92-e9c6-448-b96-84bd.ngrok-free.app'; // Example, replace it

    // Set current year in footer
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Function to display status messages
    const showStatus = (message, type = 'info') => {
        statusContainer.innerHTML = ''; // Clear previous messages
        downloadContainer.classList.add('hidden'); // Hide download link by default

        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message status-${type} p-3 rounded-md text-sm`; // Tailwind classes can be added here too if needed

        // Add icons based on type for better visual feedback
        let iconHTML = '';
        if (type === 'error') {
            iconHTML = `<svg class="inline-block h-5 w-5 mr-2 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-10a1 1 0 10-2 0v4a1 1 0 102 0V8zm-1 7a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>`;
        } else if (type === 'success') {
            iconHTML = `<svg class="inline-block h-5 w-5 mr-2 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
        } else if (type === 'info') {
            iconHTML = `<svg class="inline-block h-5 w-5 mr-2 -mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
        }

        messageDiv.innerHTML = iconHTML + message;
        statusContainer.appendChild(messageDiv);
    };

    // Function to toggle loading state of the button
    const setLoadingState = (isLoading) => {
        if (isLoading) {
            fetchButton.disabled = true;
            buttonText.textContent = 'Fetching...';
            fetchIcon.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            fetchButton.classList.add('opacity-75', 'cursor-not-allowed');
        } else {
            fetchButton.disabled = false;
            buttonText.textContent = 'Fetch Comments';
            fetchIcon.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
            fetchButton.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    };

    // Event Listener for form submission
    if (commentForm) {
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            let username = usernameInput.value.trim();
            if (!username) {
                showStatus('❗️ Please enter a Reddit username.', 'error');
                usernameInput.focus();
                return;
            }

            // Remove 'u/' prefix if present
            username = username.replace(/^u\//i, '');

            let limit = parseInt(limitInput.value);
            if (isNaN(limit) || limit <= 0) {
                limit = 500; // Default limit
                limitInput.value = ''; // Clear if invalid, or set to 500
            }

            setLoadingState(true);
            showStatus(`⏳ Fetching comments for <strong>${username}</strong> (up to ${limit})...`, 'info');
            downloadContainer.classList.add('hidden');
            downloadLink.href = '#'; // Reset download link

            try {
                // Construct the API URL
                const fetchURL = `${API_BASE_URL}/get_comments?username=${encodeURIComponent(username)}&limit=${limit}`;

                // Make the API call
                const response = await fetch(fetchURL);

                if (!response.ok) {
                    // Try to parse error from backend if available
                    let errorMsg = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        if (errorData && errorData.error) {
                            errorMsg = errorData.error;
                        }
                    } catch (e) {
                        // Could not parse JSON error, stick with HTTP status
                    }
                    throw new Error(errorMsg);
                }

                const data = await response.json();

                if (data.error) {
                    showStatus(`❌ ${data.error}`, 'error');
                } else {
                    const comments = data.comments || [];
                    if (comments.length === 0) {
                         showStatus(`🤔 No comments found for <strong>${username}</strong> or the user is private/suspended.`, 'info');
                    } else {
                        showStatus(`✅ Successfully fetched ${comments.length} comments for <strong>${username}</strong>.`, 'success');

                        // Create a Blob with the JSON data
                        const blob = new Blob([JSON.stringify(comments, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);

                        // Set up the download link
                        downloadLink.href = url;
                        downloadLink.download = `${username}_comments_${new Date().toISOString().split('T')[0]}.json`; // e.g., username_comments_2024-05-10.json
                        downloadContainer.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error('Fetch error:', error);
                showStatus(`❌ Error fetching comments: ${error.message}. Please check the console for more details or try again later.`, 'error');
            } finally {
                setLoadingState(false);
            }
        });
    }

    // Add a little flair to input focus
    [usernameInput, limitInput].forEach(input => {
        if (input) {
            input.addEventListener('focus', () => input.classList.add('shadow-outline-orange'));
            input.addEventListener('blur', () => input.classList.remove('shadow-outline-orange'));
        }
    });
});

// Helper for custom focus style (add to style.css if preferred, or keep in JS like this)
// This adds a Tailwind like shadow utility but you might need to define it in your tailwind.config.js or style.css
// For simplicity, I'll add a style tag here, but ideally, it's in style.css or Tailwind config
const style = document.createElement('style');
style.textContent = `
    .shadow-outline-orange {
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.5); /* Corresponds to orange-500 with 50% opacity */
    }
`;
document.head.appendChild(style);
