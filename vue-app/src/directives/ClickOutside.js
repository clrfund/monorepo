export default {
  bind: function (el, binding, vnode) {
    el.clickOutsideEvent = function (event) {
      // Check that the click was outside the el and its children
      if (!(el == event.target || el.contains(event.target))) {
        // Call method provided in attribute value
        vnode.context[binding.expression](event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unbind: function (el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  },
}
