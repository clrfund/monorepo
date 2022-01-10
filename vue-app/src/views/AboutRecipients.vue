<template>
  <div class="about">
    <h1 class="content-heading">Guía del Destinatario</h1>
    <div v-if="chain.bridge">
      <h2>Obtenga fondos en {{ chain.label }}</h2>
      <p>
        Necesitará algo de{{ chain.currency }} en {{ chain.label }}
        para enviar transacciones a los contratos inteligentes de clr.fund.
        <span v-if="chain.isLayer2">
          Sigue
          <links
            :to="{
              name: 'about-layer-2',
              params: {
                section: 'bridge',
              },
            }"
          >
            estos pasos
          </links>
          para unir sus fondos a {{ chain.label }}
        </span>
        <span v-else>
          <links :to="chain.bridge">Bridge your funds here</links>
        </span>
      </p>
      <p v-if="chain.isLayer2">
        ¿Confundido en lo que {{ chain.label }} es?
        <links to="about/layer-2">
          Lee nuestra explicación sobre cómo clr.fund usa la layer 2 en
          Ethereum.
        </links>
      </p>
    </div>
    <h2>Registra tyu proyecto</h2>
    <ol>
      <li>Dirígete a la <links to="/join">página de ingreso </links>.</li>
      <li>
        Haz clic en "Ver criterios de ronda" y conoce cuáles son los criterios
        para que inscribas tu proyecto.
      </li>
      <li>
        Una vez que estés familiarizado con los criterios y estés seguro de que
        tu proyecto los cumple, haga clic en "Agregar proyecto". Verás una serie
        de formularios para completar solicitando más información sobre tu
        proyecto.
      </li>
      <li>
        Una vez finalizados los formularios, puede finalizar su envío de la
        siguiente manera:
        <ol>
          <li>
            conectarse a la red correcta a través de su billetera de elección
          </li>
          <li>enviando un depósito de 0.1 ETH al contrato de registro.</li>
        </ol>
        Los proyectos se aceptan de forma predeterminada, pero el administrador
        del registro puede eliminar los proyectos que no cumplan con los
        criterios. De cualquier manera, se le devolverá su ETH una vez que su
        solicitud haya sido aceptada o rechazada. Tenga en cuenta que los
        metadatos que apuntan a toda la información de su proyecto (pero no a la
        información de contacto) se almacenarán públicamente en blockchain.
      </li>
    </ol>
    <h2>Reclama tus fondos</h2>
    <p>
      Una vez finalizada una ronda de fondos públicos, es sencillo reclamar la
      parte de los fondos que le corresponden a tu proyecto. Regresa a la página
      de tu proyecto: verás un botón "reclamar fondos" si tu proyecto recibió
      contribuciones durante la ronda. Envía la transacción de reclamo para
      recibir tus fondos.
    </p>
    <h2>¿Cómo funciona Clr.fund?</h2>
    <p>
      ¿Buscas una descripción más general?
      <links to="/about/how-it-works">Check out our "How It Works" page</links>.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'
import { chain } from '@/api/core'
import { ChainInfo } from '@/plugins/Web3/constants/chains'
import { formatAmount } from '@/utils/amounts'

@Component({ components: { Links } })
export default class AboutRecipients extends Vue {
  get chain(): ChainInfo {
    return chain
  }

  get depositAmount(): string {
    return this.$store.state.recipientRegistryInfo
      ? formatAmount(this.$store.state.recipientRegistryInfo.deposit, 18)
      : '...'
  }

  get depositToken(): string {
    return this.$store.state.recipientRegistryInfo?.depositToken ?? ''
  }
}
</script>
