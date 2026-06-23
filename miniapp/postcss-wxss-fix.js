/**
 * PostCSS plugin to fix CSS for WeChat WXSS compatibility.
 * 1. Replace escape characters (\/, \[, \., etc.)
 * 2. Replace * selector with page (WXSS root element)
 * 3. Remove ::backdrop pseudo-element (not supported in WXSS)
 */
module.exports = function postcssWxssFix() {
  return {
    postcssPlugin: "postcss-wxss-fix",
    Rule(rule) {
      if (rule.selector) {
        // Remove ::backdrop rules entirely (not supported in WXSS)
        if (rule.selector.includes("::backdrop")) {
          rule.remove();
          return;
        }
        rule.selector = rule.selector
          .replace(/\\\//g, "-")    // \/ → -
          .replace(/\\\[/g, "-")    // \[ → -
          .replace(/\\\]/g, "")     // \] → remove
          .replace(/\\\./g, "-")    // \. → -
          .replace(/\\:/g, "--")    // \: → --
          .replace(/\\\(/g, "(")    // \( → (
          .replace(/\\\)/g, ")")    // \) → )
          .replace(/\\,/g, ",")     // \, → ,
          // Replace * with page for WXSS compatibility
          .replace(/^\*$/, "page")
          .replace(/^\*,/, "page,")
          .replace(/,\*/, ",page")
          .replace(/\*\|/g, "page|")
          // Replace :host with page (WXSS has no Shadow DOM)
          .replace(/:host\b/g, "page");
      }
    },
  };
};
module.exports.postcss = true;
