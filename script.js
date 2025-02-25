// ===========================================
// Firebase Integration: Auth Imports
// ===========================================
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getApps } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

// Use the already-initialized Firebase app from index.html
const auth = getAuth(getApps()[0]);

// ===========================================
// Chat App Code (Authentication & Chat)
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
  let currentUser = null;
  let currentConversationId = null;

  // --- DOM Elements ---
  const authContainer = document.getElementById("authContainer");
  const loginFormContainer = document.getElementById("loginFormContainer");
  const signupFormContainer = document.getElementById("signupFormContainer");
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const chatSection = document.getElementById("chatSection");
  const logoutBtn = document.getElementById("logout-btn");
  const conversationListEl = document.getElementById("conversationList");
  const conversationTitleEl = document.getElementById("conversationTitle");
  const chatMessages = document.getElementById("chatMessages");
  const sendButton = document.getElementById("sendButton");
  const messageInput = document.getElementById("messageInput");
  const imageUploadBtn = document.getElementById("imageUploadBtn");
  const imageInput = document.getElementById("imageInput");
  const newChatBtn = document.getElementById("newChatBtn");
  const newGroupBtn = document.getElementById("newGroupBtn");
  const userSearch = document.getElementById("userSearch");

  // --- LocalStorage Keys (simulate backend for chat data) ---
  const USERS_KEY = "registeredUsers";
  const CONVERSATIONS_KEY = "conversations";

  // ========== Utility Functions ==========
  function getRegisteredUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  }
  function saveRegisteredUser(identifier) {
    let users = getRegisteredUsers();
    if (!users.includes(identifier)) {
      users.push(identifier);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
  function getConversations() {
    return JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || "{}");
  }
  function saveConversations(convos) {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convos));
  }

  function updateConversationList() {
    const convos = getConversations();
    conversationListEl.innerHTML = "";
    for (let id in convos) {
      const convo = convos[id];
      const currentIdentifier = currentUser.email || currentUser.uid;
      if (convo.participants.includes(currentIdentifier)) {
        const div = document.createElement("div");
        div.classList.add("conversation-item");
        if (convo.isGroup) {
          div.textContent = convo.title;
        } else {
          const other = convo.participants.find(u => u !== currentIdentifier);
          div.textContent = other;
        }
        div.addEventListener("click", () => {
          currentConversationId = id;
          conversationTitleEl.textContent = convo.isGroup ? convo.title : div.textContent;
          loadConversationMessages();
        });
        conversationListEl.appendChild(div);
      }
    }
  }

  function loadConversationMessages() {
    chatMessages.innerHTML = "";
    const convos = getConversations();
    const convo = convos[currentConversationId];
    if (convo) {
      convo.messages.forEach(msg => {
        if (msg.type === "text") {
          addMessage(
            msg.content,
            msg.sender === (currentUser.email || currentUser.uid) ? "sent" : "received",
            false
          );
        } else if (msg.type === "image") {
          addImageMessage(
            msg.content,
            msg.sender === (currentUser.email || currentUser.uid) ? "sent" : "received",
            false
          );
        }
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function addMessage(text, type, scroll = true) {
    const messageEl = document.createElement("div");
    messageEl.classList.add("message", type);
    const textEl = document.createElement("div");
    textEl.classList.add("text");
    textEl.textContent = text;
    messageEl.appendChild(textEl);
    chatMessages.appendChild(messageEl);
    if (scroll) chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addImageMessage(imgSrc, type, scroll = true) {
    const messageEl = document.createElement("div");
    messageEl.classList.add("message", type);
    const imgEl = document.createElement("img");
    imgEl.src = imgSrc;
    messageEl.appendChild(imgEl);
    chatMessages.appendChild(messageEl);
    if (scroll) chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function saveMessageToConversation(messageObj) {
    let convos = getConversations();
    if (!convos[currentConversationId]) return;
    convos[currentConversationId].messages.push(messageObj);
    saveConversations(convos);
    loadConversationMessages();
  }

  // ========== UI Display Functions ==========
  function showAuth() {
    chatSection.style.display = "none";
    authContainer.style.display = "block";
  }
  function showChat() {
    authContainer.style.display = "none";
    chatSection.style.display = "flex";
    updateConversationList();
  }

  // ========== Firebase Auth State Listener ==========
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      saveRegisteredUser(user.email || user.uid);
      showChat();
    } else {
      showAuth();
    }
  });

  // ========== Tab Switching for Auth ==========
  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginFormContainer.style.display = "block";
    signupFormContainer.style.display = "none";
  });
  signupTab.addEventListener("click", () => {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupFormContainer.style.display = "block";
    loginFormContainer.style.display = "none";
  });

  // ========== Email/Password Login ==========
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    if (email && password) {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          currentUser = userCredential.user;
          showChat();
        })
        .catch((error) => {
          alert("Login failed: " + error.message);
        });
    }
  });

  // ========== Email/Password Sign Up ==========
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    if (email && password) {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          currentUser = userCredential.user;
          showChat();
        })
        .catch((error) => {
          alert("Sign Up failed: " + error.message);
        });
    }
  });

  // ========== Social Login ==========
  document.querySelectorAll(".social-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const providerName = btn.getAttribute("data-provider");
      let provider;
      if (providerName === "Google") {
        provider = new GoogleAuthProvider();
      } else if (providerName === "Facebook") {
        provider = new FacebookAuthProvider();
      } else if (providerName === "Twitter") {
        provider = new TwitterAuthProvider();
      } else if (providerName === "Phone") {
        alert("Phone authentication is not implemented in this demo.");
        return;
      }
      signInWithPopup(auth, provider)
        .then((result) => {
          currentUser = result.user;
          showChat();
        })
        .catch((error) => {
          alert("Social login failed: " + error.message);
        });
    });
  });

  // ========== Logout ==========
  logoutBtn.addEventListener("click", () => {
    auth.signOut()
      .then(() => {
        currentUser = null;
        currentConversationId = null;
        showAuth();
      })
      .catch((error) => {
        alert("Logout failed: " + error.message);
      });
  });

  // ========== Chat Functionality ==========
  // New Chat: Prompt user to enter a target email; search through registered users.
  newChatBtn.addEventListener("click", () => {
    let targetUser = prompt("Enter the email of the user to chat with:");
    const currentIdentifier = currentUser.email || currentUser.uid;
    if (!targetUser || targetUser === currentIdentifier) {
      alert("Invalid email.");
      return;
    }
    const users = getRegisteredUsers();
    if (!users.includes(targetUser)) {
      alert("User not found.");
      return;
    }
    let convoId = "chat_" + [currentIdentifier, targetUser].sort().join("_");
    let convos = getConversations();
    if (!convos[convoId]) {
      convos[convoId] = {
        id: convoId,
        isGroup: false,
        participants: [currentIdentifier, targetUser],
        messages: []
      };
      saveConversations(convos);
    }
    currentConversationId = convoId;
    conversationTitleEl.textContent = targetUser;
    loadConversationMessages();
    updateConversationList();
  });

  // New Group Chat: Prompt for group name and comma-separated emails.
  newGroupBtn.addEventListener("click", () => {
    let groupName = prompt("Enter a group chat name:");
    if (!groupName) return;
    let usersInput = prompt("Enter emails to add (comma separated):");
    if (!usersInput) return;
    let currentIdentifier = currentUser.email || currentUser.uid;
    let participants = usersInput.split(",").map(u => u.trim()).filter(u => u && u !== currentIdentifier);
    const registered = getRegisteredUsers();
    participants = participants.filter(u => registered.includes(u));
    if (participants.length === 0) {
      alert("No valid users entered.");
      return;
    }
    participants.push(currentIdentifier);
    let convoId = "group_" + Date.now();
    let convos = getConversations();
    convos[convoId] = {
      id: convoId,
      isGroup: true,
      title: groupName,
      participants,
      messages: []
    };
    saveConversations(convos);
    currentConversationId = convoId;
    conversationTitleEl.textContent = groupName;
    loadConversationMessages();
    updateConversationList();
  });

  // Send text message
  sendButton.addEventListener("click", () => {
    const text = messageInput.value.trim();
    if (text === "" || !currentConversationId) return;
    const messageObj = {
      sender: currentUser.email || currentUser.uid,
      type: "text",
      content: text,
      timestamp: Date.now()
    };
    saveMessageToConversation(messageObj);
    messageInput.value = "";
  });
  messageInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") sendButton.click();
  });

  // Image Upload
  imageUploadBtn.addEventListener("click", () => {
    if (!currentConversationId) return;
    imageInput.click();
  });
  imageInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0] && currentConversationId) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = function(event) {
        const messageObj = {
          sender: currentUser.email || currentUser.uid,
          type: "image",
          content: event.target.result,
          timestamp: Date.now()
        };
        saveMessageToConversation(messageObj);
      };
      reader.readAsDataURL(file);
      imageInput.value = "";
    }
  });

  // Search Functionality: Filter registered users as you type.
  userSearch.addEventListener("input", () => {
    const query = userSearch.value.trim().toLowerCase();
    const users = getRegisteredUsers();
    // Clear the conversation list and show matching users (not already in a chat)
    conversationListEl.innerHTML = "";
    users.filter(u => u !== (currentUser.email || currentUser.uid))
      .filter(u => u.toLowerCase().includes(query))
      .forEach(u => {
        const div = document.createElement("div");
        div.classList.add("conversation-item");
        div.textContent = u;
        div.addEventListener("click", () => {
          // Start a new chat with the selected user
          let convoId = "chat_" + [(currentUser.email || currentUser.uid), u].sort().join("_");
          let convos = getConversations();
          if (!convos[convoId]) {
            convos[convoId] = {
              id: convoId,
              isGroup: false,
              participants: [currentUser.email || currentUser.uid, u],
              messages: []
            };
            saveConversations(convos);
          }
          currentConversationId = convoId;
          conversationTitleEl.textContent = u;
          loadConversationMessages();
          updateConversationList();
        });
        conversationListEl.appendChild(div);
      });
  });

  // Listen for localStorage changes across tabs
  window.addEventListener("storage", (e) => {
    if (e.key === CONVERSATIONS_KEY) {
      updateConversationList();
      if (currentConversationId) loadConversationMessages();
    }
  });
});