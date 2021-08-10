<template>
  <div class="container">
    <div v-if="mode === 'mini'" class="mini">
      <div
        class="flex items-center border"
        style="border-radius: 24px; padding: 0 12px;background-color: #fff; margin-left: auto"
      >
        <span class="text-lg mr-2">
          {{ price | trimNumber }}
        </span>

        <el-button
          type="text"
          icon="el-icon-full-screen"
          @click="mode = 'full'"
        ></el-button>
      </div>

      <div
        v-if="active"
        class="mt-2 flex justify-center items-center border"
        style="border-radius: 24px; padding: 4px 12px;background-color: #fff; margin-left: auto"
      >
        <div :class="[nextAction === 'sell' ? 'text-danger' : 'text-success']">
          {{ nextAction | uppercase }}
        </div>
        <template v-if="nextAction === 'sell'">
          <span class="ml-2">
            mua:
            {{ buyPrice | precision(precision) | trimNumber }}
            <el-divider direction="vertical"></el-divider>
            {{ buyAmount | precision(precision) | trimNumber }}
            <el-divider direction="vertical"></el-divider>
            <span :class="[pnl.percent < 0 ? 'text-danger' : 'text-success']">
              {{ pnl.percent | percent }} ~
              {{ (price - buyPrice) * buyAmount }} {{ coin2 }}
            </span>
          </span>
        </template>
      </div>

      <div
        v-if="active"
        class="mt-2 flex justify-center items-center border"
        style="border-radius: 24px; padding: 4px 12px;background-color: #fff; margin-left: auto"
      >
        <div
          class="text-md font-bold w-full"
          :class="[profit < 0 ? 'text-danger' : 'text-success']"
        >
          {{ profit | precision(6) | trimNumber }} {{ coin2 }}
        </div>
      </div>
    </div>

    <div v-else class="full" :style="dialogStyle" ref="container">
      <el-card>
        <div
          slot="header"
          class="flex gap"
          @mousedown="handleDragStart"
          @mouseup="handleDragEnd"
          @mousemove="handleDrag"
          style="padding: 18px 20px; margin: -18px -20px; position: relative;"
        >
          <div class="flex flex-wrap flex-1 justify-start">
            <div class="text-md font-bold w-full">
              {{ price | trimNumber }}

              <template v-if="nextAction === 'sell'">
                <span class="ml-2">
                  mua:
                  {{ buyPrice | precision(precision) | trimNumber }}
                  <el-divider direction="vertical"></el-divider>
                  {{ buyAmount | precision(precision) | trimNumber }}
                  <el-divider direction="vertical"></el-divider>
                  <span
                    :class="[pnl.percent < 0 ? 'text-danger' : 'text-success']"
                  >
                    {{ pnl.percent | percent }}
                  </span>
                </span>
              </template>
            </div>
            <div class="text-md font-bold w-full">
              Lợi nhuận {{ profit | trimNumber }} {{ coin2 }}
            </div>
            <div class="w-full flex flex-wrap">
              <span class="w-1/2">
                <span class="mr">a10s:</span>
                {{ a10s | precision(precision) | trimNumber }}({{
                  ap.a10s | precision(precision) | trimNumber | percent
                }})
              </span>
              <span class="w-1/2">
                <span class="mr">am:</span>
                {{ am | precision(precision) | trimNumber }}({{
                  ap.am | precision(precision) | trimNumber | percent
                }})
              </span>
              <span class="w-1/2">
                <span class="mr">a15m:</span>
                {{ a15m | precision(precision) | trimNumber }}({{
                  ap.a15m | precision(precision) | trimNumber | percent
                }})
              </span>
              <span class="w-1/2">
                <span class="mr">ah:</span>
                {{ ah | precision(precision) | trimNumber }}({{
                  ap.ah | precision(precision) | trimNumber | percent
                }})
              </span>
            </div>

            <div
              :class="[nextAction === 'sell' ? 'text-danger' : 'text-success']"
            >
              {{ nextAction | uppercase }}
            </div>
          </div>
          <el-button
            icon="el-icon-close"
            style="position: absolute; top : 6px; right :8px; padding: 12px"
            type="text"
            @click="mode = 'mini'"
          ></el-button>

          <span
            style="font-size: 12px; position: absolute; bottom : 2px; right: 18px;"
          >
            Version: {{ app.version }}
          </span>
        </div>

        <el-form class="form">
          <el-form-item label="ChannelId">
            <el-input v-model="channel"></el-input>
          </el-form-item>

          <div class="flex gap-2">
            <el-form-item :label="`Budget (${coin2})`">
              <el-input-number
                :min="0"
                v-model="budget"
                controls-position="right"
                :step="step"
              ></el-input-number>
            </el-form-item>
          </div>

          <el-form-item label="Code">
            <editor
              v-model="code"
              @init="editorInit"
              lang="javascript"
              theme="chrome"
              width="100%"
              height="300"
            ></editor>
          </el-form-item>

          <el-switch v-model="active" active-text="Kích hoạt"></el-switch>
        </el-form>

        <div class="flex items-center justify-center w-full mt-4">
          <div>
            <el-button type="success" @click="handleSave">Lưu</el-button>
            <el-button @click="handleClear">
              Clear
            </el-button>
          </div>

          <div class="flex-1"></div>

          <div>
            <el-button type="success" @click="buy(price)">Mua</el-button>
            <el-button type="danger" @click="sell(price)">
              Bán
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
/* eslint-disable for-direction */
/* eslint-disable vue/no-reserved-keys */
import { rt, toFixedNoRound } from "./utils";
import app from "./app.json";

export default {
  name: "App",
  filters: {
    uppercase(value) {
      if (typeof value === "string") return value.toUpperCase();
      return value;
    },
    precision(value, fixed = 0) {
      return Number(value).toFixed(fixed);
    },
    trimNumber(value) {
      return Number(value).toString();
    },
    percent(value) {
      return toFixedNoRound(value, 3) + " %";
    },
    mul(value, n = 100) {
      return value * n;
    },
  },

  components: {
    // eslint-disable-next-line vue/no-unused-components
    editor: require("vue2-ace-editor"),
  },

  data() {
    return {
      app,
      active: false,
      mode: "mini", // mini, normal, full
      a10s: NaN, // 10s
      am: NaN, // 1 minute
      a15m: NaN, // 15 minutes
      ah: NaN, // 1 hour
      ap: {
        as: NaN,
        a10s: NaN, // 10s
        am: NaN, // 1 minute
        a15m: NaN, // 15 minutes
        ah: NaN, // 1 hour
      },
      prices: [],
      price: 0,
      socket: null,
      couple: "",
      coin1: "",
      coin2: "",
      precision: 0,
      step: 1,
      budget: 0,
      code: "",
      customHandle: null,
      dialogStyle: {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      },
      drag: {
        onDrag: false,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
      },
      buyPrice: 0,
      buyAmount: 0,
      sellPrice: 0,
      sellAmount: 0,
      nextAction: "buy", // sell
      profit: 0,
      channel: "",
      filled: false,
      histories: [],
      wait: false,
    };
  },

  watch: {
    prices() {
      const now = Date.now();
      // prettier-ignore
      let a10s = NaN, pa10s = NaN, am = NaN, pam = NaN, a15m = NaN, pa15m = NaN, ah = NaN, pah = NaN;

      if (!this.prices.length) return;

      for (let index = this.prices.length - 1; index >= 0; index--) {
        const item = this.prices[index];

        if (
          isNaN(a10s) &&
          item.T <= now - 10 * 1000 &&
          item.T >= now - 10 * 1000 - 10 * 1000
        ) {
          a10s = this.price - item.p;
          pa10s = (a10s / item.p) * 100;
        }

        if (
          isNaN(am) &&
          item.T <= now - 60 * 1000 &&
          item.T >= now - 60 * 1000 - 10 * 1000
        ) {
          am = this.price - item.p;
          pam = (am / item.p) * 100;
        }

        if (
          isNaN(a15m) &&
          item.T <= now - 15 * 60 * 1000 &&
          item.T >= now - 15 * 60 * 1000 - 60 * 1000
        ) {
          a15m = this.price - item.p;
          pa15m = (a15m / item.p) * 100;
        }

        if (
          isNaN(ah) &&
          item.T <= now - 60 * 60 * 1000 &&
          item.T >= now - 60 * 60 * 1000 - 60 * 1000
        ) {
          ah = this.price - item.p;
          pah = (ah / item.p) * 100;
          break;
        }
      }

      Object.assign(this, { a10s, am, a15m, ah });
      Object.assign(this.ap, { a10s: pa10s, am: pam, a15m: pa15m, ah: pah });

      if (this.active && this.customHandle) this.customHandle();
    },
  },

  created() {
    console.log(this);
    const url = new URL(location.href);
    const symbol = url.pathname.split("/").pop();
    const [coin1, coin2] = symbol.split("_");
    this.coin1 = coin1;
    this.coin2 = coin2;
    this.couple = coin1 + coin2;
    this.getPrices();
    this.load();
    this.setupSocket();
    this._interval = setInterval(this.tick30s, 30 * 1000);
    setTimeout(() => {
      Object.assign(this, this.getStep("#FormRow-BUY-total"));
    }, 1000);
  },

  beforeDestroy() {
    clearInterval(this._interval);
  },

  computed: {
    /**
     * @return {{percent: number, total: number}}
     */
    pnl() {
      if (this.nextAction === "sell" && this.buyPrice && this.buyAmount) {
        const percent = ((this.price - this.buyPrice) / this.price) * 100;
        return {
          percent,
          total: (this.price - this.buyPrice) * this.buyAmount,
        };
      }

      return { percent: 0, total: 0 };
    },
  },

  methods: {
    async getPrices() {
      const prices = await fetch(
        "https://www.binance.com/api/v1/aggTrades?limit=10000&symbol=" +
          this.couple.toUpperCase()
      ).then((res) => res.json());

      this.prices = prices;
      this.price = prices[prices.length - 1].p;
    },

    getStep(id) {
      const input = document.querySelector(id);
      if (input) {
        const step = +input.getAttribute("step") || 1;
        const min = +input.getAttribute("min") || step;
        let precision;
        if (+input.getAttribute("step") === 0) {
          precision = input.getAttribute("step").length - 2;
        } else {
          precision = Math.abs(Math.log10(step));
        }
        return { step, precision, min };
      }

      return { step: 0, precision: 0, min: 0 };
    },

    handleDragStart(event) {
      this.drag = {
        onDrag: true,
        x: event.x,
        y: event.y,
        top: this.$refs.container.getBoundingClientRect().top,
        left: this.$refs.container.getBoundingClientRect().left,
      };
    },
    handleDrag(event) {
      if (!this.drag.onDrag) return;
      this.dialogStyle = {
        top: this.drag.top + (event.y - this.drag.y) + "px",
        left: this.drag.left + (event.x - this.drag.x) + "px",
      };
    },
    handleDragEnd() {
      this.drag = {
        onDrag: false,
      };
    },

    editorInit: function() {
      require("brace/mode/javascript"); //language
      require("brace/theme/chrome");
      require("brace/snippets/javascript"); //snippet
    },

    codeToCustomHandle() {
      try {
        if (this.code) {
          this.customHandle = rt(this.code, this);
        } else {
          this.customHandle = null;
        }
      } catch (error) {
        this.customHandle = null;
      }
    },

    handleClear() {
      this.profit = 0;
      this.prices = [];
      this.save();
      this.$message.success("Cleared!");
    },

    load() {
      this.channel = localStorage.getItem("trade.channel") || "";
      const saved = localStorage.getItem(`trade.${this.couple}`) || "{}";
      const data = JSON.parse(saved);
      if (data.prices) delete data.prices;
      Object.assign(this, data);
      this.codeToCustomHandle();
    },

    tick30s() {
      this.removePast1h();
      this.save();
    },

    removePast1h() {
      const index =
        this.prices.findIndex((item) => item.T >= Date.now() - 60 * 60 * 1000) -
        1;

      if (index >= 0) {
        this.prices.splice(0, index);
      }
    },

    handleSave() {
      this.save();
      this.codeToCustomHandle();
      this.$message.success("Đã lưu");
    },

    save() {
      localStorage.setItem(
        `trade.${this.couple}`,
        JSON.stringify({
          a10s: this.a10s,
          am: this.am,
          a15m: this.a15m,
          ah: this.ah,
          couple: this.couple,
          coin1: this.coin1,
          coin2: this.coin2,
          active: this.active,
          code: this.code,
          budget: this.budget,
          buyPrice: this.buyPrice,
          buyAmount: this.buyAmount,
          sellPrice: this.sellPrice,
          sellAmount: this.sellAmount,
          nextAction: this.nextAction,
          profit: this.profit,
          filled: this.filled,
          histories: this.histories,
        })
      );

      localStorage.setItem("trade.channel", this.channel);
    },

    cancelBuyCommand() {
      const id = (this.coin1 + "/" + this.coin2).toUpperCase();
      const row = document.querySelector(
        `div[data-testid="tradeInfoTable"] div[title="${id}"] ~ div[title="Buy"]`
      )?.parentElement;

      if (row) {
        for (const child of row.children) {
          if (child.innerText === "Cancel") {
            child.click();
            return true;
          }
        }

        return false;
      }

      return false;
    },

    cancelSellCommand() {
      const id = (this.coin1 + "/" + this.coin2).toUpperCase();
      const row = document.querySelector(
        `div[data-testid="tradeInfoTable"] div[title="${id}"] ~ div[title="Sell"]`
      )?.parentElement;

      if (row) {
        for (const child of row.children) {
          if (child.innerText === "Cancel") {
            child.click();
            return true;
          }
        }

        return false;
      }

      return false;
    },

    setupSocket() {
      const socket = new WebSocket("wss://stream.binance.com/stream");
      const params = [`${this.couple.toLowerCase()}@aggTrade`];
      if (this.channel) params.push(this.channel);

      socket.addEventListener("open", () => {
        const payload = {
          method: "SUBSCRIBE",
          params,
          id: 12,
        };
        socket.send(JSON.stringify(payload));
      });

      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);

        if (message.stream === `${this.couple.toLowerCase()}@aggTrade`) {
          this.prices.push(message.data);
          this.price = message.data.p;
        }

        if (
          message.stream === this.channel &&
          message.data.s === this.couple.toUpperCase()
        ) {
          const data = message.data;

          if (data.S === "SELL" && data.X === "FILLED") {
            console.log("SELL FILLED", data);
            this.histories.push(data);
            this.sellPrice = +data.p;
            this.sellAmount = +data.z;
            if (this.buyPrice && this.buyAmount) {
              this.profit =
                this.profit +
                (this.sellPrice - this.buyPrice) * this.sellAmount;
            }
            this.filled = true;
            this.save();
          } else if (data.S === "BUY" && data.X === "FILLED") {
            console.log("BUY FILLED", data);
            this.histories.push(data);
            this.buyPrice = +data.p;
            this.buyAmount = +data.z;
            this.filled = true;
            this.save();
          }
        }
      });

      this.socket = socket;
    },

    getAmount() {},

    buy(buyPrice = this.price) {
      const form = document.querySelector("#orderformBuyBtn").parentElement;
      const inputPrice = form.querySelector("#FormRow-BUY-price");
      const inputAmount = form.querySelector("#FormRow-BUY-quantity");

      const price = +Math.max(
        +toFixedNoRound(buyPrice, this.getStep("#FormRow-BUY-price").precision),
        this.getStep("#FormRow-BUY-price").min
      );

      const amount = +Math.max(
        +toFixedNoRound(
          this.budget / buyPrice,
          this.getStep("#FormRow-BUY-quantity").precision
        ),
        this.getStep("#FormRow-BUY-quantity").min
      );

      inputPrice.value = price;
      inputAmount.value = amount;
      this.nextAction = "sell";
      this.filled = false;
      this.save();

      form.querySelector("#orderformBuyBtn").click();
    },

    sell(sellPrice = this.price) {
      const form = document.querySelector("#orderformSellBtn").parentElement;
      const inputPrice = form.querySelector("#FormRow-SELL-price");
      const inputAmount = form.querySelector("#FormRow-SELL-quantity");

      const price = +Math.max(
        toFixedNoRound(
          sellPrice,
          this.getStep("#FormRow-SELL-price").precision
        ),
        this.getStep("#FormRow-SELL-price").min
      );

      const amount = +Math.max(
        toFixedNoRound(
          this.getCoin2Avbl(),
          this.getStep("#FormRow-SELL-quantity").precision
        ),
        this.getStep("#FormRow-SELL-quantity").min
      );

      inputPrice.value = price;
      inputAmount.value = amount;
      this.nextAction = "buy";
      this.filled = false;
      this.save();

      form.querySelector("#orderformSellBtn").click();
    },

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
    position: fixed;
    right: 24px;
    top: 80px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
  }

  .full {
    width: auto;
    height: auto;
    z-index: 2000;
    position: fixed;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;

    .el-card {
      width: 600px;

      .form {
        overflow-y: auto;
        max-height: 60vh;
      }
    }
  }
}
</style>
