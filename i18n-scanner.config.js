module.exports = {
  input: [
    "*.js",
    "routes/*.js",
    "utils/*.js",
    "controllers/*.js",
    "models/**/*.js",
  ],
  output: "./",
  options: {
    debug: true,
    func: {
      list: ["translate"],
      extensions: [".js"],
    },
    trans: {
      component: "translate",
      extensions: [".js"],
    },
    lngs: ["en", "de"],
    defaultLng: "en",
    defaultValue: "__STRING_NOT_TRANSLATED__",
    resource: {
      loadPath: "locales/{{lng}}.json",
      savePath: "locales/{{lng}}.json",
    },
    keySeparator: false,
    nsSeparator: false,
    interpolation: {
      prefix: "{{",
      suffix: "}}",
    },
  },
}
