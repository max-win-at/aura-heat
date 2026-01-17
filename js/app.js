/**
 * AuraHeat SPA Application
 * Handles navigation, content loading, and dependency injection
 */

// Configuration and State
const config = {
  pagesPath: "pages/",
  defaultPage: null,
};

// Listen for Alpine initialization to register components (IoC Container)
document.addEventListener("alpine:init", () => {
  //-----------------------------------------------------------------------------
  // Global App Component
  //-----------------------------------------------------------------------------
  Alpine.data("app", () => ({
    currentPage: null,
    pages: [],
    mobileMenuOpen: false,
    subpageNavItems: [],

    async init() {
      // Fetch Pages Configuration
      try {
        const pagesRes = await fetch("pages/_pages.json");
        if (pagesRes.ok) {
          this.pages = await pagesRes.json();
        } else {
          console.error("Failed to load pages configuration");
        }
      } catch (e) {
        console.error("Error loading pages:", e);
      }

      // Handle GitHub Pages 404.html SPA fallback
      const urlParams = new URLSearchParams(window.location.search);
      const redirectedPath = urlParams.get("p");

      if (redirectedPath) {
        const pageName = this.extractPageFromPath(redirectedPath);
        const cleanUrl =
          window.location.origin +
          window.location.pathname +
          (pageName ? "#" + pageName : "");
        window.history.replaceState(null, "", cleanUrl);

        if (pageName) {
          this.loadPage(pageName);
          return;
        }
      }

      // Check URL hash for initial page
      const hash = window.location.hash.slice(1);
      if (hash) {
        this.loadPage(hash);
      }

      // Listen for hash changes
      window.addEventListener("hashchange", () => {
        const newHash = window.location.hash.slice(1);
        if (newHash && newHash !== this.currentPage) {
          this.loadPage(newHash);
        } else if (!newHash) {
          this.goHome();
        }
      });
    },

    extractPageFromPath(path) {
      return path.replace(/^\/+|\/+$/g, "").replace(/^pages\//, "");
    },

    goHome() {
      this.currentPage = null;
      this.subpageNavItems = [];
      window.location.hash = "";
      document.getElementById("page-content").innerHTML = "";
    },

    async loadPage(pageName) {
      this.currentPage = pageName;
      window.location.hash = pageName;

      try {
        // Fetch Markdown content
        const response = await fetch(`${config.pagesPath}${pageName}.md`);
        if (!response.ok) throw new Error(`Page ${pageName} not found`);

        const markdown = await response.text();

        // Parse and Sanitize
        const html = window.marked.parse(markdown);
        // Configure DOMPurify to allow specific tags and attributes for Alpine and Styles
        const cleanHtml = window.DOMPurify.sanitize(html, {
          ADD_TAGS: ["iframe", "style", "script"], // Be careful with script, but needed if we want custom JS in MD (unlikely)
          ADD_ATTR: [
            "x-data",
            "x-init",
            "x-show",
            "x-bind",
            "x-on",
            "x-text",
            "x-html",
            "x-model",
            "x-for",
            "x-effect",
            "x-ref",
            "x-cloak",
            "x-ignore",
            "@click",
            ":class",
            ":style",
            ":data-active",
            "class",
            "style",
            "data-tab",
            "data-active",
          ],
          FORBID_TAGS: ["script"], // Actually forbid script tags for security, but allow Alpine attributes
          FORBID_ATTR: [],
        });

        // Fix relative paths for SPA (GitHub Pages root)
        // Markdown files in /pages/ use relative paths like ../img/ which break at root
        const fixedHtml = cleanHtml.replace(/src="\.\.\//g, 'src="');

        // Apply Design System Styles
        const styledHtml = this.applyMarkdownStyles(fixedHtml);

        // Inject into DOM with Container Wrapper
        const pageContent = document.getElementById("page-content");
        pageContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
                ${styledHtml}
            </div>
        `;
        pageContent.classList.add("slide-in");

        // Initialize Alpine on new content
        if (typeof Alpine !== "undefined") {
          setTimeout(() => {
            Alpine.initTree(pageContent);
          }, 10);
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("Failed to load page:", error);
        document.getElementById("page-content").innerHTML = `
                    <div class="welcome">
                        <h1 style="color: var(--color-slate-700);">Page Not Found</h1>
                        <p>Could not load content for ${pageName}</p>
                        <button class="welcome-btn welcome-btn-primary" @click="goHome()">
                            Go Home
                        </button>
                    </div>
                `;
      }
    },

    handleSubpageNav(item) {
      // Placeholder if we re-introduce subpage nav
      console.log("Navigating to", item);
    },

    applyMarkdownStyles(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const styles = {
        h1: "text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-8 text-slate-900",
        h2: "text-3xl md:text-4xl font-bold text-slate-900 mb-6 mt-12",
        h3: "text-xl font-bold text-slate-900 mb-4 mt-8",
        h4: "text-lg font-bold text-slate-900 mb-2 mt-6 uppercase tracking-wider text-orange-600",
        p: "text-lg text-slate-600 leading-relaxed mb-6",
        ul: "list-disc list-outside space-y-2 mb-8 text-slate-600 pl-4",
        ol: "list-decimal list-outside space-y-2 mb-8 text-slate-600 pl-4",
        li: "pl-2 marker:text-orange-500",
        a: "text-orange-600 hover:text-orange-700 font-medium underline underline-offset-4 transition",
        blockquote:
          "bg-white border-l-4 border-orange-500 pl-6 pr-6 py-6 my-8 text-slate-800 rounded-r-xl shadow-sm hover:shadow-md transition-shadow duration-300 [&>:last-child]:mb-0",
        table:
          "w-full text-left border-collapse my-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white",
        th: "bg-slate-100 p-4 font-bold text-slate-900 border-b border-slate-200 uppercase text-xs tracking-wider",
        td: "p-4 border-b border-slate-100 text-slate-600",
        img: "rounded-xl shadow-lg my-8 max-w-full h-auto",
        code: "bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200",
        pre: "bg-slate-900 text-slate-200 p-6 rounded-xl overflow-x-auto mb-8 text-sm",
        hr: "my-12 border-slate-200 border-t-2",
      };

      // Heuristic: Wrap "Key: Value" lists in a definition list style or similar if detectable?
      // No, kept simple.

      // Apply styles to elements that don't already have classes
      Object.keys(styles).forEach((tag) => {
        doc.querySelectorAll(tag).forEach((el) => {
          const existingClasses = el.className;
          const defaultClasses = styles[tag];

          // Append styles to existing ones to support custom overrides
          el.className = existingClasses
            ? `${existingClasses} ${defaultClasses}`
            : defaultClasses;

          // SPECIAL HANDLING: Elements inside Blockquotes
          if (el.parentElement.tagName === "BLOCKQUOTE") {
            // 1. Headings inside blockquotes: Remove large top margins, adjust color
            if (["H1", "H2", "H3", "H4"].includes(tag.toUpperCase())) {
              el.classList.remove("mt-12", "mt-8", "mt-6", "text-slate-900"); // Remove default spacing/color
              el.classList.add("mt-0", "mb-4", "text-orange-600"); // Compact spacing, themed color
            }
            // 2. Button links/paragraphs inside blockquotes can be tweaked here if needed
          }

          // Fix for pre > code to avoid double styling
          if (tag === "code" && el.parentElement.tagName === "PRE") {
            el.className = "bg-transparent text-inherit p-0 border-0";
          }
        });
      });

      return doc.body.innerHTML;
    },
  }));

  //-----------------------------------------------------------------------------
  // Page Components (Moved from components.js)
  //-----------------------------------------------------------------------------

  Alpine.data("auraHeatPage", () => ({
    mobileMenuOpen: false,
    activeVision: null,
    activeFlow: null,
    selectedSpec: "M",
    buildingType: "house",
    currentCost: 2500,

    // Calculated values
    gasTotal: 0,
    hpTotal: 0,
    auraTotal: 0,
    totalSavings: 0,
    maxCost: 50000,

    specs: {
      S: {
        kw: "5 kW",
        modules: "5",
        target: "Etagenwohnung (ca. 80m²)",
        invest: "< 6.000 €",
      },
      M: {
        kw: "8 kW",
        modules: "8",
        target: "Einfamilienhaus (ca. 150m²)",
        invest: "< 8.000 €",
      },
      XL: {
        kw: "30 kW",
        modules: "30",
        target: "Mehrfamilienhaus (ca. 400m²)",
        invest: "Auf Anfrage",
      },
    },

    efficiencyData: [
      { label: "10°C", aura: 100, heatpump: 90 },
      { label: "5°C", aura: 100, heatpump: 80 },
      { label: "0°C", aura: 100, heatpump: 65 },
      { label: "-5°C", aura: 100, heatpump: 50 },
      { label: "-10°C", aura: 100, heatpump: 35 },
      { label: "-15°C", aura: 100, heatpump: 20 },
    ],

    init() {
      this.calculateSavings();
    },

    scrollTo(sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    },

    calculateSavings() {
      let installGas = 12000;
      let installHP = 25000;
      let installAura = 8000;

      if (this.buildingType === "flat") {
        installGas = 8000;
        installHP = 18000;
        installAura = 5000;
      }
      if (this.buildingType === "large") {
        installGas = 18000;
        installHP = 40000;
        installAura = 15000;
      }

      this.gasTotal = installGas + parseInt(this.currentCost) * 10 + 2000;
      this.hpTotal = installHP + parseInt(this.currentCost) * 0.7 * 10 + 1500;
      this.auraTotal = installAura;

      this.totalSavings =
        Math.max(this.gasTotal, this.hpTotal) - this.auraTotal;
      this.maxCost = Math.max(this.gasTotal, this.hpTotal) * 1.1;
    },
  }));

  Alpine.data("tenstorrentPage", () => ({
    mobileMenuOpen: false,

    readinessMetrics: [
      {
        label: "Silicon Reliability",
        score: "High",
        analysis: "Hardware is stable, mass-produced, and functionally sound.",
      },
      {
        label: "Driver Maturity",
        score: "Low",
        analysis: "Active development causing breaking changes weekly.",
      },
      {
        label: "Eco-system (Metal)",
        score: "Medium",
        analysis: "TT-Metalium is powerful but has a steep learning curve.",
      },
      {
        label: "Cost Efficiency",
        score: "High",
        analysis: "Unbeatable $/FLOP at the hardware level.",
      },
    ],

    scrollTo(sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    },
  }));

  console.log("[app.js] IoC Container initialized, components registered.");
});
