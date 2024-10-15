import { NavLink } from '@remix-run/react'
import { Menu as DaisyMenu } from 'react-daisyui'

export default function Menu() {
  // @todo mobile menu
  return (
    <DaisyMenu className="text-lg">
      <DaisyMenu.Item>
        <NavLink to="" end>
          Home
        </NavLink>
      </DaisyMenu.Item>
      <DaisyMenu.Item>
        <NavLink to="/search">Search</NavLink>
      </DaisyMenu.Item>
      <DaisyMenu.Item>
        <NavLink to="/portfolio">Portfolio</NavLink>
      </DaisyMenu.Item>
      <DaisyMenu.Item>
        <NavLink to="/profile">Profile</NavLink>
      </DaisyMenu.Item>
    </DaisyMenu>
  )
}
