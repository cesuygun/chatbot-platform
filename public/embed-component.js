(function () {
  // Create the widget component
  const createWidget = config => {
    const { botId, container } = config;
    const containerElement = document.querySelector(container);

    if (!containerElement) {
      console.error('Chatbot Widget: Container element not found');
      return;
    }

    // Create widget button
    const button = document.createElement('button');
    button.className = 'chatbot-button';
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;

    // Create chat dialog
    const dialog = document.createElement('div');
    dialog.className = 'chatbot-dialog';
    dialog.innerHTML = `
      <div class="chatbot-dialog-header">
        <h2>Chat with us</h2>
        <button class="chatbot-close-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="chatbot-messages"></div>
      <form class="chatbot-form">
        <input type="text" placeholder="Type your message..." class="chatbot-input">
        <button type="submit" class="chatbot-send-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    `;

    // Add elements to container
    containerElement.appendChild(button);
    containerElement.appendChild(dialog);

    // Handle button click
    button.addEventListener('click', () => {
      dialog.classList.add('chatbot-dialog-open');
    });

    // Handle close button click
    const closeButton = dialog.querySelector('.chatbot-close-button');
    closeButton.addEventListener('click', () => {
      dialog.classList.remove('chatbot-dialog-open');
    });

    // Handle form submission
    const form = dialog.querySelector('.chatbot-form');
    const input = dialog.querySelector('.chatbot-input');
    const messagesContainer = dialog.querySelector('.chatbot-messages');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message) return;

      // Add user message
      addMessage(message, 'user');
      input.value = '';

      try {
        // Send message to API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            botId,
            message,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();
        addMessage(data.message, 'assistant');
      } catch (error) {
        console.error('Error sending message:', error);
        addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
      }
    });

    // Helper function to add messages
    const addMessage = (content, role) => {
      const messageElement = document.createElement('div');
      messageElement.className = `chatbot-message chatbot-message-${role}`;
      messageElement.textContent = content;
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
  };

  // Initialize the widget
  window.ChatbotWidget = {
    init: createWidget,
  };
})();
