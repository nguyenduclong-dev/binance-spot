export default function() {
  if (this.wait) return;

  const wait = (duration = 5000) => {
    this.wait = true;
    setTimeout(() => {
      this.wait = false;
    }, duration);
  };

  if (this.nextAction === "sell") {
    // Bán lãi
    if (this.pnl.percent > 0.08 && this.a10s <= 0) {
      console.log("Bán lãi:", this.pnl.percent);
      this.cancelSellCommand();
      this.sell();
      wait(10000);
      return;
    }

    // Cắt lỗ
    if (this.pnl.percent < -0.1 && this.a10s <= 0) {
      console.log("Cắt lỗ:", this.pnl.percent);
      this.cancelSellCommand();
      this.sell();
      wait(10000);
      return;
    }
  } else {
    // mua giá giảm
    if (this.price < this.sellPrice && this.a10s >= 0 && this.ap.am < -0.02) {
      console.log("Mua giảm:", this.price, this.a10s, this.ap.am);
      this.cancelBuyCommand();
      this.buy();
      wait();
      return;
    }

    // Mua giá tăng
    if (this.price > this.sellPrice && this.a10s >= 0 && this.ap.am > 0.02) {
      console.log("Mua tăng:", this.price, this.a10s, this.ap.am);
      this.cancelBuyCommand();
      this.buy();
      wait();
      return;
    }
  }
}
