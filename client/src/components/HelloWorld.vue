<template>
  <v-app id="inspire">
    <v-app-bar
      app
      color="white"
      flat
    >
      <v-avatar
        :color="$vuetify.breakpoint.smAndDown ? 'grey darken-1' : 'transparent'"
        size="32"
      ></v-avatar>

      <v-tabs
      v-model="tab"
      background-color="transparent"
      color="basil"
      grow
    >
      <v-tab
        v-for="item in items"
        :key="item"
      >
        {{ item }}
      </v-tab>
    </v-tabs>
      <v-btn v-if="walletAddress==null" elevation="2" rounded v-on:click="connectWallet()">Connect</v-btn>
      <v-btn v-else elevation="2" rounded>{{trimAddress(walletAddress)}}</v-btn>
    </v-app-bar>
    <v-main class="grey lighten-3">
      <v-container>
        <v-row>
          <v-col
            cols="12"
            sm="12"
          >
            <v-sheet
              min-height="70vh"
              rounded="lg"
            >
                <v-data-table v-if="tab==0"
                :headers="headers"
                :items="dessertsHome"
                :items-per-page="15"
                class="elevation-1"
                ></v-data-table>

                <v-data-table v-if="tab==1"
                :headers="headers"
                :items="dessertsAbout"
                :items-per-page="15"
                class="elevation-1"
                ></v-data-table>

            </v-sheet>
          </v-col>

        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
  /* eslint-disable */
  import Onboard from 'bnc-onboard';
  import Web3 from 'web3';
  let web3;
  const onboard = Onboard({
    dappId: "12153f55-f29e-4f11-aa07-90f10da5d778", // [String] The API key created by step one above
    networkId: 4,  // [Integer] The Ethereum network ID your Dapp uses.
    subscriptions: {
      wallet: wallet => {
          web3 = new Web3(wallet.provider)
      }
    }
  });
  export default {
    data: () => ({
        walletConnected: false,
        walletAddress: null,
        // currTab: 'Home',
        // tabs: ['Home', 'About'],
        tab: null,
        items: [
          'Home', 'About', 'Deserts', 'Cocktails',
        ],
        headers: [
          {
            text: 'Dessert (100g serving)',
            align: 'start',
            sortable: false,
            value: 'name',
          },
          { text: 'Calories', value: 'calories' },
          { text: 'Fat (g)', value: 'fat' },
          { text: 'Carbs (g)', value: 'carbs' },
          { text: 'Protein (g)', value: 'protein' },
          { text: 'Iron (%)', value: 'iron' },
        ],
        dessertsHome: [
          {
            name: 'Frozen Yogurt',
            calories: 159,
            fat: 6.0,
            carbs: 24,
            protein: 4.0,
            iron: '1%',
          },
          {
            name: 'Ice cream sandwich',
            calories: 237,
            fat: 9.0,
            carbs: 37,
            protein: 4.3,
            iron: '1%',
          },
          {
            name: 'Eclair',
            calories: 262,
            fat: 16.0,
            carbs: 23,
            protein: 6.0,
            iron: '7%',
          },
          {
            name: 'Cupcake',
            calories: 305,
            fat: 3.7,
            carbs: 67,
            protein: 4.3,
            iron: '8%',
          },
          {
            name: 'Gingerbread',
            calories: 356,
            fat: 16.0,
            carbs: 49,
            protein: 3.9,
            iron: '16%',
          },
          {
            name: 'Jelly bean',
            calories: 375,
            fat: 0.0,
            carbs: 94,
            protein: 0.0,
            iron: '0%',
          },
          {
            name: 'Lollipop',
            calories: 392,
            fat: 0.2,
            carbs: 98,
            protein: 0,
            iron: '2%',
          },
          {
            name: 'Honeycomb',
            calories: 408,
            fat: 3.2,
            carbs: 87,
            protein: 6.5,
            iron: '45%',
          },
          {
            name: 'Donut',
            calories: 452,
            fat: 25.0,
            carbs: 51,
            protein: 4.9,
            iron: '22%',
          },
          {
            name: 'KitKat',
            calories: 518,
            fat: 26.0,
            carbs: 65,
            protein: 7,
            iron: '6%',
          },
        ],
        dessertsAbout: [
          {
            name: 'Frozen Yogurt',
            calories: 159,
            fat: 6.0,
            carbs: 24,
            protein: 4.0,
            iron: '1%',
          },
          {
            name: 'Ice cream sandwich',
            calories: 237,
            fat: 9.0,
            carbs: 37,
            protein: 4.3,
            iron: '1%',
          },
          {
            name: 'Eclair',
            calories: 262,
            fat: 16.0,
            carbs: 23,
            protein: 6.0,
            iron: '7%',
          },
          {
            name: 'Cupcake',
            calories: 305,
            fat: 3.7,
            carbs: 67,
            protein: 4.3,
            iron: '8%',
          },
          {
            name: 'Gingerbread',
            calories: 356,
            fat: 16.0,
            carbs: 49,
            protein: 3.9,
            iron: '16%',
          },
          {
            name: 'Jelly bean',
            calories: 375,
            fat: 0.0,
            carbs: 94,
            protein: 0.0,
            iron: '0%',
          },
        ],
    }),
    computed: {
    },
    methods: {
        connectWallet: async function() {
            await onboard.walletSelect();
            await onboard.walletCheck();
            this.walletConnected = true;
            this.walletAddress = onboard.getState().address;
        },
        trimAddress: function(addr) {
            return addr.substring(0,6)+"..."+addr.substring(addr.length-5,addr.length);
        }
    },
    mounted() {
    }
  }
</script>
