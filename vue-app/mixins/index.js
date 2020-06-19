import makeBlockie from "ethereum-blockies-base64";

export default {
  methods: {
    truncateAddr: (addr) => {
      return addr.slice(0, 6) + "..." + addr.slice(-4);
    },
    makeBlockie,
  },
};
