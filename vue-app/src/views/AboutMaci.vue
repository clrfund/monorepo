<template>
  <div class="about">
    <h1 class="content-heading">
      Acerca de MACI (Infraestructura Mínima Anticolusión)
    </h1>

    <h2>¿Qué es MACI?</h2>
    <p><b>tl;dr: bribers are ngmi (not going to make it)</b></p>
    <p>
      Clr.fund utiliza MACI, Infraestructura mínima anticolusión, para ayudar a
      prevenir la manipulación de votos como el soborno o la colusión. Para
      entender por qué esto es importante, recapitulemos la financiación
      cuadrática ...
    </p>
    <h2>Financiamiento Cuadrático</h2>
    <p>
      Este es el mecanismo que utiliza clr.fund en nuestras rondas de
      financiación. Cuando contribuyes a un proyecto, no solo les envías dinero,
      sino que les estás votando. Al final, los fondos del fondo común de
      contrapartida se distribuyen a los proyectos en función del número de
      votos al final de la ronda.
    </p>
    <p>
      Lee más en
      <links to="/about/quadratic-funding">Financiación Cuadrática</links>.
    </p>
    <p>
      Este mecanismo es excelente para la financiación democrática, pero
      presenta algunos riesgos. Podría ser rentable para el propietario de un
      proyecto sobornar a los usuarios para que voten por su proyecto, ya que el
      monto de su fondo de contrapartida final podría ser realmente alto. Este
      tipo de fraude pone en riesgo todo el concepto, ya que ya no se trata de
      qué proyectos ofrecen el mayor valor a la mayor cantidad de personas.
    </p>

    <h2>Background</h2>
    <h3>Manipulación de Fondos</h3>
    <p>
      Manipulación de Votos implica cambiar maliciosamente los incentivos de un
      sistema de votación, y se presenta en muchas formas, que incluyen:
    </p>
    <ul>
      <li>
        Soborno: cuando una persona o entidad ofrece pagar a otros para que
        voten por un resultado que de otro modo no obtendrían, p. Ej. pagar a un
        equipo de fútbol para lanzar un partido
      </li>
      <li>
        Coerción: cuando una persona o entidad amenaza con castigar a otros de
        alguna manera si no votan por un resultado en particular, p. chantaje
      </li>
    </ul>
    <p>
      Este tipo de manipulación rompe los sistemas de votación al desviarlos de
      su objetivo previsto. Los sistemas de votación generalmente están
      diseñados para descubrir la preferencia de un grupo entre una serie de
      resultados específicos. Se espera que cada votante elija cómo votar en
      función de los resultados que prefiera y cómo su voto puede afectar el
      resultado.
    </p>
    <p>
      En una elección en la que los resultados son 1) Alice gana y 2) Bob gana,
      si prefiero que Alice gane y creo que mi voto tiene una probabilidad
      suficientemente alta de influir en el resultado para que valga la pena el
      esfuerzo, votaré por Alice. Ahora, digamos que Charlie me ofrece $
      1,000,000 para votar por Bob. Para mí, los posibles resultados de la
      elección ahora cambian a 1) Alice gana y 2) Bob gana y yo obtengo $
      1,000,000. En ese escenario, podría votar por Bob aunque prefiero a Alice,
      y el resultado de la elección ya no reflejará mi preferencia entre Bob y
      Alice, como estaba previsto. Si se soborna a suficientes personas de esta
      manera, la elección será una farsa.
    </p>
    <h3>Vulnerabilidad de los Sistemas de Votación Públicos</h3>
    <p>
      Para manipular los resultados de un votante en particular, el manipulador
      necesita saber las opciones eventuales de ese votante: si Charlie se
      ofrece a pagarme $ 1,000,000 para votar por Bob, necesita saber que en
      realidad votaré por Bob antes de pagarme. De lo contrario, puedo votar por
      Alice, decirle a Charlie que voté por Bob para obtener los $ 1,000,000 y
      el soborno ha fallado.
    </p>
    <p>
      En las elecciones tradicionales, los votos son secretos, lo que dificulta
      la manipulación de los votantes. ¡Pero no hay secretos en los blockchain
      como Ethereum! En la mayoría de los sistemas de votación existentes en
      Ethereum, los votos son públicos, lo que significa que la manipulación es
      una seria amenaza.
    </p>
    <h2>¿Por Qué MACI?</h2>
    <p>
      Ethereum es una parte fundamental de clr.fund y otras soluciones de
      financiación cuadrática como Gitcoin Grants, porque:
    </p>
    <ul>
      <li>
        Ethereum tiene una gran combinación de bajos costos de infraestructura y
        alta seguridad (es decir, difícil de piratear) en comparación con otras
        soluciones de votación electrónica.
      </li>
      <li>
        Ethereum ofrece una interoperabilidad perfecta con un ecosistema grande
        y en crecimiento de comunidades y herramientas que mejoran y se
        benefician de la financiación cuadrática, como DAO y sistemas de
        identidad como BrightID.
      </li>
      <li>Clr.fund fue creado por y para la comunidad Ethereum</li>
    </ul>
    <p>
      Si bien alejarse de la publicidad de Ethereum no es una opción atractiva,
      crear herramientas basadas en Ethereum para resistir la manipulación de
      votos sí lo es, lo que nos lleva a MACI.
    </p>
    <h2>¿Cómo ayuda MACI?</h2>
    <p>
      El soborno solo funciona si el soborno puede confirmar que la persona a la
      que está pagando realmente cumple con las condiciones del soborno. Aquí es
      donde entra en juego MACI. Con MACI, es imposible probar cómo votó, por lo
      que los sobornadores nunca sabrán si hizo lo que le pagaron por hacer.
    </p>
    <h2>MACI - Infraestructura mínima anticolusión</h2>
    <p>
      MACI es un conjunto de contratos inteligentes de Ethereum y scripts
      complementarios que transforma de manera efectiva los sistemas de votación
      públicos en privados, en los que 1) la participación en una votación y la
      tabulación correcta de la votación son verificables públicamente, pero 2)
      la información específica de la votación no es pública, lo que hace que la
      manipulación de la votación mucho mas difícil.
    </p>
    <h3>¿Cómo funciona?</h3>
    <p>
      Cuando contribuyes a un proyecto en Clr.fund, registras una identidad con
      el coordinador de la ronda. Pero en cualquier momento antes del final de
      la ronda, puedes invalidar tu identidad cambiando en secreto la clave
      pública asociada con tu identidad antes de emitir el voto. Luego puedes
      usar un par de claves diferentes para firmar el voto (lo que invalida el
      voto, pero es imposible ver si el voto es inválido).
    </p>
    <p>
      MACI hace todo esto utilizando pruebas de conocimiento cero (Zero
      Knowledge Proofs). Estos prueban matemáticamente la autenticidad de los
      votos sin proporcionar ninguno de los detalles. Entonces, los sobornadores
      no pueden saber qué acciones tomaron las personas a las que sobornaron.
    </p>
    <p>
      De
      <links
        to="https://github.com/appliedzkp/maci/blob/master/specs/01_introduction.md"
        >Introducción a la documentación de MACI</links
      >:
    </p>
    <blockquote>
      <p>
        Los votantes de la lista blanca llamados Alice, Bob y Charlie se
        registran para votar enviando su clave pública a un contrato
        inteligente. Además, hay un coordinador central, Dave, cuya clave
        pública es conocida por todos.
      </p>
      <p>
        Cuando Alice emite su voto, firma su voto con su clave privada, cifra su
        firma con la clave pública de Dave y envía el resultado al contrato
        inteligente.
      </p>

      <p>
        Cada votante puede cambiar su par de claves en cualquier momento. Para
        hacer esto, crea y firma un comando de cambio de clave, lo encripta y lo
        envía al contrato inteligente. Esto hace que sea imposible para un
        sobornador estar seguro de que su soborno tiene algún efecto sobre el
        voto del sobornado.
      </p>

      <p>
        Si Bob, por ejemplo, soborna a Alice para que vote de cierta forma, ella
        puede simplemente usar la primera clave pública que haya registrado ⁠
        —que ahora es nula ⁠— para emitir un voto. Dado que dicho voto está
        encriptado, al igual que el mensaje de cambio de clave que Alice le
        había enviado previamente a Dave, Bob no tiene forma de saber si Alice
        efectivamente votó de la manera que él quería.
      </p>

      <p>
        Incluso si Alice revela el texto claro de su voto a Bob, solo necesita
        no mostrarle el comando de teclado actualizado que usó anteriormente
        para invalidar esa clave. En resumen, siempre que haya enviado un solo
        comando encriptado antes de su voto, no hay forma de saber si dicho voto
        es válido o no.
      </p>
    </blockquote>

    <p>
      <links to="https://github.com/appliedzkp/maci/tree/master/specs"
        >Lea más sobre los detalles técnicos de MACI aquí</links
      >. >
    </p>

    <h3>Limitaciones de MACI</h3>
    <p>
      Esta es una tecnología de vanguardia y viene con algunas limitaciones en
      este momento.
    </p>
    <ul>
      <li>
        Hay límites en la cantidad de proyectos, contribuyentes y
        contribuciones. Esto significa que puede perderse si una ronda alcanza
        su capacidad, pero sepa que es por la integridad de la ronda.
      </li>
      <li>
        Solo puedes contribuir una vez por ronda. Una vez que haya contribuido,
        puede agregar / eliminar proyectos y reasignar sus fondos, pero no puede
        aumentar el monto total de su contribución.
      </li>
    </ul>
    <h2>Más</h2>
    <h3>Otras lecturas</h3>
    <ul>
      <li>
        <links
          to="https://ethresear.ch/t/minimal-anti-collusion-infrastructure/541"
          >Vitalik Buterin on Minimal anti-collusion infrastructure</links
        >
      </li>
      <li>
        <links to="https://github.com/appliedzkp/maci">El repo de MACI </links>
      </li>
      <li>
        <links
          to="https://github.com/appliedzkp/maci/blob/master/specs/01_introduction.md"
          >La especificación técnica</links
        >
      </li>
    </ul>
    <h3>Videos</h3>
    <ul>
      <li>
        <links to="https://www.youtube.com/watch?v=ooxgPzdaZ_s"
          >MACI high-level intro</links
        >
      </li>
      <li>
        <links to="https://www.youtube.com/watch?v=sKuNj_IQVYI"
          >MACI introducción técnica</links
        >
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutMaci extends Vue {}
</script>
