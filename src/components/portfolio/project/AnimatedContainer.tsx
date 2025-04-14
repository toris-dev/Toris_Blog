'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedContainer = ({ children, className }: AnimatedContainerProps) => {
  return (
    <motion.div
      className={className}
      initial={{ y: -30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, type: 'spring' }}
    >
      <motion.div
        className="absolute -z-10 size-20 rounded-full bg-blue-100 blur-xl dark:bg-blue-900/30"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 180, 270, 360],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      {children}
    </motion.div>
  );
};

export default AnimatedContainer;
