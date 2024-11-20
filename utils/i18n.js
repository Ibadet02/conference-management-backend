const i18n = require("i18n");

console.log(__dirname + "/locales");
i18n.configure({
  locales: ["en"],
  directory: "./locales",
  defaultLocale: "en",
  queryParameter: "lang",
  objectNotation: true,
  lowerCaseQueryParameter: true,
  register: global,
  autoReload: true,
  syncFiles: true,
  cookie: "locale",
  directoryPermissions: "755",
});
const translate = (key, lang) => {
  i18n.setLocale(lang);
  return i18n.__(key);
};
module.exports = translate;
