<template>
  <div class="about">
    <h1 class="content-heading">Acerca de los Bienes Públicos</h1>
    <h2>¿Qué son los Bienes Públicos?</h2>
    <p>
      Lo primero que hay que entender sobre los 'bienes públicos' es que,
      fundamentalmente, son bienes totalmente no excluibles ni sustraíbles: un
      bien público puede ser desde los intangibles (es decir, el conocimiento)
      hasta los bienes públicos sociales tangibles (es decir, el alumbrado
      público).
    </p>
    <p>En economía, los bienes públicos son bienes que son a la vez:</p>
    <ol>
      <li>
        No excluible: nadie (que sea miembro del "público") puede ser impedido
        de usar el bien, por ningún motivo.
      </li>
      <li>
        Sin rivalidad: una persona que usa el bien no reduce la capacidad de
        nadie para usarlo.
      </li>
    </ol>
    <p>
      El aire limpio, la seguridad nacional (para un país determinado) y el
      software de código abierto gratuito (FOSS) son ejemplos de bienes
      públicos, siendo el FOSS el más importante para clr.fund.
    </p>
    <p>
      Busca
      <links to="https://en.wikipedia.org/wiki/Public_good_(economics)"
        >Wikipedia</links
      >
      una descripción y un contexto más específicos.
    </p>
    <h2>
      ¿Por qué crear nuevos mecanismos de financiación para los bienes públicos?
    </h2>
    <p>
      Los bienes públicos a menudo no cuentan con fondos suficientes debido a
      algo llamado el problema del aprovechamiento gratuito: dado que los bienes
      públicos son siempre gratuitos y accesibles para los miembros del público,
      las personas tienen pocas razones para contribuir a su creación y
      mantenimiento. En cambio, pueden optar por ser "oportunistas": utilizar el
      bien público pero depender de otros para construirlo y mantenerlo.
    </p>
    <p>
      El problema del free rider está bastante presente en el software de código
      abierto, que crónicamente carece de fondos suficientes a pesar de ser un
      componente central de casi todos los productos de software populares en la
      actualidad.
    </p>
    <p>
      Clr.fund es un intento de abordar el problema del usuario gratuito para la
      comunidad Ethereum, con la esperanza de que esta infraestructura pueda ser
      útil para otros públicos en el futuro. Por diseño, las rondas de
      financiación de clr.fund buscan involucrar a miembros del público desde el
      inicio, y están asignando tanto el poder de toma de decisiones como el
      poder exponencial para aumentar la financiación a través del
      <links to="/ about / quadratic-finance"
        >mecanismo de financiación cuadrática</links
      >.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutPublicGoods extends Vue {}
</script>
