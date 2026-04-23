import { motion } from 'framer-motion';

export default function ECGLine({ color = '#00d4ff', height = 40, speed = 2 }) {
  const points = '0,50 10,50 15,50 20,30 25,70 30,10 35,90 40,50 45,50 55,50 60,50 65,30 70,70 75,10 80,90 85,50 90,50 100,50';

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}
    >
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.6 }}
        animate={{ pathLength: 1, opacity: [0.4, 0.8, 0.4] }}
        transition={{
          pathLength: { duration: speed, ease: 'easeInOut', repeat: Infinity },
          opacity: { duration: speed * 1.5, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          filter: `drop-shadow(0 0 6px ${color})`,
        }}
      />
    </svg>
  );
}
