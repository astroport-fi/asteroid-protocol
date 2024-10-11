import { Link } from '@remix-run/react'
import { MouseEvent, useCallback, useState } from 'react'
import { Navbar as DaisyNavbar, Dropdown, Menu } from 'react-daisyui'
import { useRootContext } from '~/context/root'
import NavLink from './NavLink'
import { Details } from './form/Select'
import { Wallet } from './wallet/Wallet'
import logo from '../images/logo/white.svg'

export default function Navbar() {
  const [detailOpen, setDetailOpen] = useState(false)
  const close = useCallback(() => setDetailOpen(false), [])
  const preventDefault = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault(),
    [],
  )
  const { launchpadEnabled } = useRootContext()
  const createCollectionLink = launchpadEnabled
    ? '/app/create/collection'
    : '/app/create/collection/mint'

  return (
    <DaisyNavbar className="absolute left-0 top-0 p-0 border-b border-b-neutral uppercase">
      <DaisyNavbar.Start className="py-2">
        <Details
          open={detailOpen}
          tabIndex={-1}
          onToggle={(e) => {
            setDetailOpen(e.currentTarget.open)
          }}
          onBlur={() => setDetailOpen(false)}
        >
          <Dropdown.Details.Toggle
            color="ghost"
            tabIndex={0}
            className="lg:hidden"
          >
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
              <NavLink
                to="/app/inscriptions"
                onMouseDown={preventDefault}
                onClick={close}
              >
                Inscriptions
              </NavLink>
            </Dropdown.Item>
            {launchpadEnabled && (
              <Dropdown.Item anchor={false}>
                <NavLink
                  to="/app/launchpad"
                  onMouseDown={preventDefault}
                  onClick={close}
                >
                  Launchpad
                </NavLink>
              </Dropdown.Item>
            )}
            <Dropdown.Item anchor={false}>
              <NavLink
                to="/app/tokens"
                onMouseDown={preventDefault}
                onClick={close}
              >
                Tokens
              </NavLink>
            </Dropdown.Item>
            <Dropdown.Item anchor={false}>
              <NavLink
                to="/app/wallet"
                onMouseDown={preventDefault}
                onClick={close}
              >
                Portfolio
              </NavLink>
            </Dropdown.Item>
            <Dropdown.Item anchor={false}>
              <NavLink
                to="/app/bridge"
                onMouseDown={preventDefault}
                onClick={close}
              >
                Bridge
              </NavLink>
            </Dropdown.Item>
            <Dropdown.Item anchor={false}>
              <span>Create</span>
            </Dropdown.Item>
            <li>
              <ul className="p-2 z-10">
                <li>
                  <NavLink
                    to="/app/create/inscription"
                    onMouseDown={preventDefault}
                    onClick={close}
                  >
                    Inscription
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={createCollectionLink}
                    onMouseDown={preventDefault}
                    onClick={close}
                  >
                    Collection
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/app/create/token"
                    onMouseDown={preventDefault}
                    onClick={close}
                  >
                    Token
                  </NavLink>
                </li>
              </ul>
            </li>
            <Dropdown.Item anchor={false}>
              <span>Asteroid Protocol</span>
            </Dropdown.Item>
            <li>
              <ul className="p-2 z-10">
                <li>
                  <NavLink
                    to="/app/terms-of-service"
                    onMouseDown={preventDefault}
                    onClick={close}
                  >
                    Terms Of Service
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/app/privacy-policy"
                    onMouseDown={preventDefault}
                    onClick={close}
                  >
                    Privacy Policy
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/app/dmca-notices"
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
          {launchpadEnabled && (
            <Menu.Item>
              <NavLink to="/app/launchpad">Launchpad</NavLink>
            </Menu.Item>
          )}
          <Menu.Item>
            <NavLink to="/app/tokens">Tokens</NavLink>
          </Menu.Item>
          <Menu.Item>
            <NavLink to="/app/wallet">Portfolio</NavLink>
          </Menu.Item>
          <Menu.Item>
            <NavLink to="/app/bridge">Bridge</NavLink>
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
              <Menu.Item>
                <NavLink
                  to="/app/create/inscription"
                  onMouseDown={preventDefault}
                  onClick={close}
                >
                  Inscription
                </NavLink>
              </Menu.Item>
              <Menu.Item>
                <NavLink
                  to={createCollectionLink}
                  onMouseDown={preventDefault}
                  onClick={close}
                >
                  Collection
                </NavLink>
              </Menu.Item>
              <Menu.Item>
                <NavLink
                  to="/app/create/token"
                  onMouseDown={preventDefault}
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
