import { subscribeAuthState } from './auth.js';
import { db } from './firebase-config.js';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { uploadToCloudinary, compressImageIfNeeded } from './cloudinary-config.js';
import { showToast } from './main.js';
import { getLanguage, t } from './i18n.js';

let currentUser = null;
let currentUserData = null;
let chatUnsubscribe = null;
let messagesUnsubscribe = null;
let currentChatDoc = null;
let pendingFile = null;
let uploadCancelFn = null;
let lastSentTime = 0;
let typingTimeout = null;
let initialLoadComplete = false;
const originalTitle = document.title;

const EMOJI_LIST = ['😊', '😂', '👍', '❤️', '🔥', '🎉', '🙏', '😍', '👋', '🚀', '💯', '✨', '👌', '🤝', '💼', '📱', '💻', '⭐', '⚡', '✅'];

document.addEventListener('DOMContentLoaded', () => {
  initChatUI();

  subscribeAuthState((user, userData) => {
    currentUser = user;
    currentUserData = userData;
    updateChatAuthUI();
  });
});

function initChatUI() {
  // 1. Emoji Drawer Injection
  const emojiDrawer = document.getElementById('emoji-picker-drawer');
  if (emojiDrawer) {
    emojiDrawer.innerHTML = EMOJI_LIST.map(emoji => `
      <button type="button" class="btn-emoji hover:scale-125 text-xl p-1 transition-transform cursor-pointer" data-emoji="${emoji}">
        ${emoji}
      </button>
    `).join('');

    emojiDrawer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-emoji');
      if (btn) {
        const emoji = btn.getAttribute('data-emoji');
        const textarea = document.getElementById('chat-textarea');
        if (textarea) {
          textarea.value += emoji;
          textarea.focus();
          autoResizeTextarea(textarea);
        }
      }
    });
  }

  // 2. Toggle Emoji Button
  document.getElementById('btn-toggle-emoji')?.addEventListener('click', () => {
    emojiDrawer?.classList.toggle('hidden');
  });

  // 3. Auto-growing Textarea (Up to 5 lines)
  const textarea = document.getElementById('chat-textarea');
  if (textarea) {
    textarea.addEventListener('input', () => {
      autoResizeTextarea(textarea);
      handleTypingIndicator();
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
        e.preventDefault();
        document.getElementById('chat-input-form')?.requestSubmit();
      }
    });
  }

  // 4. File Attachment Handler
  const fileInput = document.getElementById('chat-file-input');
  fileInput?.addEventListener('change', handleFileSelect);

  document.getElementById('btn-remove-attachment')?.addEventListener('click', removeAttachment);

  // 5. Form Submit Handler
  document.getElementById('chat-input-form')?.addEventListener('submit', handleSendMessage);

  // 6. Scroll to bottom button
  const messagesContainer = document.getElementById('chat-messages-container');
  const scrollBottomBtn = document.getElementById('btn-scroll-bottom');

  messagesContainer?.addEventListener('scroll', () => {
    if (!messagesContainer) return;
    const distFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    if (distFromBottom > 150) {
      scrollBottomBtn?.classList.remove('hidden');
    } else {
      scrollBottomBtn?.classList.add('hidden');
      document.getElementById('unread-scroll-count')?.classList.add('hidden');
    }
  });

  scrollBottomBtn?.addEventListener('click', () => {
    scrollToBottom(true);
  });

  // 7. Media Viewer Close
  document.getElementById('btn-close-media-viewer')?.addEventListener('click', () => {
    document.getElementById('media-viewer-modal')?.classList.add('hidden');
  });

  // Reset document title on tab click
  window.addEventListener('focus', () => {
    document.title = originalTitle;
  });
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  const maxHeight = 120; // 5 lines approx
  el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
}

function updateChatAuthUI() {
  const loginPrompt = document.getElementById('chat-login-prompt');
  const activeContainer = document.getElementById('chat-active-container');

  if (!currentUser) {
    loginPrompt?.classList.remove('hidden');
    activeContainer?.classList.add('hidden');
    cleanupListeners();
  } else {
    loginPrompt?.classList.add('hidden');
    activeContainer?.classList.remove('hidden');
    startChatSession();
  }
}

async function startChatSession() {
  if (!currentUser) return;
  const uid = currentUser.uid;

  // Initialize or update user chat document in Firestore
  const chatRef = doc(db, 'chats', uid);
  const now = new Date().toISOString();
  const userName = currentUserData?.name || currentUser.displayName || 'User';
  const userEmail = currentUser.email || '';
  const userPhoto = currentUserData?.photoURL || currentUser.photoURL || '';
  const username = currentUserData?.username || '';

  try {
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      await setDoc(chatRef, {
        uid: uid,
        userName: userName,
        userEmail: userEmail,
        userPhoto: userPhoto,
        username: username,
        lastMessage: 'Chat initialized',
        lastMessageAt: now,
        lastSender: 'user',
        unreadForAdmin: 0,
        unreadForUser: 0,
        status: 'open',
        pinned: false,
        blocked: false,
        userTyping: false,
        adminTyping: false,
        userLastSeen: now,
        createdAt: now,
        tags: [],
        adminNote: ''
      });
    } else {
      await updateDoc(chatRef, {
        userName: userName,
        userEmail: userEmail,
        userPhoto: userPhoto,
        username: username,
        userLastSeen: now
      });
    }
  } catch (e) {
    console.error('Error setting up chat session:', e);
  }

  // Subscribe to Chat Doc (for status, typing, blocked state)
  cleanupListeners();

  chatUnsubscribe = onSnapshot(chatRef, (snapshot) => {
    if (snapshot.exists()) {
      currentChatDoc = snapshot.data();
      renderChatMetaState(currentChatDoc);
    }
  }, (err) => {
    console.warn('Chat snapshot error:', err);
    showConnectionStatus(false);
  });

  // Subscribe to Messages Sub-collection
  const messagesRef = collection(db, 'chats', uid, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

  messagesUnsubscribe = onSnapshot(q, (snapshot) => {
    showConnectionStatus(true);
    const messages = [];

    snapshot.forEach(docSnap => {
      messages.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Detect new admin message
    if (initialLoadComplete && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'admin') {
        playNotificationSound();
        document.title = "(1) New reply | WebWorldBD Support";
      }
    }
    initialLoadComplete = true;

    renderMessages(messages);

    // Check if user should mark unread admin messages as read
    const unreadAdminMsgs = messages.filter(m => m.sender === 'admin' && !m.readAt);
    if (unreadAdminMsgs.length > 0) {
      markAdminMessagesAsRead(uid, unreadAdminMsgs);
    }
  }, (err) => {
    console.warn('Messages snapshot error:', err);
    showConnectionStatus(false);
  });
}

function playNotificationSound() {
  try {
    const audio = document.getElementById('chat-sound-notify');
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  } catch (e) {}
}

function cleanupListeners() {
  if (chatUnsubscribe) { chatUnsubscribe(); chatUnsubscribe = null; }
  if (messagesUnsubscribe) { messagesUnsubscribe(); messagesUnsubscribe = null; }
}

function showConnectionStatus(online) {
  const banner = document.getElementById('chat-connection-banner');
  const text = document.getElementById('chat-connection-text');
  if (!banner) return;

  if (online) {
    banner.classList.add('hidden');
  } else {
    banner.classList.remove('hidden');
    if (text) text.textContent = getLanguage() === 'en' ? 'Connecting to server...' : 'সার্ভারে সংযোগ হচ্ছে...';
  }
}

function renderChatMetaState(chatData) {
  const adminDot = document.getElementById('admin-status-dot');
  const adminText = document.getElementById('admin-status-text');
  const blockedBanner = document.getElementById('chat-blocked-banner');
  const inputForm = document.getElementById('chat-input-form');

  if (chatData.adminTyping) {
    if (adminText) {
      adminText.innerHTML = `<span class="text-sky-500 font-bold animate-pulse">typing...</span>`;
    }
  } else {
    if (adminText) {
      adminText.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span> <span>Online</span>`;
    }
  }

  if (adminDot) {
    adminDot.className = `absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900`;
  }

  // Handle Blocked State
  if (chatData.blocked) {
    blockedBanner?.classList.remove('hidden');
    inputForm?.classList.add('opacity-50', 'pointer-events-none');
  } else {
    blockedBanner?.classList.add('hidden');
    inputForm?.classList.remove('opacity-50', 'pointer-events-none');
  }
}

function renderMessages(messages) {
  const container = document.getElementById('chat-messages-container');
  const emptyState = document.getElementById('chat-empty-state');
  if (!container) return;

  if (!messages || messages.length === 0) {
    emptyState?.classList.remove('hidden');
    return;
  }
  emptyState?.classList.add('hidden');

  let html = '';
  let lastDateStr = '';

  messages.forEach(msg => {
    const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : (msg.createdAt ? new Date(msg.createdAt) : new Date());
    const dateStr = formatDateSeparator(msgDate);

    if (dateStr !== lastDateStr) {
      html += `
        <div class="flex justify-center my-3">
          <span class="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider shadow-xs">
            ${dateStr}
          </span>
        </div>
      `;
      lastDateStr = dateStr;
    }

    const isUser = msg.sender === 'user';
    const timeStr = formatTime(msgDate);

    if (isUser) {
      // User Message Bubble (Blue to Purple Gradient, Right side)
      html += `
        <div class="flex justify-end items-end gap-2 my-1 group">
          <div class="max-w-[85%] sm:max-w-[70%] space-y-1">
            <div class="p-3.5 rounded-3xl rounded-br-xs bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs leading-relaxed shadow-md">
              ${renderMessageContent(msg)}
            </div>
            <div class="flex items-center justify-end gap-1 text-[10px] text-slate-400 px-1">
              <span>${timeStr}</span>
              ${renderStatusTicks(msg)}
            </div>
          </div>
        </div>
      `;
    } else {
      // Admin Message Bubble (White Glass, Left side)
      html += `
        <div class="flex justify-start items-end gap-2.5 my-1 group">
          <div class="w-8 h-8 rounded-full bg-slate-900 overflow-hidden ring-1 ring-sky-400 shrink-0">
            <img src="./assets/logo.png?v=2" alt="Admin" class="w-full h-full object-contain p-0.5">
          </div>
          <div class="max-w-[85%] sm:max-w-[70%] space-y-1">
            <div class="p-3.5 rounded-3xl rounded-bl-xs bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs leading-relaxed shadow-xs">
              ${renderMessageContent(msg)}
            </div>
            <div class="flex items-center justify-start gap-1 text-[10px] text-slate-400 px-1">
              <span>${timeStr}</span>
            </div>
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html;
  scrollToBottom(false);
  attachMediaClickHandlers();
}

function renderMessageContent(msg) {
  if (msg.deleted) {
    return `<span class="italic text-slate-400"><i class="fa-solid fa-ban text-[10px] mr-1"></i> This message was deleted</span>`;
  }

  let content = '';

  if (msg.type === 'image' && msg.fileUrl) {
    content += `
      <div class="overflow-hidden rounded-2xl mb-1.5 cursor-pointer media-thumbnail" data-src="${msg.fileUrl}">
        <img src="${msg.fileUrl}" alt="${msg.fileName || 'Image'}" class="w-full max-h-60 object-cover hover:scale-105 transition-transform duration-200">
      </div>
    `;
  } else if (msg.type === 'video' && msg.fileUrl) {
    content += `
      <div class="overflow-hidden rounded-2xl mb-1.5 bg-black">
        <video src="${msg.fileUrl}" controls class="w-full max-h-60 rounded-2xl"></video>
      </div>
    `;
  } else if (msg.type === 'audio' && msg.fileUrl) {
    content += `
      <div class="p-2 bg-slate-100 dark:bg-slate-900/60 rounded-2xl mb-1.5">
        <audio src="${msg.fileUrl}" controls class="w-full h-8"></audio>
      </div>
    `;
  } else if (msg.type === 'file' && msg.fileUrl) {
    content += `
      <a href="${msg.fileUrl}" target="_blank" download="${msg.fileName || 'file'}" class="flex items-center gap-3 p-2.5 rounded-2xl bg-white/20 dark:bg-slate-900/40 hover:bg-white/30 border border-white/20 mb-1.5 transition-colors">
        <div class="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center text-base shrink-0">
          <i class="fa-solid fa-file-arrow-down"></i>
        </div>
        <div class="overflow-hidden flex-1">
          <p class="font-bold text-xs truncate">${escapeHTML(msg.fileName || 'Attachment')}</p>
          <p class="text-[10px] opacity-80">${formatBytes(msg.fileSize || 0)}</p>
        </div>
        <i class="fa-solid fa-download text-xs opacity-80"></i>
      </a>
    `;
  }

  if (msg.text) {
    content += `<p class="whitespace-pre-wrap break-words">${autolinkText(escapeHTML(msg.text))}</p>`;
  }

  return content;
}

function renderStatusTicks(msg) {
  if (msg.readAt) {
    return `<i class="fa-solid fa-check-double text-sky-300 text-[10px]" title="Read"></i>`;
  } else if (msg.deliveredAt) {
    return `<i class="fa-solid fa-check-double text-slate-400 text-[10px]" title="Delivered"></i>`;
  } else {
    return `<i class="fa-solid fa-check text-slate-400 text-[10px]" title="Sent"></i>`;
  }
}

function scrollToBottom(force = false) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;
  if (force || (container.scrollHeight - container.scrollTop - container.clientHeight < 250)) {
    container.scrollTop = container.scrollHeight;
  }
}

async function markAdminMessagesAsRead(uid, unreadMsgs) {
  try {
    const batch = writeBatch(db);
    const nowIso = new Date().toISOString();

    unreadMsgs.forEach(m => {
      const msgRef = doc(db, 'chats', uid, 'messages', m.id);
      batch.update(msgRef, { readAt: nowIso });
    });

    const chatRef = doc(db, 'chats', uid);
    batch.update(chatRef, { unreadForUser: 0 });

    await batch.commit();
  } catch (e) {
    console.warn('Error marking messages as read:', e);
  }
}

/* ================= FILE SELECTION & UPLOAD ================= */

async function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const blockedExts = ['.exe', '.apk', '.bat', '.js', '.sh'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (blockedExts.includes(ext)) {
    const errorMsg = getLanguage() === 'en'
      ? 'Executable files (.exe, .apk, .bat, .js, .sh) are strictly prohibited.'
      : 'এক্সিকিউটেবল ফাইল (.exe, .apk, .bat, .js, .sh) আপলোড করা সম্পূর্ণ নিষেধ।';
    showToast(errorMsg, 'error');
    e.target.value = '';
    return;
  }

  const MAX_SIZE = 30 * 1024 * 1024; // 30MB
  if (file.size > MAX_SIZE) {
    const errorMsg = getLanguage() === 'en'
      ? 'Maximum file size allowed is 30MB.'
      : 'সর্বোচ্চ ৩০MB সাইজের ফাইল আপলোড করা যাবে।';
    showToast(errorMsg, 'error');
    e.target.value = '';
    return;
  }

  pendingFile = file;

  // Compress image if >2000px width/height
  if (file.type.startsWith('image/')) {
    try {
      pendingFile = await compressImageIfNeeded(file, 2000, 2000, 0.85);
    } catch (err) {
      console.warn('Image compression skipped:', err);
    }
  }

  renderAttachmentPreview(pendingFile);
}

function renderAttachmentPreview(file) {
  const previewBox = document.getElementById('attachment-preview-box');
  const nameEl = document.getElementById('attachment-preview-name');
  const sizeEl = document.getElementById('attachment-preview-size');
  const iconEl = document.getElementById('attachment-preview-icon');

  if (!previewBox || !file) return;

  previewBox.classList.remove('hidden');
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = formatBytes(file.size);

  let iconClass = 'fa-solid fa-file text-sky-500 text-lg';
  if (file.type.startsWith('image/')) iconClass = 'fa-solid fa-file-image text-emerald-500 text-lg';
  if (file.type.startsWith('video/')) iconClass = 'fa-solid fa-file-video text-purple-500 text-lg';
  if (file.type.startsWith('audio/')) iconClass = 'fa-solid fa-file-audio text-amber-500 text-lg';
  if (file.type.includes('pdf')) iconClass = 'fa-solid fa-file-pdf text-red-500 text-lg';

  if (iconEl) iconEl.className = iconClass;
}

function removeAttachment() {
  pendingFile = null;
  const previewBox = document.getElementById('attachment-preview-box');
  const fileInput = document.getElementById('chat-file-input');
  if (previewBox) previewBox.classList.add('hidden');
  if (fileInput) fileInput.value = '';
}

/* ================= SEND MESSAGE HANDLER ================= */

async function handleSendMessage(e) {
  e.preventDefault();
  if (!currentUser) return;

  const now = Date.now();
  if (now - lastSentTime < 1000) { // Rate limit 1 sec
    showToast(getLanguage() === 'en' ? 'Slow down! Max 1 message per second.' : 'ধীরে বার্তা পাঠান! প্রতি সেকেন্ডে সর্বোচ্চ ১টি।', 'error');
    return;
  }

  const textarea = document.getElementById('chat-textarea');
  const text = textarea?.value.trim() || '';

  if (!text && !pendingFile) return;

  if (text.length > 2000) {
    showToast(getLanguage() === 'en' ? 'Message exceeds 2000 characters limit.' : 'মেসেজ ২০০০ অক্ষরের সীমা অতিক্রম করেছে।', 'error');
    return;
  }

  lastSentTime = now;
  const sendBtn = document.getElementById('btn-send-message');
  if (sendBtn) sendBtn.disabled = true;

  let uploadedFile = null;

  // Upload attachment to Cloudinary if selected
  if (pendingFile) {
    const progressCard = document.getElementById('upload-progress-card');
    const filenameText = document.getElementById('upload-filename-text');
    const percentText = document.getElementById('upload-percent-text');
    const progressBar = document.getElementById('upload-progress-bar');
    const cancelBtn = document.getElementById('btn-cancel-upload');

    progressCard?.classList.remove('hidden');
    if (filenameText) filenameText.textContent = pendingFile.name;

    try {
      uploadedFile = await uploadToCloudinary(pendingFile, {
        folder: 'webworldbd_uploads/chat',
        onProgress: (percent) => {
          if (percentText) percentText.textContent = `${percent}%`;
          if (progressBar) progressBar.style.width = `${percent}%`;
        },
        registerCancel: (cancelFn) => {
          uploadCancelFn = cancelFn;
        }
      });
    } catch (err) {
      console.error('File upload error:', err);
      progressCard?.classList.add('hidden');
      if (sendBtn) sendBtn.disabled = false;
      showToast(getLanguage() === 'en' ? 'File upload failed. Please try again.' : 'ফাইল আপলোড ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।', 'error');
      return;
    } finally {
      progressCard?.classList.add('hidden');
      uploadCancelFn = null;
    }
  }

  // Determine Message Type
  let msgType = 'text';
  if (uploadedFile) {
    if (pendingFile.type.startsWith('image/')) msgType = 'image';
    else if (pendingFile.type.startsWith('video/')) msgType = 'video';
    else if (pendingFile.type.startsWith('audio/')) msgType = 'audio';
    else msgType = 'file';
  }

  const uid = currentUser.uid;
  const messagesRef = collection(db, 'chats', uid, 'messages');
  const chatRef = doc(db, 'chats', uid);
  const isoTime = new Date().toISOString();

  const messageData = {
    sender: 'user',
    senderId: uid,
    text: text,
    type: msgType,
    fileUrl: uploadedFile ? uploadedFile.secure_url : '',
    fileName: pendingFile ? pendingFile.name : '',
    fileSize: pendingFile ? pendingFile.size : 0,
    mimeType: pendingFile ? pendingFile.type : '',
    createdAt: serverTimestamp(),
    deliveredAt: isoTime,
    readAt: null,
    deleted: false,
    edited: false
  };

  try {
    // Add message doc
    await addDoc(messagesRef, messageData);

    // Update parent chat document atomically/batch
    const lastMsgPreview = text || (uploadedFile ? `📎 ${pendingFile.name}` : 'File');
    await updateDoc(chatRef, {
      lastMessage: lastMsgPreview,
      lastMessageAt: isoTime,
      lastSender: 'user',
      unreadForAdmin: (currentChatDoc?.unreadForAdmin || 0) + 1,
      userTyping: false,
      userLastSeen: isoTime
    });

    // Reset Input Fields
    if (textarea) {
      textarea.value = '';
      autoResizeTextarea(textarea);
    }
    removeAttachment();
    document.getElementById('emoji-picker-drawer')?.classList.add('hidden');
  } catch (err) {
    console.error('Error sending message:', err);
    showToast(getLanguage() === 'en' ? 'Failed to send message.' : 'মেসেজ পাঠাতে ব্যর্থ হয়েছে।', 'error');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

function handleTypingIndicator() {
  if (!currentUser) return;
  const uid = currentUser.uid;
  const chatRef = doc(db, 'chats', uid);

  updateDoc(chatRef, { userTyping: true }).catch(() => {});

  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    updateDoc(chatRef, { userTyping: false }).catch(() => {});
  }, 2500);
}

function attachMediaClickHandlers() {
  document.querySelectorAll('.media-thumbnail').forEach(el => {
    el.addEventListener('click', (e) => {
      const src = e.currentTarget.getAttribute('data-src');
      if (!src) return;

      const modal = document.getElementById('media-viewer-modal');
      const img = document.getElementById('media-viewer-img');
      const downloadBtn = document.getElementById('btn-download-media');

      if (img) img.src = src;
      if (downloadBtn) downloadBtn.href = src;
      modal?.classList.remove('hidden');
    });
  });
}

/* ================= UTILITY FUNCTIONS ================= */

function formatDateSeparator(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return getLanguage() === 'en' ? 'Today' : 'আজ';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return getLanguage() === 'en' ? 'Yesterday' : 'গতকাল';
  } else {
    return date.toLocaleDateString(getLanguage() === 'en' ? 'en-US' : 'bn-BD', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

function formatTime(date) {
  return date.toLocaleTimeString(getLanguage() === 'en' ? 'en-US' : 'bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function autolinkText(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline hover:text-sky-300 break-all">${url}</a>`);
}
