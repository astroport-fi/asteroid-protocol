import {
  Link,
  LinkProps,
  Location,
  Navigation,
  useLocation,
  useNavigation,
} from '@remix-run/react'
import clsx from 'clsx'
import { useCallback, useState } from 'react'
import { Button, Navbar as DaisyNavbar, Dropdown, Menu } from 'react-daisyui'
import { Wallet } from './wallet/Wallet'
import logo from '../images/logo/white.svg'

function isActive(navigation: Navigation, location: Location, to: string) {
  if (navigation.state === 'loading') {
    return navigation.location.pathname.includes(to)
  }

  return location.pathname.includes(to)
}

function NavLink(props: LinkProps) {
  const navigation = useNavigation()
  const location = useLocation()
  return (
    <Link
      {...props}
      className={clsx({
        active: isActive(navigation, location, props.to as string),
      })}
    />
  )
}

export default function Navbar() {
  const [detailOpen, setDetailOpen] = useState(false)
  const close = useCallback(() => setDetailOpen(false), [])

  return (
    <DaisyNavbar className="absolute left-0 top-0 p-0 border-b border-b-neutral uppercase">
      <DaisyNavbar.Start className="py-2">
        <Dropdown>
          <Button tag="label" color="ghost" tabIndex={0} className="lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
          </Button>
          <Dropdown.Menu tabIndex={0} className="w-52 menu-sm mt-3 z-10">
            <Dropdown.Item anchor={false}>
              <NavLink to="/app/inscriptions">Inscriptions</NavLink>
            </Dropdown.Item>
            <Dropdown.Item anchor={false}>
              <NavLink to="/app/tokens">Tokens</NavLink>
            </Dropdown.Item>
            <Dropdown.Item anchor={false}>
              <NavLink to="/app/wallet">Portfolio</NavLink>
            </Dropdown.Item>
            <Dropdown.Item anchor={false}>
              <span>Create</span>
            </Dropdown.Item>
            <li>
              <ul className="p-2 z-10">
                {/* <li>
                  <NavLink to="/app/create/collection">Collection</NavLink>
                </li> */}
                <li>
                  <NavLink to="/app/create/inscription">Inscription</NavLink>
                </li>
                <li>
                  <NavLink to="/app/create/token">Token</NavLink>
                </li>
              </ul>
            </li>
          </Dropdown.Menu>
        </Dropdown>
        <Link
          className="btn btn-ghost normal-case text-xl px-8"
          to="/app/inscriptions"
        >
          <img src={logo} alt="Asteroid protocol" />
        </Link>
      </DaisyNavbar.Start>
      <DaisyNavbar.Center className="hidden lg:flex">
        <Menu horizontal className="px-1 flex items-center text-lg">
          <Menu.Item>
            <NavLink to="/app/inscriptions">Inscriptions</NavLink>
          </Menu.Item>
          <Menu.Item>
            <NavLink to="/app/tokens">Tokens</NavLink>
          </Menu.Item>
          <Menu.Item>
            <NavLink to="/app/wallet">Portfolio</NavLink>
          </Menu.Item>
          <Menu.Item>
            <Menu.Details
              label="Create"
              className="z-10"
              open={detailOpen}
              onToggle={(e) => {
                setDetailOpen(e.currentTarget.open)
              }}
              onBlur={() => setDetailOpen(false)}
            >
              {/* <Menu.Item onClick={close}>
                <NavLink to="/app/create/collection" onClick={close}>
                  Collection
                </NavLink>
              </Menu.Item> */}
              <Menu.Item>
                <NavLink
                  to="/app/create/inscription"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={close}
                >
                  Inscription
                </NavLink>
              </Menu.Item>
              <Menu.Item>
                <NavLink
                  to="/app/create/token"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={close}
                >
                  Token
                </NavLink>
              </Menu.Item>
            </Menu.Details>
          </Menu.Item>
        </Menu>
      </DaisyNavbar.Center>
      <DaisyNavbar.End className="pr-4">
        <Wallet />
      </DaisyNavbar.End>
    </DaisyNavbar>
  )
}
