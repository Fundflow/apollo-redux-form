// from https://stackoverflow.com/a/1026087
export const capitalizeFirstLetter = value => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const isValidCurrencyValue = (value, options) => {
  return /^\d+\.\d\d$/.test(value + '');
};
