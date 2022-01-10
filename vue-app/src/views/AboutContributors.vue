<template>
  <div class="about">
    <h1 class="content-heading">Guía del contribuidor</h1>
    <h2>Obtén fondos en {{ chain.label }}</h2>
    <p>
      Necesitarás un poco de {{ chain.currency }} en la red de
      {{ chain.label }} para poder crear una transacción en los smart contracts
      de clr.fund.
      <span v-if="chain.label.includes('Arbitrum')">
        Sigue
        <links to="https://arbitrum.io/bridge-tutorial/">este tutorial</links>
        para pasar tus fondos a {{ chain.label }}
      </span>
      <span v-else-if="chain.bridge">
        Usa el
        <links :to="chain.bridge">{{ chain.label }} puente</links>
        para transferir algunos fondos.
      </span>
    </p>
    <p v-if="chain.isLayer2">
      Confundido en lo que {{ chain.label }} es?
      <links to="/about/layer-2">
        Lee nuestra explicación sobre cómo clr.fund usa la capa 2 en Ethereum.
      </links>
    </p>
    <h2>Contribuyendo a proyectos específicos</h2>
    <ol>
      <li>
        Antes de contribuir a proyectos específicos, deberás
        <links to="/verify">verificar que eres un humano único</links>. Esto
        ayuda a clr.fund
        <links to="/about/sybil-resistance">resistir sybil attacks</links>!
      </li>
      <li>
        Asegúrate de tener {{ nativeTokenSymbol }} en tu wallet verificada por
        BrightID en la red de {{ chain.label }}
      </li>
      <li>
        <links to="/projects">Revisa los proyectos</links> y agrega algunos a tu
        carreta, ajustando tus contribuciones a la cantidad de
        {{ nativeTokenSymbol }} que deseas.
      </li>
      <li>
        Cuando estés listo, abre tu carrito, haz clic en contribuir y confirma
        las transacciones para completar tus contribuciones!
      </li>
    </ol>
    <p>
      Nota: solo puedes contribuir una vez. Después de enviar tus
      contribuciones, puedes reasignarlas tanto como desees antes de que
      finalice la fase de reasignación, pero no puedes agregar más fondos al
      monto total de tu contribución.
    </p>
    <ol>
      <li>Puedes agregar y eliminar proyectos.</li>
      <li>
        El total de reasignación debe ser menor o igual que el total original.
        (si es menos, el resto irá al grupo correspondiente).
      </li>
    </ol>
    <h2>Contribuir al grupo correspondiente</h2>
    <p>
      ¿No estás seguro de a qué proyecto en específico contribuir? Las
      contribuciones al fondo de contrapartida se distribuirán a todos los
      proyectos que reciban contribuciones específicas del proyecto durante esa
      ronda. La ponderación de esta distribución está determinada por los
      resultados de
      <links to="/about/quadratic-funding">financiamiento cuadrático</links>
    </p>
    <ol>
      <li>
        Primero asegúrate de que la billetera que estás usando mantenga
        {{ nativeTokenSymbol }} en {{ chain.label }}. {{ nativeTokenSymbol }} se
        puede comprar fácilmente en cualquier exchange centrado en Ethereum.
      </li>
      <li>
        Una vez que tengas la cantidad deseada de {{ nativeTokenSymbol }} en tu
        billetera, selecciona "Agregar Fondos" en la
        <links to="/projects">Página de Proyectos</links> y confirma las
        transacciones.
      </li>
    </ol>
    <p></p>
    <h2>Cómo funciona clr.fund?</h2>
    <p>
      Buscas una descripción más general?
      <links to="/about/how-it-works"
        >Consulta nuestra página de "Cómo funciona"</links
      >.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'
import { chain } from '@/api/core'
import { ChainInfo } from '@/plugins/Web3/constants/chains'

@Component({ components: { Links } })
export default class AboutContributors extends Vue {
  get nativeTokenSymbol(): string {
    const { nativeTokenSymbol } = this.$store.state.currentRound
    return nativeTokenSymbol
  }

  get chain(): ChainInfo {
    return chain
  }
}
</script>
