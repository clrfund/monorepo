<template>
  <v-container>
    <v-row v-if="user">
      <ProfileCard :address="user" />
      <v-col cols="7">
        <span>100 DAI</span>
        <v-progress-linear
          v-model="fundsAllocated"
          height="25"
          color="pink"
          track-color="pink lighten-4"
        >
          <template v-slot="{ value }">
            <strong>{{ Math.ceil(value) }}%</strong>
          </template>
        </v-progress-linear>
      </v-col>
      <v-col>
        <v-btn text color="pink accent-4">Fund</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="text-center">
        <Web3Signin v-if="!user" :signIn="signIn" />
      </v-col>
    </v-row>
    <v-list subheader>
      <v-divider></v-divider>
      <v-list-item
        v-for="item in items"
        :key="item.title"
        @click="selectRecipient(item)"
      >
        <RecipientItem :item="item"></RecipientItem>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script>
import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Signin from "../components/Web3Signin";
import RecipientItem from "../components/RecipientItem";
import ProfileCard from "../components/ProfileCard";

export default {
  components: { RecipientItem, Web3Signin, ProfileCard },
  data: () => ({
    user: null,
    web3: null,
    fundsAllocated: 20,
    max: 100,
    min: 0,
    items: [
      {
        active: true,
        address: "0xd26a3f686d43f2a62ba9eae2ff77e9f516d945b9",
      },
      {
        active: true,
        address: "0x710e2f9d630516d3afdd053de584f1fa421e84bc",
      },
      {
        address: "0x81aaa9a7a8358cc2971b9b8de72acce6d7862bc8",
      },
      {
        address: "0xd714dd60e22bbb1cbafd0e40de5cfa7bbdd3f3c8",
      },
      {
        address: "0x4fafa767c9cb71394875c139d43aee7799748908",
      },
    ],
  }),
  methods: {
    selectRecipient(recipient) {
      // console.log("recipient", recipient);
      this.$emit("selectRecipient", recipient);
    },
    async signIn() {
      try {
        const providerOptions = {
          walletconnect: {
            package: WalletConnectProvider, // required
            options: {
              infuraId: process.env.VUE_APP_INFURA,
            },
          },
        };
        const web3Modal = new Web3Modal({
          providerOptions, // required
          cacheProvider: true,
        });

        const provider = await web3Modal.connect();

        this.web3 = new Web3(provider);
        const [account] = await this.web3.eth.getAccounts();
        this.user = account;
      } catch (err) {
        // console.log("web3Modal error", err);
      }
    },
  },
};
</script>
