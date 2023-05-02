import type { DirectiveBinding } from 'vue'

interface Element extends HTMLElement {
  clickOutsideEvent: (event: Event) => void
}

export default {
  beforeMount: function (el: Element, binding: DirectiveBinding) {
    el.clickOutsideEvent = function (event) {
      // Check that the click was outside the el and its children
      if (!(el == event.target || el.contains(event.target as Node))) {
        // Call method provided in attribute value
        binding.value(event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted: function (el: Element) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  },
}
