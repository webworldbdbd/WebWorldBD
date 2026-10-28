// Shared Request Card Component for WebWorldBD
// Renders project requests in Admin Panel, Live Chat Inbox, and User Profile.

import { db } from './firebase-config.js';
import { doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from './main.js';
import { getLanguage } from './i18n.js';

export function formatTimeAgo(dateInput) {
  if (!dateInput) return 'Recently';
  const date = typeof dateInput.toDate === 'function' ? dateInput.toDate() : new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  return date.toLocaleDateString();
}

export function formatExactDateTime(dateInput) {
  if (!dateInput) return '';
  const date = typeof dateInput.toDate === 'function' ? dateInput.toDate() : new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export function getStatusBadgeClass(status) {
  const normalized = (status || 'new').toLowerCase().trim();
  if (normalized === 'new') {
    return 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
  }
  if (normalized === 'contacted') {
    return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
  }
  if (normalized === 'in progress' || normalized === 'in-progress') {
    return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
  }
  if (normalized === 'completed') {
    return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  }
  if (normalized === 'rejected') {
    return 'bg-red-500/20 text-red-400 border border-red-500/30';
  }
  return 'bg-slate-700 text-slate-300 border border-slate-600';
}

function autolinkText(text) {
  if (!text) return '';
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return escaped.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline text-sky-400 hover:text-sky-300 break-all">${url}</a>`);
}

export function generatePlainTextRequest(req) {
  const reqId = req.requestId || req.id || 'N/A';
  const name = req.name || req.userName || 'N/A';
  const mobile = req.mobile || 'N/A';
  const email = req.email || req.userEmail || 'N/A';
  const category = req.category || 'N/A';
  const budget = req.budget || 'Unspecified';
  const attachment = req.attachment?.url || 'None';
  const sent = formatExactDateTime(req.createdAt) || 'N/A';
  const requirements = req.requirements || 'N/A';

  return `📋 NEW PROJECT REQUEST — ${reqId}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 Name: ${name}\n` +
    `📱 Mobile: ${mobile}\n` +
    `✉️ Email: ${email}\n` +
    `🗂 Category: ${category}\n` +
    `💰 Budget: ${budget}\n` +
    `📎 Attachment: ${attachment}\n` +
    `🕒 Sent: ${sent}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📝 Requirements:\n` +
    `${requirements}`;
}

export function renderRequestCardHtml(req, options = {}) {
  const {
    isAdmin = false,
    isChatBubble = false,
    cardId = `req-card-${req.id || req.requestId || Math.random().toString(36).substring(2, 9)}`
  } = options;

  const reqId = req.requestId || req.id || 'WW-000000';
  const status = req.status || 'New';
  const createdDate = req.createdAt;
  const timeAgo = formatTimeAgo(createdDate);
  const exactDate = formatExactDateTime(createdDate);

  const cleanMobile = req.mobile ? req.mobile.replace(/\s+/g, '') : '';
  const waMobile = cleanMobile ? '880' + cleanMobile.replace(/^(?:\+880|880|0)/, '') : '';
  const waGreeting = encodeURIComponent(
    `Hello ${req.name || 'Client'}, this is WebWorldBD regarding your project request [${reqId}] (${req.category || 'General'}). How can we assist you?`
  );

  const reqText = req.requirements || '';
  const isLongReq = reqText.length > 300;

  // Attachment Block
  let attachmentHtml = '';
  if (req.attachment && req.attachment.url) {
    const url = req.attachment.url;
    const fileName = req.attachment.name || 'Attachment';
    const fileSize = req.attachment.size ? Math.round(req.attachment.size / 1024) + ' KB' : '';
    const isImage = (req.attachment.type && req.attachment.type.startsWith('image/')) || url.match(/\.(jpg|jpeg|png|webp)/i);

    if (isImage) {
      attachmentHtml = `
        <div class="mt-3 p-3 rounded-2xl bg-slate-900/80 dark:bg-slate-900/90 border border-slate-700/80 space-y-2">
          <p class="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
            <i class="fa-solid fa-image"></i> Attachment Reference
          </p>
          <div class="relative group max-h-48 overflow-hidden rounded-xl border border-slate-800 bg-black/40">
            <img src="${url}" alt="${fileName}" class="w-full h-full object-contain cursor-pointer max-h-44 hover:scale-105 transition-transform" onclick="window.open('${url}', '_blank')">
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-400 truncate max-w-[180px]">${fileName}</span>
            <a href="${url}" target="_blank" download="${fileName}" class="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 font-bold hover:bg-sky-500/30 transition-colors flex items-center gap-1">
              <i class="fa-solid fa-download"></i> Open
            </a>
          </div>
        </div>
      `;
    } else {
      attachmentHtml = `
        <div class="mt-3 p-3 rounded-2xl bg-slate-900/80 dark:bg-slate-900/90 border border-slate-700/80 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-base shrink-0">
              <i class="fa-solid fa-file-lines"></i>
            </div>
            <div class="overflow-hidden">
              <p class="text-xs font-bold text-white truncate max-w-[180px]">${fileName}</p>
              <p class="text-[10px] text-slate-400">${fileSize || 'Document'}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <a href="${url}" target="_blank" download="${fileName}" class="px-2.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-400 text-xs font-bold hover:bg-sky-500/30 transition-colors flex items-center gap-1">
              <i class="fa-solid fa-download"></i> Download
            </a>
          </div>
        </div>
      `;
    }
  }

  return `
    <div id="${cardId}" class="request-card-printable p-4 sm:p-5 rounded-3xl bg-slate-900/95 text-slate-100 border border-slate-800 shadow-2xl space-y-4 ${isChatBubble ? 'w-full max-w-xl mx-auto' : 'w-full'} font-sans">

      <!-- Card Header -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <span class="text-base sm:text-lg font-black bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent flex items-center gap-1.5">
            📋 New Project Request
          </span>
          <button type="button" onclick="navigator.clipboard.writeText('${reqId}'); showToast('Request ID copied: ${reqId}', 'success');" class="px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sky-400 font-mono text-xs font-bold border border-slate-700 cursor-pointer transition-colors" title="Click to copy Request ID">
            ${reqId} <i class="fa-regular fa-copy text-[10px] ml-1"></i>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(status)}">
            ${status}
          </span>
          <span class="text-[10px] text-slate-400 font-medium" title="${exactDate}">
            ${timeAgo}
          </span>
        </div>
      </div>

      <!-- Client Block -->
      <div class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 ring-2 ring-sky-400/50">
            <img src="${req.userPhoto || './assets/logo.png?v=2'}" alt="Avatar" class="w-full h-full object-cover" onerror="this.src='./assets/logo.png?v=2';">
          </div>
          <div class="overflow-hidden">
            <div class="flex items-center gap-1.5">
              <p class="font-extrabold text-sm text-white truncate">${req.name || req.userName || 'Client'}</p>
              <span class="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Registered User</span>
            </div>
            ${req.username ? `<p class="text-xs text-sky-400 font-mono">@${req.username}</p>` : `<p class="text-xs text-slate-400">${req.userEmail || ''}</p>`}
          </div>
        </div>

        <!-- Quick Contact Buttons -->
        <div class="flex items-center gap-1.5 print:hidden">
          ${req.userId ? `<button type="button" onclick="if(window.openAdminChat) window.openAdminChat('${req.userId}'); else window.location.href='./livechat.html';" class="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 font-bold text-xs transition-colors" title="Chat with client"><i class="fa-solid fa-comments"></i> Chat</button>` : ''}
          ${waMobile ? `<a href="https://wa.me/${waMobile}?text=${waGreeting}" target="_blank" class="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs transition-colors" title="Message on WhatsApp"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ''}
          ${req.mobile ? `<a href="tel:${req.mobile}" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors" title="Call client"><i class="fa-solid fa-phone"></i> Call</a>` : ''}
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
          <span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-mobile-screen text-sky-400"></i> Mobile Number:</span>
          <div class="flex items-center gap-1 font-bold text-emerald-400">
            <span>${req.mobile || 'N/A'}</span>
            ${req.mobile ? `<button type="button" onclick="navigator.clipboard.writeText('${req.mobile}'); showToast('Mobile number copied', 'success');" class="p-1 hover:text-white text-slate-500 transition-colors"><i class="fa-regular fa-copy"></i></button>` : ''}
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
          <span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-envelope text-indigo-400"></i> Email Address:</span>
          <div class="flex items-center gap-1 font-bold text-slate-200 truncate max-w-[140px]">
            <span class="truncate">${req.email || req.userEmail || 'N/A'}</span>
            ${(req.email || req.userEmail) ? `<button type="button" onclick="navigator.clipboard.writeText('${req.email || req.userEmail}'); showToast('Email copied', 'success');" class="p-1 hover:text-white text-slate-500 transition-colors shrink-0"><i class="fa-regular fa-copy"></i></button>` : ''}
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
          <span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-coins text-amber-400"></i> Estimated Budget:</span>
          <span class="font-bold text-amber-300 font-mono">${req.budget || 'Unspecified'}</span>
        </div>

        <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
          <span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-layer-group text-purple-400"></i> Category:</span>
          <span class="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">${req.category || 'Custom'}</span>
        </div>

        <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
          <span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-language text-sky-400"></i> Language:</span>
          <span class="font-bold text-sky-300 uppercase">${req.language || 'EN'}</span>
        </div>

        <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
          <span class="text-slate-400 flex items-center gap-1.5"><i class="fa-solid fa-globe text-emerald-400"></i> Sent From:</span>
          <span class="font-bold text-slate-300 capitalize">${req.source || 'website'}</span>
        </div>
      </div>

      <!-- Requirements Block -->
      <div class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span class="font-bold text-xs uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <i class="fa-solid fa-quote-left"></i> Project Requirements
          </span>
          <button type="button" onclick="navigator.clipboard.writeText(\`${reqText.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`); showToast('Requirements copied to clipboard', 'success');" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1">
            <i class="fa-regular fa-copy"></i> Copy Text
          </button>
        </div>

        <div class="relative">
          <div id="${cardId}-req-body" class="whitespace-pre-wrap text-slate-200 text-xs leading-relaxed ${isLongReq ? 'max-h-36 overflow-hidden' : ''} transition-all duration-300">
            ${autolinkText(reqText)}
          </div>
          ${isLongReq ? `
            <div id="${cardId}-req-gradient" class="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
            <button type="button" id="${cardId}-req-toggle" onclick="toggleRequestCardText('${cardId}')" class="mt-2 text-xs font-bold text-sky-400 hover:underline cursor-pointer">
              Show more <i class="fa-solid fa-chevron-down text-[10px] ml-0.5"></i>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Attachment Block -->
      ${attachmentHtml}

      <!-- Admin Status & Private Note (If Admin) -->
      ${isAdmin ? `
        <div class="pt-2 border-t border-slate-800 space-y-2.5 print:hidden">
          <div class="flex items-center justify-between gap-2">
            <label class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <i class="fa-solid fa-sliders text-sky-400"></i> Update Status:
            </label>
            <select onchange="updateProjectRequestStatus('${req.id || req.requestId}', this.value)" class="py-1 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none cursor-pointer">
              <option value="New" ${status === 'New' ? 'selected' : ''}>New</option>
              <option value="Contacted" ${status === 'Contacted' ? 'selected' : ''}>Contacted</option>
              <option value="In Progress" ${status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Rejected" ${status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="block text-[11px] font-bold text-slate-400">Private Admin Note (Saves automatically):</label>
            <textarea
              id="${cardId}-admin-note"
              rows="2"
              onblur="saveProjectRequestNote('${req.id || req.requestId}', this.value)"
              class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:ring-1 focus:ring-sky-500"
              placeholder="Add internal notes visible only to admins..."
            >${req.adminNote || ''}</textarea>
          </div>
        </div>
      ` : ''}

      <!-- Footer Action Toolbar -->
      <div class="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
        <div class="flex items-center gap-2">
          <button type="button" onclick="copyRequestCardAsText('${req.id || req.requestId}')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer flex items-center gap-1.5">
            <i class="fa-solid fa-copy text-sky-400"></i> Copy as text
          </button>

          <button type="button" onclick="printRequestCard('${cardId}')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer flex items-center gap-1.5">
            <i class="fa-solid fa-print text-purple-400"></i> Print / Save PDF
          </button>
        </div>

        <div class="flex items-center gap-2">
          ${waMobile ? `
            <a href="https://wa.me/${waMobile}?text=${waGreeting}" target="_blank" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors flex items-center gap-1.5 shadow-md">
              <i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp
            </a>
          ` : ''}

          ${isAdmin ? `
            <button type="button" onclick="deleteProjectRequestCard('${req.id || req.requestId}')" class="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold transition-colors cursor-pointer flex items-center gap-1.5">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          ` : ''}
        </div>
      </div>

    </div>
  `;
}

// Attach global card handlers on window for inline event listeners
if (typeof window !== 'undefined') {
  window.toggleRequestCardText = function(cardId) {
    const body = document.getElementById(`${cardId}-req-body`);
    const gradient = document.getElementById(`${cardId}-req-gradient`);
    const toggleBtn = document.getElementById(`${cardId}-req-toggle`);

    if (!body || !toggleBtn) return;

    if (body.classList.contains('max-h-36')) {
      body.classList.remove('max-h-36', 'overflow-hidden');
      if (gradient) gradient.classList.add('hidden');
      toggleBtn.innerHTML = `Show less <i class="fa-solid fa-chevron-up text-[10px] ml-0.5"></i>`;
    } else {
      body.classList.add('max-h-36', 'overflow-hidden');
      if (gradient) gradient.classList.remove('hidden');
      toggleBtn.innerHTML = `Show more <i class="fa-solid fa-chevron-down text-[10px] ml-0.5"></i>`;
    }
  };

  window.copyRequestCardAsText = function(reqId) {
    // Find request in global scope or parse card
    if (window.allRequestsData) {
      const req = window.allRequestsData.find(r => r.id === reqId || r.requestId === reqId);
      if (req) {
        const text = generatePlainTextRequest(req);
        navigator.clipboard.writeText(text);
        showToast('Request copied as formatted plain text', 'success');
        return;
      }
    }
    showToast('Failed to copy text', 'error');
  };

  window.printRequestCard = function(cardId) {
    const cardEl = document.getElementById(cardId);
    if (!cardEl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Project Request Print | WebWorldBD</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
          body { background: white; color: black; font-family: sans-serif; padding: 20px; }
          .print-card { border: 1px solid #ccc; padding: 20px; border-radius: 12px; }
          .print:hidden, button, select { display: none !important; }
        </style>
      </head>
      <body>
        <div class="print-card">
          ${cardEl.innerHTML}
        </div>
        <script>
          setTimeout(() => { window.print(); window.close(); }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  window.updateProjectRequestStatus = async function(reqId, newStatus) {
    try {
      const ref = doc(db, 'projectRequests', reqId);
      await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp() });
      showToast(`Request status updated to ${newStatus}`, 'success');
    } catch (e) {
      console.error('Status update failed:', e);
      showToast('Failed to update status', 'error');
    }
  };

  window.saveProjectRequestNote = async function(reqId, noteText) {
    try {
      const ref = doc(db, 'projectRequests', reqId);
      await updateDoc(ref, { adminNote: noteText, updatedAt: serverTimestamp() });
      showToast('Admin note saved', 'success');
    } catch (e) {
      console.error('Note save failed:', e);
    }
  };

  window.deleteProjectRequestCard = async function(reqId) {
    if (!confirm('Are you sure you want to delete this project request?')) return;
    try {
      await deleteDoc(doc(db, 'projectRequests', reqId));
      showToast('Project request deleted', 'success');
    } catch (e) {
      console.error('Delete request failed:', e);
      showToast('Failed to delete request', 'error');
    }
  };
}
