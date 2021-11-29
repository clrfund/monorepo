<template>
  <div class="about">
    <h1 class="content-heading">About Sybil Resistance</h1>

    <h2>¿Qué son los Sybil attacks?</h2>
    <p>
      A "sybil attack" es cuando una persona finge ser muchas personas con e
      l fin de subvertir las reglas de un sistema. Cuanto más depende un sistema
      de que cada participante sea una sola persona, más vulnerable es a los sybil attack. 
      Las redes sociales son algo vulnerables: los bots que crean correos electrónicos 
      no deseados y seguidores o "likes" falsos son ejemplos de ybil attack relativamente 
      ineficaces. Los sistemas de votación digital son más vulnerables: si un atacante 
      puede crear suficientes usuarios falsos para emitir un voto, puede haber consecuencias
      significativas y concretas. Dado que clr.fund utiliza
      <links to="/about/quadratic-funding">quadratic funding</links>, que es esencialmente
      un sistema de votación, los sybil attack son una seria amenaza.
    </p>
    <p>
      En el mundo físico, los sybil attack son difíciles de realizar. Es bastante difícil
      pretender ser otra persona durante mucho tiempo, especialmente cuando la mayoría de
      los gobiernos emiten y verifican identificaciones con foto y números de identificación.
      En Internet, sin embargo, nadie sabe que eres un perro. La gente no quiere compartir su
      información personal en línea y las identificaciones gubernamentales no son prácticas
      para los servicios web sin fronteras, por lo que, históricamente, no hemos tenido 
      métodos sólidos para detener los sybil attack en línea.
    </p>

    <h2>Sybil Resistance and BrightID</h2>
    <p>
      BrightID es una plataforma que utilizamos para aumentar nuestra confianza en que solo
      está contribuyendo una vez. BrightID es una de una nueva clase de soluciones de identidad
      digital para casos de uso como clr.fund que requieren resistencia digital sybil.
    </p>
    <p>
      BrightID funciona utilizando un modelo de red de confianza: los usuarios conectan sus 
      cuentas de BrightID con personas en las que confían como seres humanos únicos (generalmente
      porque los conocen personalmente) y forman grupos. Estas conexiones son públicas, pero los 
      datos personales de los usuarios no lo son. Si conecta su BrightID a una aplicación, la 
      aplicación puede analizar sus conexiones y decidir si le permite o no el acceso en función 
      de la probabilidad de que sea una persona única. El gráfico de conexiones BrightID se puede 
      analizar con cualquier método, pero en general, cuantas más conexiones tenga una ID con otras
      ID de aspecto confiable, más confiable será.
    </p>
    <p>
      Para contribuir a proyectos en una ronda de clr.fund, debe conectar un BrightID verificado con 
      la aplicación clr.fund. Esto le impide crear miles de cuentas de Ethereum y distorsionar las contribuciones.
    </p>
    <p>
      <links to="/verify">Get verified by following the directions here</links>.
    </p>

    <h2>Cómo configurar BrightID</h2>
    <p>
      La aplicación lo guía a través de<links to="/verify">getting set up</links>, pero 
      aquí hay un vistazo rápido a lo que puede esperar:
    </p>
    <ol>
      <li>
        Descarga BrightID para
        <links to="https://apps.apple.com/us/app/brightid/id1428946820"
          >iOS</links
        >
        o
        <links to="https://play.google.com/store/apps/details?id=org.brightid"
          >Android</links
        >
      </li>
      <li>
        Vincula tu billetera a tu perfil de BrightID, de modo que no puedas
        usar varias direcciones de Ethereum para influir en la votación.
      </li>
      <li>Obtén la verificación en BrightID para que sepamos que es un
      humano y no un bot.</li>
      <li>
        Envía una transacción para que clr.fund lo patrocine en BrightID
        <links
          to="https://medium.com/brightid/brightid-sponsorships-5327a8d39f1e"
          >More on BrightID sponsorship</links
        >
      </li>
      <li>
        Agrégate al registro de usuarios de clr.fund. Este es un requisito para
        <links to="/about/maci">MACI, nuestra tecnología anti-soborno</links>.
      </li>
    </ol>
    <p>
      Ten en cuenta que solo debe vincular una dirección de Ethereum a tu perfil
      de BrightID. Si repites nuestro proceso de verificación y agregas otra dirección
      de Ethereum, todas las contribuciones de tu dirección anterior serán ignoradas
      por el grupo correspondiente. De nuevo, esto es para evitar sybil attacks.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutSybilResistance extends Vue {}
</script>
