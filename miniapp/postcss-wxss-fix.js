/**
 * PostCSS plugin to replace CSS escape characters that WXSS doesn't support.
 * Converts selectors like .bg-bg\/50, .max-h-\[40vh\], .py-1\.5
 */
module.exports = function postcssWxssFix() {
  return {
    postcssPlugin: "postcss-wxss-fix",
    Rule(rule) {
      if (rule.selector) {
        rule.selector = rule.selector
          .replace(/\\\//g, "-")    // \/ → -
          .replace(/\\\[/g, "-")    // \[ → -
          .replace(/\\\]/g, "")     // \] → remove
          .replace(/\\\./g, "-")    // \. → -
          .replace(/\\:/g, "--")    // \: → --
          .replace(/\\\(/g, "(")    // \( → (
          .replace(/\\\)/g, ")")    // \) → )
          .replace(/\\,/g, ",")     // \, → ,
      }
    },
  };
};
module.exports.postcss = true;
