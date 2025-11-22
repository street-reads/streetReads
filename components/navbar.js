// /components/app-navbar.js
(() => {
    'use strict';
    const TAG = 'app-navbar';
    if (customElements.get(TAG)) return;

    const DEFAULT_AVATAR = '/src/avatar.png';
    const PROBE_URL = '/__online.txt'; // can be missing; we just need *any* response
    const PROBE_TIMEOUT_MS = 2500;
    const POLL_EVERY_MS = 10000;

    class AppNavbar extends HTMLElement {
        static get observedAttributes() {
            return ['brand', 'avatar'];
        }

        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.state = {
                brand: this.getAttribute('brand') || 'Street Reads',
                avatar: (this.getAttribute('avatar') && this.getAttribute('avatar').trim()) || DEFAULT_AVATAR,
            };
            this._onNetChange = this._onNetChange.bind(this);
            this._pollTimer = null;
        }

        attributeChangedCallback(name, _old, value) {
            if (name === 'avatar') {
                this.state.avatar = value && value.trim() ? value : DEFAULT_AVATAR;
            } else if (name === 'brand') {
                this.state.brand = value ?? '';
            }
            this.render();
        }

        connectedCallback() {
            this.render();

            // Clicks
            this.shadowRoot.addEventListener('click', (e) => {
                if (e.target.closest('.avatar')) {
                    window.location.href = '/pages/user-profile.html';
                    return;
                }
                if (e.target.closest('.brand, .brand-link')) {
                    window.location.href = '/pages/homepage.html';
                }
            });

            // Online/Offline events
            window.addEventListener('online', this._onNetChange);
            window.addEventListener('offline', this._onNetChange);

            // Initial + periodic checks
            this._onNetChange();
            this._pollTimer = setInterval(() => this._onNetChange(), POLL_EVERY_MS);
        }

        disconnectedCallback() {
            window.removeEventListener('online', this._onNetChange);
            window.removeEventListener('offline', this._onNetChange);
            if (this._pollTimer) clearInterval(this._pollTimer);
        }

        // Public API
        updateAvatar(avatarUrl) {
            const url = avatarUrl && avatarUrl.trim() ? avatarUrl : DEFAULT_AVATAR;
            this.setAttribute('avatar', url);
        }

        async _onNetChange() {
            const banner = this.shadowRoot?.getElementById('offline-banner');
            if (!banner) return;

            // Quick hint from browser
            if (!navigator.onLine) {
                banner.hidden = false;
                return;
            }

            // Verify by probing the network (avoid cached response)
            const isOnline = await this._probeOnline();
            banner.hidden = isOnline;
        }

        // PATCHED: any fetch that returns (2xx/3xx/4xx/5xx) means "online".
        // Only network/timeout errors are treated as offline.
        async _probeOnline() {
            try {
                const ctrl = new AbortController();
                const id = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
                await fetch(`${PROBE_URL}?t=${Date.now()}`, {
                    cache: 'no-store',
                    credentials: 'omit',
                    signal: ctrl.signal,
                });
                clearTimeout(id);
                return true; // got a response at all → online
            } catch {
                return false; // network error/timeout → offline
            }
        }

        render() {
            const { brand, avatar } = this.state;
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
            margin: 0 auto;
            padding: 8px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .brand {
            margin: 0;
            font-size: clamp(1.25rem, 2.4vw, 1.7rem);
            font-weight: 800;
            letter-spacing: .2px;
            font-family: 'Agbalumo', 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            cursor: pointer;
          }
          .brand-link {
            color: inherit;
            text-decoration: none;
            display: inline-block;
            cursor: pointer;
            font-size: 2.5rem;
          }
          .header-right {
            display: flex;
            align-items: center;
          }
          .avatar {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: url('${avatar}') center/cover no-repeat;
            border: 2px solid rgba(255, 255, 255, .65);
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .avatar:hover { transform: scale(1.05); border-color: rgba(255,255,255,.85); }

          @media (max-width: 900px) { .brand-link { font-size: 20px; } }
          ::slotted(*) { margin-left: 8px; }

          #offline-banner {
            position: sticky;
            top: 0;
            z-index: 9999;
            background: #D14753;
            color: #fff;
            text-align: center;
            padding: 8px 12px;
            font-weight: 700;
          }
        </style>

        <header class="sr-header">
          <div class="wrap">
            <h1 class="brand"><a class="brand-link" href="/pages/homepage.html">${brand}</a></h1>
            <div class="header-right">
              <div class="avatar" role="img" aria-label="Your profile"></div>
            </div>
          </div>
          <div id="offline-banner" hidden>
            You’re offline — changes may not sync
          </div>
        </header>
      `;
        }
    }

    customElements.define(TAG, AppNavbar);
})();
