String.prototype.toSnakeCase = function () {
  return this.toLowerCase().replace(" ", "_");
};

String.prototype.toKebabCase = function () {
  return this.toLowerCase().replace(" ", "-");
};
