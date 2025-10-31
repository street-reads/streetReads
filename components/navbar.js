// components/app-navbar.js
(() => {
    'use strict';
    const TAG = 'app-navbar';
    if (customElements.get(TAG)) return;

    class AppNavbar extends HTMLElement {
        static get observedAttributes() {
            return ['brand', 'avatar', 'helplabel'];
        }

        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.state = {
                brand: this.getAttribute('brand') || 'Street Reads',
                avatar: this.getAttribute('avatar') || 'https://i.pravatar.cc/100?img=5',
                helplabel: this.getAttribute('helplabel') || 'Help',
            };
        }

        attributeChangedCallback(name, _old, value) {
            this.state[name] = value ?? '';
            this.render();
        }

        connectedCallback() {
            this.render();
            // emit a custom event when Help is clicked
            this.shadowRoot.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-help]');
                if (btn) this.dispatchEvent(new CustomEvent('help', { bubbles: true }));
            });
        }

        render() {
            const { brand, avatar, helplabel } = this.state;

            this.shadowRoot.innerHTML = `
        <style>
          :host {
            --brand: #4747D0;
            --card: #fff;
            --line: #e6e8ef;
            --radius: 12px;
            --shadow: 0 1px 2px rgba(0,0,0,.04);
            --muted: #6b7280;
            display: block;
          }

          .sr-header {
            background: var(--brand);
            color: #fff;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          .wrap {
            max-width: 1180px;
            margin: 0 auto;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .brand {
            margin: 0;
            font-size: clamp(1.25rem, 2.4vw, 1.7rem);
            font-weight: 800;
            letter-spacing: .2px;
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .pill.small {
            background: rgba(255,255,255,.15);
            color: #fff;
            border: 1px solid rgba(255,255,255,.25);
            padding: 6px 10px;
            border-radius: 999px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-weight: 700;
          }
          .pill.small:hover { background: rgba(255,255,255,.22); }

        //   .avatar {
        //     width: 34px; height: 34px;
        //     border-radius: 50%;
        //     background: url('${avatar}') center/cover no-repeat;
        //     border: 2px solid rgba(255,255,255,.65);
        //   }
        .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: url('https://i.pravatar.cc/100?img=5') center/cover no-repeat;
    border: 2px solid rgba(255, 255, 255, .65);
}

          /* allow consumers to put content on the right if needed */
          ::slotted(*) { margin-left: 8px; }
        </style>

        <header class="sr-header">
          <div class="wrap">
            <h1 class="brand">${brand}</h1>

            <div class="header-right">
              <button class="pill small" data-help>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 17h.01M9.09 9a3 3 0 1 1 5.82 1c-.37.72-1.03 1.13-1.56 1.52-.49.36-.85.63-.85 1.48V14"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                </svg>
                ${helplabel}
              </button>

              <div class="avatar" role="img" aria-label="Your profile"></div>
              
            </div>
          </div>
        </header>
      `;
        }
    }

    customElements.define(TAG, AppNavbar);
})();
