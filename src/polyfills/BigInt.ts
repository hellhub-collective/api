BigInt.prototype.toJSON = function (): number {
  return parseInt(this.toString(), 10);
};
