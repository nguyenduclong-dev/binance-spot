<template>
  <div class="container">
    <div v-if="mode === 'mini'" class="mini">
      <span class="text-lg">
        {{ price }}
      </span>
    </div>
    <div v-else-if="mode === 'normal'"></div>
    <el-card v-else></el-card>
  </div>
</template>

<script>
/* eslint-disable for-direction */
export default {
  data() {
    return {
      active: false,
      mode: "mini", // mini, normal, full
      a10s: NaN, // 10s
      am: NaN, // 1 minute
      a15m: NaN, // 15 minutes
      ah: NaN, // 1 hour
      prices: [],
      price: 0,
      socket: null,
      couple: "",
      coin1: "",
      coin2: "",
    };
  },

  watch: {
    prices() {
      const now = Date.now();
      let a10s = NaN,
        am = NaN,
        a15m = NaN,
        ah = NaN;

      if (!this.prices.length) return;

      for (let index = this.prices.length - 1; index >= 0; index--) {
        const item = this.prices[index];

        if (isNaN(a10s) && item.t <= now - 10 * 1000) {
          a10s = this.price - item.p;
        }

        if (isNaN(am) && item.t <= now - 60 * 1000) {
          am = this.price - item.p;
        }

        if (isNaN(a15m) && item.t <= now - 15 * 60 * 1000) {
          a15m = this.price - item.p;
        }

        if (isNaN(ah) && item.t <= now - 60 * 60 * 1000) {
          ah = this.price - item.p;
          break;
        }
      }

      Object.assign(this, { a10s, am, a15m, ah });
    },
  },

  created() {
    const url = new URL(location.href);
    const symbol = url.pathname.split("/").pop();
    const [coin1, coin2] = symbol.split("_");
    this.coin1 = coin1;
    this.coin2 = coin2;
    this.couple = coin1 + coin2;
    this.setupSocket();

    this._interval = setInterval(this.tick30s, 30 * 1000);
  },

  beforeDestroy() {},

  methods: {
    load() {
      const saved = localStorage.getItem(`trade.${this.couple}`) || "{}";
      const data = JSON.parse(saved);
      Object.assign(this, data);
    },

    tick30s() {
      localStorage.setItem(
        `trade.${this.couple}`,
        JSON.stringify({
          a10s: this.a10s,
          am: this.am,
          a15m: this.a15m,
          ah: this.ah,
          prices: this.prices,
          couple: this.couple,
          coin1: this.coin1,
          coin2: this.coin2,
        })
      );
    },

    setupSocket() {
      const socket = new WebSocket("wss://stream.binance.com/stream");

      socket.addEventListener("open", () => {
        const payload = {
          method: "SUBSCRIBE",
          params: [`${this.couple.toLowerCase()}@aggTrade`],
          id: 2,
        };
        socket.send(JSON.stringify(payload));
      });

      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.stream === `${this.couple.toLowerCase()}@aggTrade`) {
          const item = {
            p: message.data.p,
            t: message.data.T,
          };
          if (this.prices[0] && this.prices[0].t < item.t - 60 * 60 * 1000) {
            this.prices.splice(0, 1);
          }
          this.prices.push(item);
          this.price = item.p;
        }
      });

      this.socket = socket;
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/variables.scss";
@import "@/assets/global.scss";

.container .mini {
  position: fixed;
  right: 24px;
  top: 80px;
  cursor: pointer;
  opacity: 1;
  z-index: 998;
  border-radius: 32px;
  height: 48px;
  padding: 0 12px;
  background-color: white;
  border: 1px solid #dcdfe6;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
