// Brand Design BD1 keeps quiz interactions explicit so the editorial wrapper
// cannot interfere with the tested QG1 action layer.
const CORE_QUIZ_ACTIONS = new Set([
  'choose-option',
  'preview',
  'previous-question',
  'quit-quiz'
]);

function installInteractionBridge(app) {
  if (!app || app.__brandInteractionInstalled) return;
  app.__brandInteractionInstalled = true;

  document.addEventListener('click', (event) => {
    if (app.route !== 'discover') return;
    const target = event.target?.closest?.('[data-action]');
    const action = target?.dataset?.action;
    if (!CORE_QUIZ_ACTIONS.has(action)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (action === 'choose-option') {
      app.chooseOption(target.dataset.optionId);
    } else if (action === 'preview') {
      app.togglePreview(target.dataset.optionId);
    } else if (action === 'previous-question') {
      app.previousQuestion();
    } else if (action === 'quit-quiz') {
      app.quitQuiz();
    }
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
