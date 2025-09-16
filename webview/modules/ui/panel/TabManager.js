/**
 * 面板 Tab 管理器
 */
window.WVE = window.WVE || {};
window.WVE.TabManager = class TabManager {
  constructor(root, tabs) {
    this.root = root; // Shadow root
    this.tabs = tabs; // { key: {button, view} }
    this.active = null;
  }

  init(defaultKey) {
    Object.entries(this.tabs).forEach(([key, { button, view }]) => {
      button.addEventListener('click', () => this.switchTo(key));
      view.style.display = 'none';
    });
    this.switchTo(defaultKey);
  }

  switchTo(key) {
    if (!this.tabs[key]) return;
    if (this.active) {
      const { button, view } = this.tabs[this.active];
      button.classList.remove('active');
      view.style.display = 'none';
    }
    const { button, view } = this.tabs[key];
    button.classList.add('active');
    view.style.display = 'block';
    this.active = key;
  }
};

