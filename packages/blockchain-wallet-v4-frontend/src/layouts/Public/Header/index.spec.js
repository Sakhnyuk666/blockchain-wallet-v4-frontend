import React from 'react'
import { shallow } from 'enzyme'
import toJson from 'enzyme-to-json'
import Header from './index'

jest.mock('components/Announcements', () => ({
  ServiceAnnouncement: ''
}))
jest.mock('blockchain-info-components', () => ({ Image: '', Link: '' }))

describe('Public Header Component', () => {
  window.APP_VERSION = 'v4.2.0'
  it('should match snapshot', () => {
    const component = shallow(<Header />)
    const tree = toJson(component)
    expect(tree).toMatchSnapshot()
  })
})
