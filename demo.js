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
    if (this.pnl.percent > 0.3 && this.am <= 0) {
      console.log("Bán lãi:", this.pnl.percent);
      this.cancelSellCommand();
      this.sell();
      wait();
      return;
    }

    // Cắt lỗ
    if (this.pnl.percent < -0.6 && this.am <= 0) {
      console.log("Cắt lỗ:", this.pnl.percent);
      this.cancelSellCommand();
      this.sell();
      wait();
      return;
    }
  } else {
    // mua giá giảm
    if (this.price < this.sellPrice && this.a10s >= 0 && this.ap.am < -0.2) {
      console.log("Mua giảm:", this.price, this.a10s, this.ap.am);
      this.cancelBuyCommand();
      this.buy();
      wait();
      return;
    }

    // Mua giá tăng
    if (this.price > this.sellPrice && this.a10s >= 0 && this.ap.am > 0.2) {
      console.log("Mua tăng:", this.price, this.a10s, this.ap.am);
      this.cancelBuyCommand();
      this.buy();
      wait();
      return;
    }
  }
}
