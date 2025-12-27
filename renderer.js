const { ipcRenderer } = require('electron');
const SimplePeer = require('simple-peer');

// DOM Elements
const modeSelection = document.getElementById('modeSelection');
const hostPanel = document.getElementById('hostPanel');
const guestPanel = document.getElementById('guestPanel');
const chatContainer = document.getElementById('chatContainer');

const hostBtn = document.getElementById('hostBtn');
const guestBtn = document.getElementById('guestBtn');

const invitationLink = document.getElementById('invitationLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const startHostBtn = document.getElementById('startHostBtn');

const connectLink = document.getElementById('connectLink');
const connectGuestBtn = document.getElementById('connectGuestBtn');

const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatMessages = document.getElementById('chatMessages');

const backToModeBtn1 = document.getElementById('backToModeBtn1');
const backToModeBtn2 = document.getElementById('backToModeBtn2');
const backToModeBtn3 = document.getElementById('backToModeBtn3');

const hostStatusDot = document.getElementById('hostStatusDot');
const hostStatusText = document.getElementById('hostStatusText');
const guestStatusDot = document.getElementById('guestStatusDot');
const guestStatusText = document.getElementById('guestStatusText');
const chatStatusDot = document.getElementById('chatStatusDot');
const chatStatusText = document.getElementById('chatStatusText');

// WebRTC variables
let peer = null;
let isHost = false;
let currentToken = null;

// Show panel function
function showPanel(panelId) {
  [modeSelection, hostPanel, guestPanel, chatContainer].forEach(panel => {
    panel.classList.remove('active');
  });
  
  document.getElementById(panelId).classList.add('active');
}

// Update status function
function updateStatus(elementDot, elementText, status, text) {
  elementDot.className = 'status-dot';
  elementDot.classList.add(status);
  elementText.textContent = text;
}

// Parse connection URL
function parseConnectionUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.searchParams.get('host');
    const token = parsedUrl.searchParams.get('token');
    return { host, token };
  } catch (e) {
    console.error('Invalid connection URL:', e);
    return null;
  }
}

// Generate connection URL
function generateConnectionUrl(hostAddress, token) {
  return `p2pchat://connect?host=${hostAddress}&token=${token}`;
}

// Initialize host functionality
function initHost() {
  isHost = true;
  
  // Generate token
  ipcRenderer.invoke('generate-token').then(token => {
    currentToken = token;
    
    // Create token with TTL (time-to-live)
    const tokenData = {
      token: token,
      createdAt: Date.now(),
      ttl: 10 * 60 * 1000 // 10 minutes TTL
    };
    
    // For demo purposes, we'll use localhost:PORT
    // In a real implementation, we'd determine the public IP
    const hostAddress = '0.0.0.0:0'; // Placeholder - in real implementation, would be actual public IP and port
    const link = generateConnectionUrl(hostAddress, JSON.stringify(tokenData));
    invitationLink.value = link;
    
    updateStatus(hostStatusDot, hostStatusText, 'connecting', 'Waiting for guest...');
    
    // Create WebRTC peer (as initiator/host)
    peer = new SimplePeer({
      initiator: true,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });
    
    // Handle signal data to share with guest
    peer.on('signal', (data) => {
      // In a real implementation, this would be sent via a signaling server
      // For demo purposes, we'll use Electron IPC to share signaling data
      console.log('Host signaling data:', data);
      
      // Store the signaling data to be shared with the guest via IPC
      ipcRenderer.invoke('store-host-signal', JSON.stringify(data));
      
      // Also store the token to validate the connection
      ipcRenderer.invoke('store-connection-token', JSON.stringify(tokenData));
    });
    
    setupPeerEvents();
  });
}

// Setup WebRTC peer events
function setupPeerEvents() {
  if (!peer) return;
  
  peer.on('error', (err) => {
    console.error('WebRTC error:', err);
    if (isHost) {
      updateStatus(hostStatusDot, hostStatusText, 'disconnected', 'Connection error');
    } else {
      updateStatus(guestStatusDot, guestStatusText, 'disconnected', 'Connection error');
    }
    updateStatus(chatStatusDot, chatStatusText, 'disconnected', 'Disconnected');
  });
  
  peer.on('connect', () => {
    console.log('Connected!');
    if (isHost) {
      updateStatus(hostStatusDot, hostStatusText, 'connected', 'Connected to guest');
    } else {
      updateStatus(guestStatusDot, guestStatusText, 'connected', 'Connected to host');
    }
    updateStatus(chatStatusDot, chatStatusText, 'connected', 'Connected');
    
    // Show chat interface
    showPanel('chatContainer');
  });
  
  peer.on('data', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type === 'chat') {
        addMessageToChat(message.content, 'other');
      }
    } catch (e) {
      console.error('Error parsing received data:', e);
    }
  });
  
  peer.on('close', () => {
    console.log('Connection closed');
    updateStatus(chatStatusDot, chatStatusText, 'disconnected', 'Disconnected');
  });
}

// Initialize guest functionality
async function initGuest() {
  const link = connectLink.value.trim();
  if (!link) {
    alert('Please enter a connection link');
    return;
  }
  
  const parsed = parseConnectionUrl(link);
  if (!parsed || !parsed.host || !parsed.token) {
    alert('Invalid connection link format');
    return;
  }
  
  isHost = false;
  
  // Parse the token data which includes TTL
  let tokenData;
  try {
    tokenData = JSON.parse(parsed.token);
  } catch (e) {
    console.error('Error parsing token data:', e);
    alert('Invalid token format');
    return;
  }
  
  // Validate token TTL
  if (Date.now() - tokenData.createdAt > tokenData.ttl) {
    alert('Connection token has expired');
    updateStatus(guestStatusDot, guestStatusText, 'disconnected', 'Token expired');
    return;
  }
  
  currentToken = parsed.token;
  
  updateStatus(guestStatusDot, guestStatusText, 'connecting', 'Connecting...');
  
  // Get the signaling data from the host via IPC
  const hostSignalStr = await ipcRenderer.invoke('get-host-signal');
  const storedToken = await ipcRenderer.invoke('get-connection-token');
  
  if (!hostSignalStr) {
    alert('No signaling data from host. Connection cannot be established.');
    updateStatus(guestStatusDot, guestStatusText, 'disconnected', 'No signaling data');
    return;
  }
  
  // Validate the token
  if (!storedToken || storedToken !== JSON.stringify(tokenData)) {
    alert('Invalid connection token. Connection rejected.');
    updateStatus(guestStatusDot, guestStatusText, 'disconnected', 'Invalid token');
    return;
  }
  
  try {
    const hostSignal = JSON.parse(hostSignalStr);
    
    // Create WebRTC peer (as receiver/guest)
    peer = new SimplePeer({
      initiator: false,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });
    
    // Signal the host's data to establish connection
    peer.signal(hostSignal);
    
    setupPeerEvents();
  } catch (e) {
    console.error('Error parsing host signal:', e);
    updateStatus(guestStatusDot, guestStatusText, 'disconnected', 'Invalid signaling data');
  }
}

// Add message to chat
function addMessageToChat(message, sender) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);
  messageElement.textContent = message;
  chatMessages.appendChild(messageElement);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  
  if (peer && peer.connected) {
    const messageData = {
      type: 'chat',
      content: message
    };
    
    peer.send(JSON.stringify(messageData));
    addMessageToChat(message, 'own');
    messageInput.value = '';
  } else {
    alert('Not connected to peer');
  }
}

// Event Listeners
hostBtn.addEventListener('click', () => {
  showPanel('hostPanel');
});

guestBtn.addEventListener('click', () => {
  showPanel('guestPanel');
});

startHostBtn.addEventListener('click', initHost);

connectGuestBtn.addEventListener('click', initGuest);

copyLinkBtn.addEventListener('click', () => {
  if (invitationLink.value) {
    ipcRenderer.invoke('copy-to-clipboard', invitationLink.value).then(success => {
      if (success) {
        copyLinkBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyLinkBtn.textContent = 'Copy';
        }, 2000);
      }
    });
  }
});

sendMessageBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Back buttons
[backToModeBtn1, backToModeBtn2, backToModeBtn3].forEach(btn => {
  btn.addEventListener('click', () => {
    // Clean up peer connection if exists
    if (peer) {
      peer.destroy();
      peer = null;
    }
    
    // Clear signaling data
    ipcRenderer.invoke('clear-signaling-data');
    
    showPanel('modeSelection');
    updateStatus(chatStatusDot, chatStatusText, 'disconnected', 'Disconnected');
  });
});

// Initialize
updateStatus(chatStatusDot, chatStatusText, 'disconnected', 'Disconnected');