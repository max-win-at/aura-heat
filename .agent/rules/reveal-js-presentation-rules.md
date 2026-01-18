---
trigger: model_decision
description: When generating a presentation or a slide deck
---

You must provide a complete, valid HTML structure for reveal to work with markdown for the slides content.

- Core Structure: The hierarchy must be .reveal > .slides > section.
- Boilerplate:
  - Include links to dist/reveal.css and a theme file (e.g., dist/theme/black.css) in the `<head>`.
  - Include dist/reveal.js and the initialization script at the end of the `<body>`.
- Initialization: call `Reveal.initialize()` to start the deck.
- Plugins: If the user needs Markdown support, Speaker Notes, or Math, you must import the specific plugins (e.g., RevealMarkdown, RevealNotes, RevealMath) and add them to the plugins array inside initialize,.

2. Handling Content Scenarios
   Scenario A: Creating New Presentations
   When the user provides a topic or bullet points:

- Organize content into top-level horizontal slides for major topics and nested vertical slides for details.
- Vertical Slides: Create vertical stacks by nesting `<section>` elements inside another `<section>`. Use this to logically group content.
- Slide Visibility: If the user provides optional content or "bonus" slides, use data-visibility="uncounted" for slides at the end of the deck so they do not affect the progress bar.
  Scenario B: Summarizing Existing Markdown (Priority)
  When the user provides a long-form Markdown document to be converted into a presentation:

1. Summarization Strategy: Do not paste walls of text. Summarize paragraphs into punchy bullet points or short statements.
2. Slide Chunking: Break linear Markdown into a 2D slide matrix:
   - H1/H2 headers should usually start new horizontal slides.
   - H3/H4 headers or detailed lists should become vertical slides beneath the main topic.
3. Markdown Implementation:
   - Use the wrapper `<section data-markdown>` containing a `<textarea data-template>` to wrap the Markdown content.
   - Separators: Explicitly define separators in your data-markdown attributes if not using the default. For example, use --- for horizontal slides and -- for vertical slides, and configure the regex in Reveal.initialize or the section attributes,.
   - Speaker Notes: Extract deeper details from the source text that don't fit on the slide and place them in Note: sections within the Markdown or `<aside class="notes">` tags.
4. Fine-Tuning and Features
   Enhance the presentation using the following features to ensure it is not just static text.
   Visual Polish & Animation

- Transitions: Use data-transition (zoom, fade, slide, convex, concave, none) on specific slides to emphasize shifts in context,.
- Auto-Animate: When two adjacent slides have similar content (e.g., code evolving or lists growing), add data-auto-animate to both `<section>` tags. This automatically animates matching elements.
  - Use data-id to manually match specific elements if the automatic matching fails.
- Fragments: Use the class fragment to reveal elements sequentially (e.g., bullet points) rather than showing them all at once. - Utilize fragment styles like fade-out, grow, or highlight-red for emphasis.
  Media & Backgrounds
- Backgrounds: Use data-background-color, data-background-image, or data-background-video on the `<section>` tag to create immersive title slides,.
- Lazy Loading: For heavy media, change src to data-src to enable lazy loading based on the viewDistance config.
- Iframes: If embedding external content (e.g., a website), use data-background-iframe. Add data-background-interactive if the user needs to click inside it.
  Code and Math
- Code: Wrap code in `<pre>``````<code>`. Use data-trim to remove whitespace and data-line-numbers to highlight specific lines (e.g., data-line-numbers="3,8-10"),.
- Math: If the content involves formulas, enable the RevealMath plugin and use LaTeX syntax inside \[ ... \] or $$ delimiters,.

4. Configuration & Export
   When finalizing the code, check if the user has specific delivery requirements:

- Scroll View: If the user wants a readable format (like a web page) rather than a click-through deck, set view: 'scroll' in the initialization config.
- Auto-Slide: If this is for a kiosk or looping display, set autoSlide to a duration in milliseconds (e.g., 5000) and loop: true.
- PDF Export: Inform the user they can export to PDF by adding ?print-pdf to the URL and using the browser's print dialog with margins set to "None".
- Theming: Select a theme that matches the tone (e.g., white, black, league, beige, night) by linking the appropriate CSS file.

5. Example Output Template

```
<!doctype html>
<html>
    <head>
        <link rel="stylesheet" href="dist/reveal.css">
        <link rel="stylesheet" href="dist/theme/black.css"> <!-- Theme [29] -->
        <link rel="stylesheet" href="plugin/highlight/monokai.css">
    </head>
    <body>
        <div class="reveal">
            <div class="slides">
                <!-- Horizontal Slide 1 -->
                <section>
                    <h1>Title</h1>
                    <h3 class="fragment">Subtitle</h3> <!-- Fragment [16] -->
                </section>

                <!-- Vertical Stack [6] -->
                <section>
                    <section>
                        <h2>Main Topic</h2>
                        <p>Press Down for details</p>
                    </section>
                    <section>
                        <h2>The Details</h2>
                        <!-- Markdown Summary Implementation [8] -->
                        <div data-markdown>
                            <textarea data-template>
                                - Key point 1
                                - Key point 2
                                <!-- .element: class="fragment" -->
                            </textarea>
                        </div>
                    </section>
                </section>

                <!-- Auto-Animate Example [14] -->
                 <section data-auto-animate>
                    <h1>Code</h1>
                    <pre data-id="code-animation"><code data-trim data-line-numbers>
                        let x = 10;
                    </code></pre>
                </section>
                 <section data-auto-animate>
                    <h1>Code</h1>
                    <pre data-id="code-animation"><code data-trim data-line-numbers>
                        let x = 10;
                        let y = 20;
                    </code></pre>
                </section>
            </div>
        </div>
        <script src="dist/reveal.js"></script>
        <script src="plugin/markdown/markdown.js"></script>
        <script src="plugin/highlight/highlight.js"></script>
        <script>
            Reveal.initialize({
                hash: true,
                plugins: [ RevealMarkdown, RevealHighlight ] // Plugins [3]
            });
        </script>
    </body>
</html>
```
