import { servicesData } from './services-data.js';
import { getLanguage, t } from './i18n.js';

let activeServiceId = null;

document.addEventListener('DOMContentLoaded', () => {
  initServicesUI();
});

function initServicesUI() {
  const modal = document.getElementById('service-modal');
  const closeBtn = document.getElementById('close-service-modal-btn');

  // Bind click handlers to service cards
  document.querySelectorAll('[data-service-id]').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceId = card.getAttribute('data-service-id');
      if (serviceId) {
        openServiceModal(serviceId);
      }
    });
  });

  // Close modal button
  closeBtn?.addEventListener('click', () => {
    closeServiceModal();
  });

  // Backdrop click close
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeServiceModal();
    }
  });

  // Keyboard Escape key close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeServiceModal();
    }
  });

  // Re-render modal when language changes
  document.addEventListener('languageChanged', () => {
    if (activeServiceId && modal && !modal.classList.contains('hidden')) {
      renderModalContent(activeServiceId);
    }
  });

  // Handle browser back/forward history navigation
  window.addEventListener('popstate', (e) => {
    const serviceId = e.state?.serviceId || getServiceFromUrl();
    if (serviceId) {
      openServiceModal(serviceId, false);
    } else {
      closeServiceModal(false);
    }
  });

  // Check URL query on initial load for deep linking
  const initialServiceId = getServiceFromUrl();
  if (initialServiceId) {
    openServiceModal(initialServiceId, false);
  }
}

function getServiceFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('service');
}

export function openServiceModal(serviceId, pushState = true) {
  const modal = document.getElementById('service-modal');
  if (!modal) return;

  const service = servicesData.find((s) => s.id === serviceId);
  if (!service) return;

  activeServiceId = serviceId;
  renderModalContent(serviceId);

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  if (pushState) {
    const newUrl = `${window.location.pathname}?service=${serviceId}`;
    window.history.pushState({ serviceId }, '', newUrl);
  }
}

export function closeServiceModal(pushState = true) {
  const modal = document.getElementById('service-modal');
  if (!modal) return;

  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
  activeServiceId = null;

  if (pushState) {
    window.history.pushState({}, '', window.location.pathname);
  }
}

function renderModalContent(serviceId) {
  const modalRoot = document.getElementById('service-modal-content');
  if (!modalRoot) return;

  const lang = getLanguage() === 'bn' ? 'bn' : 'en';
  const service = servicesData.find((s) => s.id === serviceId);
  if (!service) return;

  const title = service.title[lang] || service.title.en;
  const badge = service.badge ? (service.badge[lang] || service.badge.en) : null;
  const category = service.category[lang] || service.category.en;
  const detailedDesc = service.detailedDescription[lang] || service.detailedDescription.en;
  const deliveryTime = service.deliveryTime[lang] || service.deliveryTime.en;
  const startingPrice = service.startingPrice[lang] || service.startingPrice.en;

  const keyFeaturesLabel = t('serviceKeyFeatures');
  const techStackLabel = t('serviceTechStack');
  const deliveryLabel = t('serviceDeliveryTime');
  const priceLabel = t('serviceStartingPrice');
  const orderBtnLabel = t('serviceOrderNow');

  modalRoot.innerHTML = `
    <!-- Header Box -->
    <div class="flex items-start gap-4 pr-10 border-b border-slate-100 dark:border-slate-800 pb-5">
      <div class="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/60 text-sky-500 flex items-center justify-center shrink-0 text-2xl shadow-inner">
        <i class="${service.icon}"></i>
      </div>
      <div class="space-y-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300">
            ${badge || category}
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
            ${category}
          </span>
        </div>
        <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          ${title}
        </h2>
      </div>
    </div>

    <!-- Detailed Description -->
    <div class="space-y-2">
      <p class="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
        ${detailedDesc}
      </p>
    </div>

    <!-- Key Features List -->
    <div class="space-y-3">
      <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <i class="fa-solid fa-list-check text-sky-500"></i>
        <span>${keyFeaturesLabel}</span>
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${service.features.map((feat) => {
          const fTitle = feat.title[lang] || feat.title.en;
          const fDesc = feat.desc[lang] || feat.desc.en;
          return `
            <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div class="flex items-center gap-2 text-sky-500 font-bold text-xs md:text-sm">
                <i class="fa-solid fa-circle-check"></i>
                <span class="text-slate-800 dark:text-slate-100">${fTitle}</span>
              </div>
              <p class="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 pl-5 leading-normal">
                ${fDesc}
              </p>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Technologies Used -->
    <div class="space-y-2">
      <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <i class="fa-solid fa-microchip text-sky-500"></i>
        <span>${techStackLabel}</span>
      </h3>
      <div class="flex flex-wrap gap-2">
        ${service.technologies.map((tech) => `
          <span class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
            ${tech}
          </span>
        `).join('')}
      </div>
    </div>

    <!-- Bottom Pricing & Action Sticky Footer -->
    <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div class="flex items-center justify-between sm:justify-start gap-6 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
        <div>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase tracking-wider">${deliveryLabel}</span>
          <span class="font-extrabold text-slate-800 dark:text-slate-100 text-xs md:text-sm flex items-center gap-1.5 mt-0.5">
            <i class="fa-regular fa-clock text-sky-500"></i> ${deliveryTime}
          </span>
        </div>
        <div class="h-8 w-px bg-slate-200 dark:border-slate-700"></div>
        <div>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase tracking-wider">${priceLabel}</span>
          <span class="font-black text-sky-600 dark:text-sky-400 text-xs md:text-sm mt-0.5 block">
            ${startingPrice}
          </span>
        </div>
      </div>

      <a
        href="${service.ctaUrl}"
        class="px-6 py-3.5 rounded-full btn-primary-gradient text-white text-center font-bold text-xs md:text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
      >
        <i class="fa-solid fa-paper-plane"></i>
        <span>${orderBtnLabel}</span>
      </a>
    </div>
  `;
}
