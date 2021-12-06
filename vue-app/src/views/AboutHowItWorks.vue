<template>
  <div class="about">
    <h1 class="content-heading">¿Cómo funciona la ronda?</h1>

    <h2>CLR tutorial</h2>
    <p>
      Esta es una descripción general de cómo funciona todo detrás de escena para
      que puedas aprender qué esperar durante la duración de la ronda.
    </p>
    <p>
      ¿Buscas guías sobre cómo participar? Consulta nuestras guías específicamente
      para contribuir y unirte como proyecto.
    </p>
    <ul>
      <li>
        <links to="/about/how-it-works/contributors"
          >Guía para colaboradores</links
        >
      </li>
      <li>
        <links to="/about/how-it-works/recipients">Guide for recipients</links>
      </li>
    </ul>

    <h2>Resumen rápido sobre el Financiamiento Cuadrático</h2>
    <p>
      Como se describe en nuestra <links to="/about/quadratic-finance">
      Descripción General sobre el Financiamiento Cuadrático </links>, los
      proyectos recibirán financiamiento de contribuciones individuales, así
      como del fondo de contrapartida. Cuando contribuyes a tus proyectos
      favoritos, tu contribución también actúa como un voto. Cuantas más
      contribuciones reciba un proyecto, más votos. Y cuantos más votos obtenga
      un proyecto, más recibirán del grupo correspondiente. Aunque una mayor
      contribución individual equivaldrá a una mayor ponderación de votos,
      es mucho más importante recibir un gran volumen de contribuciones únicas
      que solo unas pocas contribuciones de alto valor.
    </p>
    <p>
      Dado que la ronda de financiación también es un voto público, necesita
      plazos. La ronda se divide en varias fases para que, una vez realizadas
      todas las contribuciones o los votos, puedan contarse y confirmarse antes
      de la distribución final del grupo de contrapartida.
    </p>
    <h2>Fases de la Ronda de Financiamiento</h2>
    <h3>Fase de inscripción phase</h3>
    <p>
      Para comenzar, se invitará a los proyectos a <links to="/join"> unirse
      a la ronda </links>. Si eres un colaborador entusiasta, podrás explorar los
      proyectos y agregarlos a tu carrito, pero todavía no podrás contribuir.
    </p>
    <h4>Necesitas saber</h4>
    <ul>
      <li>
        Habrá un máximo de {{maxRecipients}} proyectos en la ronda.
      </li>
      <li>Los proyectos deben cumplir <links to="/join"> criterios de ronda</links>.</li>
      <li>
        Si deseas contribuir, este es un momento perfecto para obtener <links to="/verify">
        configuración para contribuir </links>.
      </li>
    </ul>
    <h3>Fase de Contribución</h3>
    <p>
      El lanzamiento de la fase de contribución sigue a la fase de unión y marca el inicio
      oficial de la ronda de financiación. Este es el momento para que agregues tus proyectos
      favoritos a su carrito y contribuyas.
    </p>
    <h4>Necesitas saber</h4>
    <ul>
      <li>Esta fase durará {{contributionPhaseDays}} días. </li>
      <li>
        Deberás pasar por algunos <links to ="/verify"> verificación </links> antes de poder contribuir.
      </li>
      <li>
        La cantidad máxima de contribución es {{maxContributionAmount}} {{nativeTokenSymbol}}.
      </li>
      <li>
        El monto total de su contribución es definitivo. No puede aumentarlo contribuyendo con un
        tiempo adicional.
      </li>
    </ul>

    <p>
      Si no contribuye en la fase de contribución, la ronda termina para usted una vez que finaliza esta fase.
    </p>

    <h3>Fase de Reasignación</h3>
    <p>
      Durante esta fase, si has contribuido, tendrás tiempo para cambiar de opinión. Puedes editar los montos
      de tu contribución o agregar / eliminar proyectos, pero tu total debe ser igual al de tu contribución original.

    </p>
    <h4>Need to know</h4>
    <ul>
      <li>
        Esta fase durará {{reallocationPhaseDays}} días después del final de la Fase de Contribución.
      </li>
      <li>
        Si eliminas proyectos, debes reasignar los fondos a otros proyectos o se destinarán al fondo común.
      </li>
      <li>
        No puedes exceder el total de tu contribución original al asignar fondos.
      </li>
    </ul>
    <h3>Fase de Conteo</h3>
    <p>
      En este punto, todas las contribuciones son definitivas y ahora se pueden contabilizar. El coordinador de la ronda
      activa <links to="/about/maci"> MACI </links> y los contratos inteligentes para calcular la cantidad del grupo
      correspondiente que obtendrá cada proyecto.
    </p>
    <h3>Fase Finalizada</h3>
    <p>
      Una vez que se completan los cálculos de recuento, se finaliza la ronda. ¡Los propietarios de proyectos pueden venir
      y reclamar su financiación!
    </p>
    <h2>Más</h2>
    <p>
      Usamos diferentes tecnologías para mantener la ronda justa y libre de actores maliciosos. A continuación, puedes obtener
      más información sobre ellos:
    </p>
    <ul>
      <li>
        <links to="/about/maci">MACI</links> – para protegerse contra el soborno y el conteo de resultados de la Ronda.
      </li>
      <li>
        <links to="/about/sybil-resistance">BrightID</links> – para protegerse contra los ataques de sybil
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { MAX_CONTRIBUTION_AMOUNT } from '@/api/contributions'

import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutHowItWorks extends Vue {
  get contributionPhaseDays(): number | string {
    if (this.$store.state.currentRound) {
      const { signUpDeadline, startTime } = this.$store.state.currentRound
      return Math.ceil((signUpDeadline - startTime) / (24 * 60 * 60 * 1000))
    }
    return 'TBD'
  }

  get maxContributionAmount(): number {
    return MAX_CONTRIBUTION_AMOUNT
  }

  get maxRecipients(): number | string {
    return this.$store.state?.currentRound?.maxRecipients || 'TBD'
  }

  get nativeTokenSymbol(): string {
    return this.$store.state?.currentRound?.nativeTokenSymbol
  }

  get reallocationPhaseDays(): number | string {
    if (this.$store.state.currentRound) {
      const { signUpDeadline, votingDeadline } = this.$store.state.currentRound
      return Math.ceil(
        (votingDeadline - signUpDeadline) / (24 * 60 * 60 * 1000)
      )
    }
    return 'TBD'
  }
}
</script>
