export interface Criterion {
  emoji: string
  criterion: string
  description: string
}

const baseCriterion: Criterion[] = [
  {
    emoji: '😺',
    criterion: 'Gratis, Open Source o Bien Público',
    description:
      'El código de tu proyecto debe estar disponible para cualquiera bajo una licencia de código abierto, ser gratis o tener algún bien público.',
  },
  {
    emoji: '👺',
    criterion: 'No scams, Pirámides o Multiniveles',
    description:
      "Obviamente, tu proyecto no debe poner los fondos o información de nadie en riesgo.",
  },
  {
    emoji: '👯‍♀️',
    criterion: 'No clones',
    description:
      "Si copiaste código, debes proveer un valor adicional y único al ecosistema.",
  },
  {
    emoji: '🤓',
    criterion: 'Ser Dueño del Proyecto',
    description:
      'El proyecto debe ser tuyo o debes tener permiso del dueño.',
  },
  {
    emoji: '💻',
    criterion: 'No ICOs o ventas de tokens',
    description:
      'El proyecto no debe estar vendiendo ningún token a inversionistas o usuarios.',
  },
]

/**
 * Add any round-specific criteria here
 */
const ADDITIONAL_CRITERION: Criterion[] = [
  {
    emoji: '💰',
    criterion: 'Basado en Ethereum y con integrantes Hondureños',
    description: 'Queremos que los fondos tengan un impacto en la comunidad local o sus integrantes.',
  }
]

export const criteria: Criterion[] = [...baseCriterion, ...ADDITIONAL_CRITERION]
