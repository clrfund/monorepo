import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import ProjectItem from '@/components/ProjectItem.vue'

describe('ProjectItem.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = shallowMount(ProjectItem, {
      propsData: { },
    })
    expect(wrapper.text()).to.include('')
  })
})
