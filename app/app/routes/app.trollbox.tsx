import { NavLink, Outlet } from '@remix-run/react'
import { Menu } from 'react-daisyui'

export default function TrollBoxBasePage() {
  return (
    <div className="flex flex-row">
      <Menu className="text-lg">
        <Menu.Item>
          <NavLink to="/app/trollbox" end>
            Home
          </NavLink>
        </Menu.Item>
        <Menu.Item>
          <NavLink to="/app/trollbox/portfolio">Portfolio</NavLink>
        </Menu.Item>
        <Menu.Item>
          <NavLink to="/app/trollbox/profile">Profile</NavLink>
        </Menu.Item>
      </Menu>
      <div className="flex w-full p-10">
        <Outlet />
      </div>
    </div>
  )
}
