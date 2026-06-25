import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export function PageTransition() {
  const location = useLocation()

  return (
    <motion.div
      key={location.pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="h-full"
    >
      <Outlet />
    </motion.div>
  )
}
