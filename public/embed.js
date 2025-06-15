(function () {
  // Get the bot ID from the script tag
  const widgetScript = document.getElementById('chatbot-widget');
  const botId = widgetScript.dataset.botId;

  if (!botId) {
    console.error('Chatbot Widget: Bot ID is required');
    return;
  }

  // Create container for the widget
  const container = document.createElement('div');
  container.id = 'chatbot-container';
  document.body.appendChild(container);

  // Load the widget styles
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${window.location.origin}/embed.css`;
  document.head.appendChild(link);

  // Load the widget component
  const componentScript = document.createElement('script');
  componentScript.src = `${window.location.origin}/embed-component.js`;
  componentScript.async = true;
  componentScript.onload = () => {
    // Initialize the widget
    window.ChatbotWidget.init({
      botId,
      container: '#chatbot-container',
    });
  };
  document.body.appendChild(componentScript);
})();
