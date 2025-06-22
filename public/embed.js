(function () {
  // Find the script tag and get the bot ID from its data attribute
  const scriptTag = document.querySelector('script[src$="/embed.js"]');
  if (!scriptTag) {
    console.error('Chatbot Widget: Could not find the embed script tag.');
    return;
  }
  const chatbotId = scriptTag.dataset.chatbotId;

  if (!chatbotId) {
    console.error('Chatbot Widget: data-chatbot-id attribute is required');
    return;
  }

  // Create container for the widget
  const container = document.createElement('div');
  container.id = 'chatbot-container';
  document.body.appendChild(container);

  // Get the base URL from the script's src
  const scriptSrc = scriptTag.src;
  const baseUrl = new URL(scriptSrc).origin;

  // Load the widget styles
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${baseUrl}/embed.css`;
  document.head.appendChild(link);

  // Load the widget component
  const componentScript = document.createElement('script');
  componentScript.src = `${baseUrl}/embed-component.js`;
  componentScript.async = true;
  componentScript.onload = () => {
    // Initialize the widget by passing the chatbotId and container selector
    if (window.ChatbotWidget && typeof window.ChatbotWidget.init === 'function') {
      window.ChatbotWidget.init({
        chatbotId: chatbotId,
        container: '#chatbot-container',
      });
    }
  };
  document.body.appendChild(componentScript);
})();
