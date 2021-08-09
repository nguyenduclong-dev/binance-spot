export const rt = (text, context) =>
  eval(`() => function () { ${text} }`).call(context);

export const toFixedNoRound = (value, fixed) => {
  const num = Number(value);
  let str = Number(num.toFixed(fixed + 1)).toString();

  if (str.indexOf(".") >= 0) {
    return str.slice(0, -1);
  } else {
    return str;
  }
};
