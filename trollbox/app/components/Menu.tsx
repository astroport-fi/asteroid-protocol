import { NavLink } from '@remix-run/react'
import { MouseEvent, useCallback, useState } from 'react'
import { Menu as DaisyMenu, Dropdown } from 'react-daisyui'
import { Details } from './Select'
import FAQIcon from './icons/Faq'
import HomeIcon from './icons/Home'
import LegalIcon from './icons/Legal'
import PortfolioIcon from './icons/Portfolio'
import ProfileIcon from './icons/Profile'
import SearchIcon from './icons/Search'
import TrollIcon from './icons/Troll'
import home from '~/images/icons/home.svg'

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
      <Dropdown.Menu className="w-52 menu-sm mt-3 z-50 lg:hidden font-heading">
        <Dropdown.Item anchor={false}>
          <NavLink to="" end onMouseDown={preventDefault} onClick={close}>
            <HomeIcon /> Home
          </NavLink>
        </Dropdown.Item>

        <Dropdown.Item anchor={false}>
          <NavLink to="/search" onMouseDown={preventDefault} onClick={close}>
            <SearchIcon />
            Search
          </NavLink>
        </Dropdown.Item>
        <Dropdown.Item anchor={false}>
          <NavLink to="/portfolio" onMouseDown={preventDefault} onClick={close}>
            <PortfolioIcon />
            Portfolio
          </NavLink>
        </Dropdown.Item>
        <Dropdown.Item anchor={false}>
          <NavLink to="/profile" onMouseDown={preventDefault} onClick={close}>
            <ProfileIcon />
            <span className="flex">
              <span>Prof</span>
              <span>ile</span>
            </span>
          </NavLink>
        </Dropdown.Item>
        <Dropdown.Item anchor={false}>
          <NavLink to="/faq" onMouseDown={preventDefault} onClick={close}>
            <FAQIcon />
            FAQ
          </NavLink>
        </Dropdown.Item>
        <Dropdown.Item anchor={false}>
          <span>
            <LegalIcon />
            Legal
          </span>
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
  const [detailOpen, setDetailOpen] = useState(false)
  const close = useCallback(() => setDetailOpen(false), [])
  const preventDefault = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault(),
    [],
  )
  return (
    <DaisyMenu className="hidden lg:flex text-xl font-heading">
      <DaisyMenu.Item>
        <NavLink to="" end>
          <HomeIcon /> Home
        </NavLink>
      </DaisyMenu.Item>
      <DaisyMenu.Item>
        <NavLink to="/search">
          <SearchIcon />
          Search
        </NavLink>
      </DaisyMenu.Item>
      <DaisyMenu.Item>
        <NavLink to="/portfolio">
          <PortfolioIcon />
          Portfolio
        </NavLink>
      </DaisyMenu.Item>
      <DaisyMenu.Item>
        <NavLink to="/profile">
          <ProfileIcon />
          <span className="flex">
            <span>Prof</span>
            <span>ile</span>
          </span>
        </NavLink>
      </DaisyMenu.Item>
      <DaisyMenu.Item>
        <NavLink to="/faq">
          <FAQIcon />
          FAQ
        </NavLink>
      </DaisyMenu.Item>
      <DaisyMenu.Item>
        <DaisyMenu.Details
          label={
            <>
              <LegalIcon />
              <span>Legal</span>
            </>
          }
          className="z-10"
          open={detailOpen}
          onToggle={(e) => {
            setDetailOpen(e.currentTarget.open)
          }}
          onBlur={() => setDetailOpen(false)}
        >
          <DaisyMenu.Item>
            <NavLink
              to="/terms-of-service"
              onMouseDown={preventDefault}
              onClick={close}
            >
              Terms Of Service
            </NavLink>
          </DaisyMenu.Item>
          <DaisyMenu.Item>
            <NavLink
              to="/privacy-policy"
              onMouseDown={preventDefault}
              onClick={close}
            >
              Privacy Policy
            </NavLink>
          </DaisyMenu.Item>
          <DaisyMenu.Item>
            <NavLink
              to="/dmca-notices"
              onMouseDown={preventDefault}
              onClick={close}
            >
              DMCA Notices
            </NavLink>
          </DaisyMenu.Item>
        </DaisyMenu.Details>
      </DaisyMenu.Item>
    </DaisyMenu>
  )
}
