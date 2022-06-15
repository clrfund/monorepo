# Theme

The light and dark theme of the web application can be toggled using the theme button on the navigation bar.

The selected theme will be persisted to the browser local storage as `@clrfund/vue-app.theme = light|dark`, indicating whether the light or dark theme is selected.

The existing vuex store is used to make the selected theme accessible to all components

## Theme color scheme
The theme specific color scheme is defined as css variables in the following files.  These variables are saved dynamically as the `data-theme` attribute in the `html` element when the theme is toggled.
- [light color scheme](../vue-app/src/styles/_vars-light.scss)
- [dark color scheme](../vue-app/src/styles/_vars-dark.scss)

To customize the website with your own color scheme, simply update the css variables with your own colors.

## Screenshots
- [light theme](theme-light.md)
- [dark theme](theme-dark.md)
