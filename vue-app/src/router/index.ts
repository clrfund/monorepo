import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import ProjectView from '../views/Project.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/about',
    name: 'about',
    component: About,
  },
  {
    path: '/project/:address',
    name: 'project',
    component: ProjectView,
  },
]

const router = new VueRouter({
  base: window.location.pathname,
  routes,
})

export default router
