// __NAME__ — a Hermes desktop plugin (same shape as Hermes Rice).
// Undo everything you add inside ctx.onDispose so switching it off restores Hermes.
export default {
  id: '__ID__',
  name: '__NAME__',
  register(ctx) {
    const style = document.createElement('style');
    style.textContent = '';
    document.head.append(style);
    ctx.onDispose(() => {
      style.remove();
    });
  },
};
