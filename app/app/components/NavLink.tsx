import {
  Link,
  LinkProps,
  Location,
  Navigation,
  useLocation,
  useNavigation,
} from '@remix-run/react'
import clsx from 'clsx'

function isActive(navigation: Navigation, location: Location, to: string) {
  if (navigation.state === 'loading') {
    return navigation.location.pathname.includes(to)
  }

  return location.pathname.includes(to)
}

export default function NavLink(props: LinkProps) {
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
