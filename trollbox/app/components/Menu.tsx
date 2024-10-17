import { NavLink } from '@remix-run/react'
import { MouseEvent, useCallback, useState } from 'react'
import { Menu as DaisyMenu, Dropdown } from 'react-daisyui'
import { Details } from './Select'

export function MobileMenu() {
  const [detailOpen, setDetailOpen] = useState(false)
  const close = useCallback(() => setDetailOpen(false), [])
  const preventDefault = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault(),
    [],
  )

  return (
    <Details
      className="lg:hidden"
      open={detailOpen}
      tabIndex={-1}
      onToggle={(e) => {
        setDetailOpen(e.currentTarget.open)
      }}
      onBlur={() => setDetailOpen(false)}
    >
      <Dropdown.Details.Toggle color="ghost" tabIndex={0} className="lg:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h8m-8 6h16"
          />
        </svg>
      </Dropdown.Details.Toggle>
      <Dropdown.Menu className="w-52 menu-sm mt-3 z-50 lg:hidden">
        <Dropdown.Item anchor={false}>
          <NavLink to="" end onMouseDown={preventDefault} onClick={close}>
            Home
          </NavLink>
        </Dropdown.Item>

        <Dropdown.Item anchor={false}>
          <NavLink to="/search" onMouseDown={preventDefault} onClick={close}>
            Search
          </NavLink>
        </Dropdown.Item>
        <Dropdown.Item anchor={false}>
          <NavLink to="/portfolio" onMouseDown={preventDefault} onClick={close}>
            Portfolio
          </NavLink>
        </Dropdown.Item>
        <Dropdown.Item anchor={false}>
          <NavLink to="/profile" onMouseDown={preventDefault} onClick={close}>
            Profile
          </NavLink>
        </Dropdown.Item>
        <Dropdown.Item anchor={false}>
          <span>Trollbox</span>
        </Dropdown.Item>
        <li>
          <ul className="p-2 z-10">
            <li>
              <NavLink
                to="/terms-of-service"
                onMouseDown={preventDefault}
                onClick={close}
              >
                Terms Of Service
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/privacy-policy"
                onMouseDown={preventDefault}
                onClick={close}
              >
                Privacy Policy
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dmca-notices"
                onMouseDown={preventDefault}
                onClick={close}
              >
                DMCA Notices
              </NavLink>
            </li>
          </ul>
        </li>
      </Dropdown.Menu>
    </Details>
  )
}

export function DesktopMenu() {
  return (
    <DaisyMenu className="hidden lg:flex text-lg">
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
