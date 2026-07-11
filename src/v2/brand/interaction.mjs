// Brand Design BD1 keeps every product action explicit so the editorial
// wrapper cannot interfere with the tested QG1 delegated-action layer.
const CORE_ACTIONS = Object.freeze({
  'choose-option': (app, target) => app.chooseOption(target.dataset.optionId),
  preview: (app, target) => app.togglePreview(target.dataset.optionId),
  'previous-question': (app) => app.previousQuestion(),
  'quit-quiz': (app) => app.quitQuiz(),
  'toggle-language': (app) => app.toggleLanguage(),
  'retake-profile': (app) => app.startQuiz(true),
  'clear-profile': (app) => app.deleteProfile(),
  'share-profile': (app) => app.shareProfile(),
  'copy-invite': (app) => app.copyInvite(),
  'download-card': (app) => app.downloadCard(),
  'select-context': (app, target) => app.selectContext(target.dataset.contextId),
  'restore-context': (app, target) => app.selectContext(target.dataset.contextId),
  'change-context': (app) => app.changeContext(),
  'clear-friend': (app) => app.clearFriend(),
  privacy: (app) => app.showPrivacy()
});

function installInteractionBridge(app) {
  if (!app || app.__brandInteractionInstalled) return;
  app.__brandInteractionInstalled = true;

  document.addEventListener('click', (event) => {
    const actionTarget = event.target?.closest?.('[data-action]');
    const action = actionTarget?.dataset?.action;
    const handler = CORE_ACTIONS[action];

    if (handler) {
      event.preventDefault();
      event.stopImmediatePropagation();
      handler(app, actionTarget);
      return;
    }

    // Brand-only actions are handled by install.mjs in the existing delegated
    // listener. Do not let the body's stateful data-route attribute intercept them.
    if (action?.startsWith('brand-')) return;

    const routeTarget = event.target?.closest?.('button[data-route], a[data-route]');
    if (!routeTarget) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const route = routeTarget.dataset.route;
    if (route === 'discover') app.startQuiz(false);
    else app.navigate(route);
  }, true);
}

function boot() {
  if (window.__musicVibeV2) {
    installInteractionBridge(window.__musicVibeV2);
    return;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (window.__musicVibeV2) {
      window.clearInterval(timer);
      installInteractionBridge(window.__musicVibeV2);
    } else if (attempts > 120) {
      window.clearInterval(timer);
    }
  }, 25);
}

boot();
