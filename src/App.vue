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

    <div v-else class="full" :style="dialogStyle" ref="container">
      <el-card>
        <div
          slot="header"
          class="flex gap"
          @mousedown="handleDragStart"
          @mouseup="handleDragEnd"
          @mousemove="handleDrag"
          style="padding: 18px 20px; margin: -18px -20px;"
        >
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
            <el-form-item :label="`Budget (${coin2})`">
              <el-input-number
                :min="0"
                v-model="budget"
                controls-position="right"
                :step="step"
              >
                <span slot="prefix">s</span>
              </el-input-number>
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
            <el-button type="success" @click="save(false)">Lưu</el-button>
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
import { rt } from "./utils";

export default {
  name: "App",
  filters: {
    precision(value, fixed = 0) {
      return Number(value).toFixed(fixed);
    },
    trimNumber(value) {
      return Number(value).toString();
    },
  },

  components: {
    // eslint-disable-next-line vue/no-unused-components
    editor: require("vue2-ace-editor"),
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
      precision: 0,
      step: 1,
      budget: 0,
      code: "",
      scripts: {},
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
    console.log(this);
    const url = new URL(location.href);
    const symbol = url.pathname.split("/").pop();
    const [coin1, coin2] = symbol.split("_");
    this.coin1 = coin1;
    this.coin2 = coin2;
    this.couple = coin1 + coin2;
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

  methods: {
    getStep(id) {
      const input = document.querySelector(id);
      if (input) {
        const step = +input.getAttribute("step");
        const min = +input.getAttribute("min");
        const precision = Math.abs(Math.log10(step));
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

    loadScripts() {
      if (this.code) {
        this.scripts = rt(this.code, this);
      }
    },

    handleClear() {
      this.prices = [];
      this.save();
      this.$message.success("Cleared!");
    },

    load() {
      const saved = localStorage.getItem(`trade.${this.couple}`) || "{}";
      const data = JSON.parse(saved);
      Object.assign(this, data);
      this.removePast1h();
      this.loadScripts();
    },

    removePast1h() {
      const index =
        this.prices.findIndex((item) => item.t >= Date.now() - 60 * 60 * 1000) -
        1;

      if (index >= 0) {
        this.prices.splice(0, index);
      }
    },

    tick30s() {
      this.removePast1h();
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
          active: this.active,
          code: this.code,
        })
      );

      this.loadScripts();

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
          this.prices.push(item);
          this.price = item.p;
        }
      });

      this.socket = socket;
    },

    getAmount() {},

    buy() {
      const form = document.querySelector("#orderformBuyBtn").parentElement;
      const inputPrice = form.querySelector("#FormRow-BUY-price");
      const inputTotal = form.querySelector("#FormRow-BUY-total");

      const price = +Math.max(
        Number(this.price).toFixed(
          this.getStep("#FormRow-BUY-price").precision
        ),
        this.getStep("#FormRow-BUY-price").min
      );

      const total = +Math.min(
        Math.max(
          Number(this.price).toFixed(
            this.getStep("#FormRow-BUY-total").precision
          ),
          this.getStep("#FormRow-BUY-total").min
        ),
        this.budget
      );

      console.log(form, price, total);

      inputPrice.value = price;
      inputTotal.value = total;
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
    z-index: 2000;
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
      max-height: 80vh;
      overflow-y: auto;
    }
  }
}
</style>
