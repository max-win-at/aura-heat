/**
 * AuraHeat SPA Application
 * Handles navigation, content loading, and subpage menu injection
 */
function app() {
    return {
        currentPage: null,
        mobileMenuOpen: false,
        subpageNavItems: [],
        currentSubpageNav: null,

        init() {
            // Handle GitHub Pages 404.html SPA fallback
            // 404.html sends just the route path relative to base (e.g., "tenstorrent" or "aura-heat")
            const urlParams = new URLSearchParams(window.location.search);
            const redirectedPath = urlParams.get('p');

            if (redirectedPath) {
                // Extract page name from the route path
                const pageName = this.extractPageFromPath(redirectedPath);

                // Clean up the URL using History API
                const cleanUrl = window.location.origin + window.location.pathname +
                    (pageName ? '#' + pageName : '');
                window.history.replaceState(null, '', cleanUrl);

                if (pageName) {
                    this.loadPage(pageName);
                    return;
                }
            }

            // Check URL hash for initial page
            const hash = window.location.hash.slice(1);
            if (hash && this.isValidPage(hash)) {
                this.loadPage(hash);
            }

            // Listen for hash changes
            window.addEventListener('hashchange', () => {
                const newHash = window.location.hash.slice(1);
                if (newHash && newHash !== this.currentPage) {
                    this.loadPage(newHash);
                } else if (!newHash) {
                    this.goHome();
                }
            });
        },

        /**
         * Extract page name from a path like "/aura-heat" or "/pages/aura-heat"
         */
        extractPageFromPath(path) {
            // Remove leading/trailing slashes
            const cleanPath = path.replace(/^\/+|\/+$/g, '');

            // Handle direct page paths like "aura-heat" or "tenstorrent"
            if (this.isValidPage(cleanPath)) {
                return cleanPath;
            }

            // Handle paths like "pages/aura-heat" or "pages/aura-heat/index.html"
            const pagesMatch = cleanPath.match(/^pages\/([^\/]+)/);
            if (pagesMatch && this.isValidPage(pagesMatch[1])) {
                return pagesMatch[1];
            }

            return null;
        },

        /**
         * Check if a page name is valid
         */
        isValidPage(pageName) {
            const validPages = ['aura-heat', 'tenstorrent'];
            return validPages.includes(pageName);
        },

        goHome() {
            this.currentPage = null;
            this.subpageNavItems = [];
            this.currentSubpageNav = null;
            window.location.hash = '';
            document.getElementById('page-content').innerHTML = '';
            this.updateDesktopSubpageNav();
        },

        async loadPage(pageName) {
            this.currentPage = pageName;
            window.location.hash = pageName;

            try {
                const response = await fetch(`pages/${pageName}/index.html`);
                if (!response.ok) throw new Error('Page not found');

                const html = await response.text();
                this.processPageContent(html, pageName);
            } catch (error) {
                console.error('Failed to load page:', error);
                document.getElementById('page-content').innerHTML = `
                    <div class="welcome">
                        <h1 style="color: var(--color-slate-700);">Page Not Found</h1>
                        <p>Could not load ${pageName}/index.html</p>
                        <button class="welcome-btn welcome-btn-primary" onclick="Alpine.store('app').goHome()">
                            Go Home
                        </button>
                    </div>
                `;
            }
        },

        processPageContent(html, pageName) {
            // Create a DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            let contentHtml = '';

            // First, look for an Alpine wrapper div with x-data attribute
            // This is the preferred approach as it preserves Alpine component scope
            const alpineWrapper = doc.querySelector('body > div[x-data]');

            if (alpineWrapper) {
                // Found an Alpine wrapper - use it but remove nav for SPA (we have our own nav)
                const nav = alpineWrapper.querySelector('nav');
                const footer = alpineWrapper.querySelector('footer');

                if (nav) nav.remove();
                if (footer) footer.remove();

                // Get the wrapper's outer HTML so x-data is preserved
                contentHtml = alpineWrapper.outerHTML;
            } else {
                // Fallback: Extract main content (look for main, #main-content, or body content)
                let mainContent = doc.querySelector('main') ||
                    doc.querySelector('#main-content') ||
                    doc.querySelector('body');

                // Also get header content if it exists (for hero sections)
                const header = doc.querySelector('header');

                // Build the content (combine header + main if both exist)
                if (header) {
                    contentHtml += header.outerHTML;
                }
                if (mainContent) {
                    // If it's the body, get innerHTML, otherwise get outerHTML
                    if (mainContent.tagName === 'BODY') {
                        // Filter out nav and footer from body
                        const nav = mainContent.querySelector('nav');
                        const footer = mainContent.querySelector('footer');
                        const scripts = mainContent.querySelectorAll('script');

                        if (nav) nav.remove();
                        if (footer) footer.remove();
                        scripts.forEach(s => s.remove());

                        contentHtml = mainContent.innerHTML;
                    } else {
                        contentHtml += mainContent.outerHTML;
                    }
                }
            }

            // Inject content
            const pageContent = document.getElementById('page-content');
            pageContent.innerHTML = contentHtml;
            pageContent.classList.add('slide-in');

            // Initialize Alpine.js on the newly injected content
            // The page component functions are already loaded via components.js
            // Alpine.initTree() will find the x-data attribute and initialize the component
            if (typeof Alpine !== 'undefined') {
                // Use a small timeout to ensure DOM is fully updated
                setTimeout(() => {
                    Alpine.initTree(pageContent);
                }, 10);
            }

            // Handle anchor links (href="#section") in dynamically loaded content
            // These need to scroll to the section instead of changing URL hash
            pageContent.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = anchor.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });

            // Extract and process subpage navigation
            this.extractSubpageNav(doc, pageName);

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        extractSubpageNav(doc, pageName) {
            // Clear previous subpage nav
            this.subpageNavItems = [];

            // Look for navigation items in the loaded page
            const navContainer = doc.querySelector('#nav-container') ||
                doc.querySelector('nav .hidden.md\\:flex') ||
                doc.querySelector('nav');

            if (navContainer) {
                // Find buttons or links that look like tab navigation
                const navItems = navContainer.querySelectorAll('[data-tab], .tab-btn');

                navItems.forEach(item => {
                    const label = item.textContent.trim();
                    const tabId = item.dataset.tab || item.getAttribute('href');

                    // Skip if it's defined in root nav already
                    if (label.toLowerCase() === 'auraheat' || label.toLowerCase() === 'tenstorrent') {
                        return;
                    }

                    this.subpageNavItems.push({
                        label: label,
                        tabId: tabId,
                        page: pageName,
                        icon: '<svg class="nav-btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'
                    });
                });
            }

            this.updateDesktopSubpageNav();
        },

        updateDesktopSubpageNav() {
            const subpageNavContainer = document.getElementById('subpage-nav');
            if (!subpageNavContainer) return;

            if (this.subpageNavItems.length === 0) {
                subpageNavContainer.innerHTML = '';
                return;
            }

            const html = this.subpageNavItems.map(item => `
                <button class="subpage-nav-item" data-tab="${item.tabId}" onclick="document.body.__x.$data.handleSubpageNav(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                    ${item.icon}
                    <span>${item.label}</span>
                </button>
            `).join('');

            subpageNavContainer.innerHTML = html;
        },

        handleSubpageNav(item) {
            // Scroll directly to the section by ID
            const section = document.getElementById(item.tabId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };
}
