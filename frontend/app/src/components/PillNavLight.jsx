import PillNav from './PillNav'

// Light-themed variant of PillNav with inverted colors suitable for light backgrounds.
export default function PillNavLight(props) {
  return (
    <PillNav
      baseColor="#ffffff"           /* nav base background */
      pillColor="#1e293b"           /* dark grey pills for white text */
      hoveredPillTextColor="#ffffff"/* white hovered text on light theme */
      pillTextColor="#ffffff"       /* white text on light theme */
      {...props}
    />
  )
}
