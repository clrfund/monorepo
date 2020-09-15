import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import ProjectListItem from '@/components/ProjectListItem.vue'

describe('ProjectListItem.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = shallowMount(ProjectListItem, {
      propsData: { project: {} },
      mocks: {
        $store: { state: { cart: [] } },
      },
    })
    expect(wrapper.text()).to.include('')
  })
})
