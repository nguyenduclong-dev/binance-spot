export default function() {
  if (this.wait) return;

  const wait = () => {
    this.wait = true;
    setTimeout(() => {
      this.wait = false;
    }, 5000);
  };

  if (this.nextAction === "sell") {
    // Bán lãi
    if (this.pnl.percent > 0.1 / 100 && this.am <= 0) {
      this.cancelSellCommand();
      this.sell();
      wait();
      return;
    }

    // Cắt lỗ
    if (this.pnl.percent < 0.3 / 100 && this.am <= 0) {
      this.cancelSellCommand();
      this.sell();
      wait();
      return;
    }
  } else {
    // mua giá giảm
    if (
      this.price < this.sellPrice &&
      this.a10s >= 0 &&
      this.ap.am < 0.05 / 100
    ) {
      this.cancelBuyCommand();
      this.buy();
      wait();
      return;
    }

    // Mua giá tăng
    if (
      this.price > this.sellPrice &&
      this.a10s >= 0 &&
      this.ap.am > 0.05 / 100
    ) {
      this.cancelBuyCommand();
      this.buy();
      wait();
      return;
    }
  }
}
