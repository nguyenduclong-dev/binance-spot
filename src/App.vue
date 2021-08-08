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
      mode: "mini", // mini, normal, full
      a10s: null, // 10s
      am: null, // 1 minute
      a15m: null, // 15 minutes
      ah: null, // 1 hour
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
      let a10s, am, a15m, ah;

      for (let index = this.prices.length - 1; index <= 0; index--) {
        const item = this.prices[index];
        console.log(item);

        if (!a10s && item.t <= now - 10 * 1000) {
          a10s = this.price - item.p;
        }

        if (!am && item.t <= now - 60 * 1000) {
          am = this.price - item.p;
        }

        if (!a15m && item.t <= now - 15 * 60 * 1000) {
          a15m = this.price - item.p;
        }

        if (!ah && item.t <= now - 60 * 60 * 1000) {
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
  },

  methods: {
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
          this.prices.push({
            p: message.data.p,
            t: message.data.T,
          });
          this.price = message.data.p;
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
