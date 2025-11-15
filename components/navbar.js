// components/app-navbar.js
(() => {
    'use strict';
    const TAG = 'app-navbar';
    if (customElements.get(TAG)) return;

    class AppNavbar extends HTMLElement {
        static get observedAttributes() {
            return ['brand', 'avatar'];
        }

        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.state = {
                brand: this.getAttribute('brand') || 'Street Reads',
                avatar: this.getAttribute('avatar') || '../src/avatar.png',
            };
        }

        attributeChangedCallback(name, _old, value) {
            if (name === 'avatar') {
                this.state[name] = value && value.trim() !== '' ? value : '../src/avatar.png';
            } else {
                this.state[name] = value ?? '';
            }
            this.render();
        }

        connectedCallback() {
            this.render();
            // emit a custom event when Avatar is clicked
            this.shadowRoot.addEventListener('click', (e) => {
                const avatar = e.target.closest('.avatar');
                if (avatar) {
                    window.location.href = '/pages/user-profile.html';
                }

                // clicking the brand (h1 or its inner link) should navigate to the homepage
                const brand = e.target.closest('.brand, .brand-link');
                if (brand) {
                    // use an absolute path to the pages homepage so it works from any route
                    window.location.href = '/pages/homepage.html';
                }
            });
        }

        // Public method to update the avatar
        updateAvatar(avatarUrl) {
            if (avatarUrl) {
                this.setAttribute('avatar', avatarUrl);
                // Also update the background directly
                const avatarEl = this.shadowRoot?.querySelector('.avatar');
                if (avatarEl) {
                    avatarEl.style.backgroundImage = `url('${avatarUrl}')`;
                    avatarEl.style.backgroundSize = 'cover';
                    avatarEl.style.backgroundPosition = 'center';
                    avatarEl.style.backgroundRepeat = 'no-repeat';
                }
            } else {
                // If no avatar URL, use default
                const defaultAvatar = '../src/avatar.png';
                this.setAttribute('avatar', defaultAvatar);
                const avatarEl = this.shadowRoot?.querySelector('.avatar');
                if (avatarEl) {
                    avatarEl.style.backgroundImage = `url('${defaultAvatar}')`;
                    avatarEl.style.backgroundSize = 'cover';
                    avatarEl.style.backgroundPosition = 'center';
                    avatarEl.style.backgroundRepeat = 'no-repeat';
                }
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
            /* be explicit and include fallbacks */
            font-family: 'Agbalumo', 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            consur:pointer;
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
            background: ${avatar ? `url('${avatar}')` : 'url("../src/avatar.png")'} center/cover no-repeat;
            border: 2px solid rgba(255, 255, 255, .65);
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .avatar:hover {
            transform: scale(1.05);
            border-color: rgba(255, 255, 255, .85);
          }

          /* mobile: slightly smaller brand text for narrow viewports */
          @media (max-width: 900px) {
            .brand-link {
              font-size: 20px;
            }
          }

          /* allow consumers to put content on the right if needed */
          ::slotted(*) { margin-left: 8px; }
        </style>

        <header class="sr-header">
            <div class="wrap">
            <h1 class="brand"><a class="brand-link" href="/pages/homepage.html">${brand}</a></h1>

            <div class="header-right">
              <div class="avatar" role="img" aria-label="Your profile"></div>
            </div>
          </div>
        </header>
      `;
        }
    }

    customElements.define(TAG, AppNavbar);
})();
