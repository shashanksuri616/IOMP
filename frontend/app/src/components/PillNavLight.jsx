import PillNav from './PillNav'

// Light-themed variant of PillNav with inverted colors suitable for light backgrounds.
export default function PillNavLight(props) {
  return (
    <PillNav
      baseColor="#ffffff"           /* nav base background */
      pillColor="#ffffff"           /* pill background */
      hoveredPillTextColor="#1e293b"/* slate-800 */
      pillTextColor="#0f172a"       /* slate-900 */
      {...props}
    />
  )
}
