<template>
  <div class="about">
    <h1 class="content-heading">Descentralización en Clr.fund</h1>
    <h2>¿Qué es la descentralización?</h2>
    <p>
      Cuando decimos que algo está "descentralizado" en clr.fund y en web3 en general,
      nos referimos a que ninguna persona, empresa u otra entidad es únicamente responsable
      de ejecutarlo o brindarle mantenimiento. En cambio, un sistema descentralizado está dirigido o
      mantenido por un gran grupo de entidades independientes, coordinadas por un conjunto
      de reglas en las que cada uno opta, como los mineros en Ethereum o sus pares en BitTorrent.
    </p>

    <h2>¿Qué piezas de clr.fund están descentralizadas?</h2>
    <p>
      Gran parte de la infraestructura de clr.fund se basa en Ethereum, una blockchain descentralizada:
    </p>
    <ul>
      <li>
        el registro de proyectos calificados para financiamiento (y, potencialmente,
        el mecanismo de curaduría para elegir estos proyectos)
      </li>
      <li>el fondo común de fondos</li>
      <li>
       el registro de sybil-resistant calificados para contribuir a proyectos individuales.
      </li>
      <li>
        the funds from and encrypted information about contributions to
        individual projects
      </li>
      <li>
        los fondos y la información encriptada sobre las contribuciones a proyectos individuales
      </li>
    </ul>
    <p>
      Cada una de estas piezas existe en un contrato inteligente de Ethereum (consulte el código
      <links to="https://github.com/clrfund/monorepo"> aquí </links>), lo que significa que su
      funcionalidad es mantenida por los mineros de Ethereum, un grupo descentralizado.
    </p>
    <h2>¿Por qué está descentralizado clr.fund?</h2>
    <p>
      La descentralización de Ethereum proporciona a clr.fund tres beneficios principales:
    </p>
    <ol>
      <li>
        Proceso transparente: todas las piezas descentralizadas de clr.fund son verificables públicamente.
        Cualquiera puede mirar el código de los contratos inteligentes y observar sus entradas y salidas,
        con muy pocas posibilidades de que algo se oculte o cambie en secreto.
      </li>
      <li>
        Votación segura: debido a las sólidas garantías de seguridad de Ethereum,
        cualquiera que envíe un mensaje puede estar extremadamente seguro de que su
        mensaje será procesado según lo esperado por el sistema. Todavía existen
        peligros de seguridad, por supuesto, como <links to="/about/sybil-resistance">
        ataques de sybil, </links> o <links to="/about/maci"> manipulación de votos
        </links>, pero el tipo de "piratería de votos" que normalmente se teme en la
        votación digital es muy poco probable aquí.
      </li>
      <li>
        Bien público: todo en Ethereum es de código abierto y sin permiso, lo que significa
        que el código de la infraestructura descentralizada de clr.fund actúa como un bien
        público: cualquiera puede implementar su propia versión del sistema para crear su
        propio <links to="/about/quadratic-funding "> sistema de financiación cuadrática
        </links>, con los mismos beneficios descentralizados del original.
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutDecentralization extends Vue {}
</script>
