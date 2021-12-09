<template>
  <div class="about">
    <h1 class="content-heading">Acerca</h1>

    <h2>Qué es clr.fund?</h2>
    <p>
      Clr.fund, pronunciado "Clear Fund",
      es un protocolo para la asignación eficiente de fondos a bienes públicos
      que benefician a la Red Ethereum de acuerdo con las preferencias de la Comunidad.
      Clr.fund se esfuerza por lograr neutralidad, descentralización, sin necesidad de permisos,
      sin necesidad de confianza y pseudonimato creíbles.
    </p>

    <h2>Por qué existe clr.fund?</h2>
    <p>
      Asignar fondos a
      <links to="/about/public-goods">bienes públicos</links> — productos básicos o servicios que no son ni excluibles ni sustraibles — es un desafío para cualquier ecosistema, y Ethereum no es una excepción..
    </p>
    <p>
      El objetivo de Clr.fund es permitir que los fondos se asignen a bienes públicos
      que benefician a la red Ethereum sin depender de entidades centralizadas
      y de una manera que refleje las preferencias de la Comunidad Ethereum.
    </p>
    <p>
      Mira la
      <links to="https://github.com/clrfund/constitution"
        >Constitución de Clr.fund </links
      >
      para más detalles sobre las metas y valores de clr.fund.
    </p>

    <h2>Cómo es único clr.fund?</h2>
    <p>Las instancias de Clr.fund también tienen otras propiedades especiales:</p>
    <ul>
      <li>
        Descentralización — Las principales piezas de la infraestructura de clr.fund se basan en
        <links to="https://ethereum.org/en/what-is-ethereum/">Ethereum</links>,
        una cadena de bloques programable que proporciona un ledger confiable y resistente a la censura para las transacciones de votación y financiación de clr.fund.
        <links to="/about/decentralization"
          >Lee más sobre la descentralización de clr.fund</links
        >.
      </li>
      <li>
        Escalabilidad: debido a que usar Ethereum puede ser costoso para los usuarios, clr.fund usa
        {{ chain.isLayer2 ? `"layer 2"` : `"sidechain"` }} redes complementarias para obtener la mayoría de los beneficios de la red principal de Ethereum pero con transacciones más rápidas y económicas.
        <links v-if="chain.isLayer2" to="/about/layer-2">
          Obtén más información sobre el uso de la capa 2 por parte de clr.fund.
        </links>
      </li>
      <li>
        Resistencia a la colusión: dado que blockchains como Ethereum publican todos los datos
        públicamente de forma predeterminada, los contribuyentes de clr.fund son vulnerables al soborno y
        otros tipos de manipulación. Clr.fund ayuda a prevenir estos ataques usando
        matemáticas mágicas llamadas zero-knowledge proofs.
        <links to="/about/maci"
          >Averigua sobre MACI, nuestro Infraestructura Minima Anti-Collusion.</links
        >
      </li>
      <li>
        Sybil-resistance — Los sistemas de votación que se preocupan por la cantidad
        de personas individuales que votan por una elección determinada,
        como lo hace la financiación cuadrática, pueden ser vulnerables
        a los sybil attacks, en los que una persona establece muchas identidades
        para votar varias veces. Clr.fund mitiga esta amenaza con un sistema de identidad llamado BrightID.
        <links to="/about/sybil-resistance">Averigua mas acerca de BrightID</links
        >.
      </li>
    </ul>
    <p>
      Clr.fund también está diseñado para que cualquiera pueda poner en marcha y
      ejecutar su propia instancia para crear un programa de subvenciones de bienes
      públicos para su público en particular.
    </p>

    <h2>Cómo funciona?</h2>
    <p>
      El protocolo de clr.fund usa el algoritmo Constrained Liberal Radicalism (CLR), comúnmente llamado
      <links to="/about/quadratic-funding">financiamiento cuadrático</links> (QF), para facilitar las contribuciones
      monetarias de los miembros de la Comunidad Ethereum hacia los constructores de bienes públicos Ethereum.
    </p>
    <p>
      Con su lógica codificada en contratos inteligentes Ethereum y otras tecnologías web3,
      clr.fund requiere una confianza mínima en cualquier persona o entidad individual
      para funcionar y es resistente a la colusión y el soborno.
    </p>

    <p>
      En un nivel alto, clr.fund consiste en un grupo de contrapartida y una ronda de financiación.
      Las personas u organizaciones filantrópicas contribuyen al fondo de contrapartida
      para que esos fondos se asignen de manera eficiente de acuerdo a la preferencia de la comunidad.
      Los usuarios contribuyen directamente a los proyectos que valoran y, al hacerlo
      ganan una parte del fondo común para los proyectos, junto con su
      contribución. Incrementando efectivamente el valor de su contribución.

    </p>

    <p>
      Por debajo, clr.fund utiliza zero-knowledge proofs (ZK-SNARKS), cortesía de
      <links to="/about/maci"
        >Infraestructura Minima Anti-collusion Infrastructure (MACI)</links
      >, para mantener la privacidad de las contribuciones individuales y limitar la efectividad de la colusión y el soborno.
    </p>
    <p>
      Para asegurarse de que cada contribuyente sea una persona única, clr.fund usa
      <links to="/about/sybil-resistance">BrightID</links>.
    </p>
    <p>
      ¿Aún tienes curiosidad? Leer más sobre
      <links to="/about/how-it-works">como funciona clr.fund </links>.
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
export default class About extends Vue {
  get chain(): ChainInfo {
    return chain
  }
}
</script>
