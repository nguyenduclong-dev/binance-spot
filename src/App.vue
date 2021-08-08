<template>
  <div class="container">
    <div v-if="mode === 'mini'" class="mini">
      <span class="text-lg mr-2">
        {{ price }}
      </span>

      <el-button
        type="text"
        icon="el-icon-full-screen"
        @click="mode = 'full'"
      ></el-button>
    </div>

    <div v-else class="full">
      <el-card>
        <div slot="header" class="flex gap">
          <div class="flex flex-wrap flex-1 justify-start">
            <div class="text-md font-bold w-full">{{ price | trimNumber }}</div>
            <div>
              <span>
                <span class="mr">a10s:</span>
                {{ a10s | precision(precision) | trimNumber }}
              </span>
              <span class="ml">
                <span class="mr">am:</span>
                {{ am | precision(precision) | trimNumber }}
              </span>
              <span class="ml">
                <span class="mr">a15m:</span>
                {{ a15m | precision(precision) | trimNumber }}
              </span>
              <span class="ml">
                <span class="mr">ah:</span>
                {{ ah | precision(precision) | trimNumber }}
              </span>
              <span class="flex-1"></span>
            </div>
          </div>
          <el-button
            icon="el-icon-close"
            class="mb-auto"
            style="float: right; padding: 3px 0"
            type="text"
            @click="mode = 'mini'"
          >
            Close
          </el-button>
        </div>

        <el-form>
          <div class="flex gap-2">
            <el-form-item :label="`Budget (${coin1})`">
              <el-input-number
                :min="0"
                v-model="budget"
                controls-position="right"
                :step="10 ** -fixed"
              >
                <span slot="prefix">s</span>
              </el-input-number>
            </el-form-item>
            <el-form-item label="Precision">
              <el-input-number
                :min="0"
                v-model="precision"
                controls-position="right"
              />
            </el-form-item>
          </div>
          <el-switch v-model="active" active-text="Kích hoạt"></el-switch>
        </el-form>

        <div class="flex items-center justify-center w-full mt-4">
          <el-button type="success" @click="save(false)">Lưu</el-button>
          <el-button @click="handleClear">
            Clear
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
/* eslint-disable for-direction */
export default {
  filters: {
    precision(value, fixed = 0) {
      return Number(value).toFixed(fixed);
    },
    trimNumber(value) {
      return Number(value).toString();
    },
  },

  data() {
    return {
      loaded: false,
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
      precision: 3,
      budget: 0,
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

        if (
          isNaN(a10s) &&
          item.t <= now - 10 * 1000 &&
          item.t >= now - 10 * 1000 - 10 * 1000
        ) {
          a10s = this.price - item.p;
        }

        if (
          isNaN(am) &&
          item.t <= now - 60 * 1000 &&
          item.t >= now - 60 * 1000 - 10 * 1000
        ) {
          am = this.price - item.p;
        }

        if (
          isNaN(a15m) &&
          item.t <= now - 15 * 60 * 1000 &&
          item.t >= now - 15 * 60 * 1000 - 60 * 1000
        ) {
          a15m = this.price - item.p;
        }

        if (
          isNaN(ah) &&
          item.t <= now - 60 * 60 * 1000 &&
          item.t >= now - 60 * 60 * 1000 - 60 * 1000
        ) {
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
    this.load();
    this.setupSocket();

    this._interval = setInterval(this.tick30s, 30 * 1000);
  },

  beforeDestroy() {
    clearInterval(this._interval);
  },

  methods: {
    handleClear() {
      this.prices = [];
      this.save();
      this.$message.success("Cleared!");
    },
    load() {
      const saved = localStorage.getItem(`trade.${this.couple}`) || "{}";
      const data = JSON.parse(saved);
      if (data.prices) {
        const index =
          data.prices.findIndex(
            (item) => item.t >= Date.now() - 60 * 60 * 1000
          ) - 1;

        if (index >= 0) {
          data.prices.splice(0, index);
        }
      }
      Object.assign(this, data);
    },

    tick30s() {
      this.save();
    },

    save(silient = true) {
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
          precision: this.precision,
          active: this.active,
        })
      );
      if (!silient) {
        this.$message.success("Đã lưu");
      }
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
          if (
            this.prices[0] &&
            this.prices[0].t < item.t - 60 * 60 * 1000 + 10000
          ) {
            this.prices.splice(0, 1);
          }
          this.prices.push(item);
          this.price = item.p;
        }
      });

      this.socket = socket;
    },
    buy() {
      const form = document.querySelector("#orderformBuyBtn").parentElement;
      console.log(form);
    },

    sell() {},

    getCoin1Avbl() {
      return Number(
        document
          .querySelector('.balance span[data-testid="baseAssetAmount"]')
          .innerText.split(" ")
          .shift()
      );
    },

    getCoin2Avbl() {
      return Number(
        document
          .querySelector('.balance span[data-testid="quoteAssetAmount"]')
          .innerText.split(" ")
          .shift()
      );
    },
  },
};
</script>

<style lang="scss">
@import "@/assets/variables.scss";
@import "@/assets/global.scss";

.container {
  .mini {
    display: flex;
    gap: 4px;
    position: fixed;
    right: 24px;
    top: 80px;
    z-index: 998;
    border-radius: 32px;
    height: 32px;
    padding: 0 12px;
    background-color: white;
    border: 1px solid #dcdfe6;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .full {
    z-index: 998;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

    .el-card {
      width: 600px;
      max-height: 80vh;
      overflow-y: auto;
    }
  }
}
</style>
