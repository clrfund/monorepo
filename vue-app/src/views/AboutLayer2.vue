<template>
  <div class="about">
    <h1 class="content-heading">Acerca de Layer 2</h1>

    <h2>Clr.fund en Layer 2</h2>
    <p>
      <b>
        tl;dr: clr.fund corre en
        <links
          to="https://ethereum.org/en/developers/docs/scaling/layer-2-rollups/"
          >Ethereum Layer 2 rollups</links
        >
        para ayudarlo a ahorrar tiempo y dinero al contribuir con sus proyectos
        favoritos. Necesitará una billetera con fondos en {{ chain.label }} para
        interactuar con esta aplicación.
      </b>
    </p>
    <button
      v-if="chain.bridge"
      class="btn-secondary"
      @click="scrollToId('bridge')"
    >
      Bridge tus Fondos
    </button>

    <h2>Costos de transacción de Ethereum</h2>
    <p>
      Ethereum, el blockchain que alberga gran parte de la infraestructura de
      clr.fund, requiere que los usuarios paguen los costos de transacción
      cuando interactúan con ella, y estos costos están aumentando. Las tarifas
      de transacción compensan a la comunidad descentralizada de mineros de
      Ethereum por procesar y mantener el estado del blockchain de forma segura.
      A medida que el uso de Ethereum ha aumentado, también lo ha hecho el
      precio de conseguir que los mineros incluyan su transacción en el
      blockchain.
    </p>
    <p>
      Entonces, el costo creciente de usar Ethereum demuestra que es útil, lo
      cual es genial, pero también presenta un problema para los usuarios
      finales que no quieren pagar tarifas de 10 o 100 dólares.
    </p>

    <h2>Layer 2 para Escalabilidad</h2>
    <p>
      El blockchain principal de Ethereum, "layer 1", puede actualizarse para
      reducir costos en el futuro (¡Este es uno de los objetivos para el futuro
      de Ethereum, que clr.fund está ayudando a realizar!).
    </p>
    <p>
      Sin embargo, a corto plazo, las soluciones de "layer 2" ya están ayudando
      a reducir drásticamente los costos. La mayoría de las layer 2 son
      "acumulaciones", sistemas tipo blockchain que se mantienen, como Ethereum,
      por un grupo descentralizado de nodos. Los rollups periódicamente
      "acumulan" todas sus transacciones recientes en una sola transacción que
      se registra en la layer 1, Ethereum, lo que les permite heredar gran parte
      de la seguridad de Ethereum.
    </p>
    <p>
      Las transacciones en las layer 2s son órdenes de magnitud más baratas que
      en la layer 1, ya que los paquetes acumulados pueden procesar una alta
      tasa de transacciones y el tráfico de transacciones ahora se diluye en las
      muchas opciones de la layer 2.
    </p>
    <p>
      Leer más en
      <links
        to="https://ethereum.org/en/developers/docs/scaling/layer-2-rollups/"
      >
        Tecnologías Ethereum Layer 2</links
      >.
    </p>
    <div v-if="chain.bridge" class="divider" id="bridge" />
    <!-- If chain is Arbitrum, display bridge information: -->
    <div v-if="chain.label.includes('Arbitrum')" class="chain-details">
      <h2>{{ chain.label }}</h2>
      <p>
        Hay muchas variaciones en el enfoque de acumulación de capa 2. Esta
        ronda actual de clr.fund utiliza {{ chain.label }}, un resumen de estilo
        "optimista".
        <links o="https://developer.offchainlabs.com/docs/rollup_basics">
          Obtenga más información en los {{ chain.label }} documentos</links
        >.
      </p>

      <h2>Lo que necesitarás</h2>
      <ul>
        <li>Una wallet que admite {{ chain.label }}</li>
        <li>Fondos en {{ chain.label }}</li>
      </ul>
      <h3>
        💼 Cómo encontrar una wallet que admita {{ chain.label }}
        <img
          v-tooltip="{
            content:
              'Los recursos de una Wallet se proporcionan para su conveniencia y no representan el respaldo de ninguno de los proyectos o servicios incluidos en el mismo. Siempre DYOR.',
            trigger: 'hover click',
          }"
          width="16px"
          src="@/assets/info.svg"
        />
      </h3>
      <ul>
        <li>
          Visita el portal
          <links to="https://portal.arbitrum.one/">
            {{ chain.label }} Oficial
          </links>
          y filtra por "Wallets" para ver algunas de las carteras que
          actualmente son compatibles con la red {{ chain.label }}.
        </li>
        <li>
          Verifica que cualquier wallet que consideres
          <links to="https://registry.walletconnect.org/wallets">
            soporta WalletConnect
          </links>
          para asegurarse de que pueda conectarse a la aplicación.
        </li>
      </ul>
      <h3>💰 ¿Cómo obtener fondos en {{ chain.label }}?</h3>
      <p>
        <links :to="chain.bridge" :hideArrow="true">
          <button class="btn-action">
            Puente de {{ chain.label }} Oficial
          </button>
        </links>
      </p>
      <p>
        Sigue los pasos a continuación o utiliza el
        <links to="https://arbitrum.io/bridge-tutorial/">
          tutorial oficial
        </links>
        como guía en cualquier momento.
      </p>
      <ol>
        <li>Haz click arriba para ir al puente{{ chain.label }} oficial</li>
        <li>
          Conecta tu wallet que soporta {{ chain.label }} usando
          <strong>Mainnet</strong>
        </li>
        <li>
          Seleccione la moneda (algo de ETH primero para gas y algo de
          {{ nativeToken.symbol }} para contribuir)
          <p>
            Para {{ nativeToken.symbol }}, haz clic en el menú "Token", busca
            {{ nativeToken.symbol }} y selecciona el token.
          </p>
        </li>
        <li>Ingresa la cantidad y haz clic en "Depositar"</li>
        <li>Confirma en tu wallet</li>
      </ol>
      <p>
        Una vez que hayas vinculado tu {{ nativeToken.symbol }} a
        {{ chain.label }}, es posible que desees agregarel
        <links :to="blockExplorerUrl">token</links> a tu wallet e.g. en
        MetaMask.
      </p>
      <button
        v-if="currentUser && isMetaMask"
        class="btn-secondary"
        @click="addTokenToWallet"
      >
        Agrega {{ chain.label }} {{ nativeToken.symbol }} a MetaMask
      </button>
    </div>
    <!-- If chain isn't Arbitrum, but still has a bridge URL, display its information: -->
    <div v-else-if="chain.bridge">
      <h2>{{ chain.label }}</h2>
      <h2>¿Qué necesitarás?</h2>
      <ul>
        <li>Una wallet que soporte {{ chain.label }}</li>
        <li>Fondos en {{ chain.label }}</li>
      </ul>
      <h2>💰 Vincula tus fondos a {{ chain.label }}</h2>
      <p>
        <links :to="chain.bridge" :hideArrow="true">
          <button class="btn-action">{{ chain.label }} Bridge</button>
        </links>
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { User } from '@/api/user'
import { chain } from '@/api/core'
import { ChainInfo } from '@/plugins/Web3/constants/chains'
import Links from '@/components/Links.vue'
import WalletWidget from '@/components/WalletWidget.vue'

@Component({ components: { Links, WalletWidget } })
export default class AboutLayer2 extends Vue {
  scrollToId(id: string): void {
    const element = document.getElementById(id)
    if (!element) return
    const navBarOffset = 80
    const elementPosition = element.getBoundingClientRect().top
    const top = elementPosition - navBarOffset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  mounted() {
    const { section: id } = this.$route.params
    if (id) {
      this.scrollToId(id)
    }
  }

  get windowEthereum(): any {
    return (window as any).ethereum
  }

  get isMetaMask(): boolean {
    return this.windowEthereum.isMetaMask
  }

  async addTokenToWallet() {
    try {
      if (this.windowEthereum && this.isMetaMask) {
        await this.windowEthereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: this.nativeToken.address,
              symbol: this.nativeToken.symbol,
              decimals: this.nativeToken.decimals,
            },
          },
        })
      }
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.log(error)
    }
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get chain(): ChainInfo {
    return chain
  }

  get nativeToken(): { [key: string]: any } {
    const {
      nativeTokenSymbol: symbol,
      nativeTokenAddress: address,
      nativeTokenDecimals: decimals,
    } = this.$store.state.currentRound
    return { symbol, address, decimals }
  }

  get blockExplorerUrl(): string {
    return `${chain.explorer}/address/${this.nativeToken.address}`
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

button {
  margin: 2rem 0;

  @media (max-width: $breakpoint-s) {
    width: 100%;
  }
}
</style>
