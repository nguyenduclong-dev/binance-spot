export const rt = (text, context) =>
  eval(`() => function () { ${text} }`).call(context);
