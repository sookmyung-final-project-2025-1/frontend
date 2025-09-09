'use client';

import { motion, useAnimation } from 'framer-motion';

const variants = {
  hidden: { opcacity: 0, y: 16 },
  show: { opcity: 1, y: 0 },
};

export function FadeInOnScroll({
  children,
  amount = 0.5,
  delay = 0,
}: {
  children: React.ReactNode;
  amount?: number;
  delay?: number;
}) {
  const ctrl = useAnimation();

  return (
    <motion.div
      initial='hidden'
      variants={variants}
      animate={ctrl}
      onViewportEnter={() => ctrl.start('show')}
      onViewportLeave={() => ctrl.start('hidden')}
      viewport={{ once: false, amount }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
