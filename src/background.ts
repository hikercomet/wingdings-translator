// No kuromojin import or tokenizerPromise here

// Map to store messages pending content script readiness
const pendingMessages = new Map<number, any>();

chrome.runtime.onInstalled.addListener(() => {
  // Menu for selected text
  chrome.contextMenus.create({
    id: "translateToWingdings",
    title: "Translate selection to Wingdings",
    contexts: ["selection"],
  });

  // Separator
  chrome.contextMenus.create({
    id: "separator1",
    type: "separator",
    contexts: ["page"],
  });

  // Menu for translating the whole page
  chrome.contextMenus.create({
    id: "translatePage",
    title: "Translate this page to Wingdings",
    contexts: ["page"],
  });

  // Menu for reverting the page translation
  chrome.contextMenus.create({
    id: "revertPage",
    title: "Revert page translation",
    contexts: ["page"],
  });
});

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu clicked:", info.menuItemId); // Log 1

  // Check if the tab and its URL are valid, and not a chrome:// URL
  if (!tab || !tab.id || !tab.url || tab.url.startsWith('chrome://')) {
    console.log("Invalid tab or URL, not executing script."); // Log 2
    return; // Do not execute on protected pages
  }

  const tabId = tab.id;
  let messageToSend: any = null;

  switch (info.menuItemId) {
    case "translateToWingdings":
      if (info.selectionText) {
        // This part is not fully implemented yet.
        console.log("Selected text:", info.selectionText);
      }
      break;
    case "translatePage":
      console.log("Executing translatePage in content script for tabId:", tabId); // Log 3
      messageToSend = { action: "translatePage" };
      break;
    case "revertPage":
      console.log("Executing revertPage in content script for tabId:", tabId); // Log 6
      messageToSend = { action: "revertPage" };
      break;
  }

  if (messageToSend) {
    // Store the message and inject content.js
    pendingMessages.set(tabId, messageToSend);
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
      injectImmediately: true,
      // @ts-ignore
      type: "module"
    }).catch(err => console.error("Error injecting content script:", err));
  }
});

// Listener for messages from content scripts (including "ready" signal)
chrome.runtime.onMessage.addListener((request, sender, _sendResponse) => {
  if (request.type === 'contentScriptReady' && sender.tab && sender.tab.id) {
    const tabId = sender.tab.id;
    console.log(`Content script ready for tabId: ${tabId}`);
    if (pendingMessages.has(tabId)) {
      const message = pendingMessages.get(tabId);
      pendingMessages.delete(tabId);
      console.log(`Sending pending message to tabId ${tabId}:`, message);
      chrome.tabs.sendMessage(tabId, message).then(() => {
        console.log("Message sent successfully.");
      }).catch(err => {
        console.error("Error sending message to content script:", err);
      });
    }
  }
  // Handle other messages if any (e.g., convertToRomaji from content.js if we revert that part)
  // For now, we assume content.js will handle all translation logic.
  return true; // Indicates an asynchronous response if needed
});

