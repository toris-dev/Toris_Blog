'use client';

import {
  SiNextDotJs,
  SiReact,
  SiTypescript,
  FaNodeJs
} from '@/components/icons';
import { cn } from '@/utils/style';
import { motion } from 'framer-motion';

export default function TechStackSection() {
  const techStack = [
    {
      name: 'Next.js',
      icon: SiNextDotJs,
      color: 'bg-primary/20',
      logoColor: 'text-primary'
    },
    {
      name: 'React',
      icon: SiReact,
      color: 'bg-primary/20',
      logoColor: 'text-primary'
    },
    {
      name: 'TypeScript',
      icon: SiTypescript,
      color: 'bg-primary/20',
      logoColor: 'text-primary'
    },
    {
      name: 'Node.js',
      icon: FaNodeJs,
      color: 'bg-primary/20',
      logoColor: 'text-primary'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.42, 0, 0.58, 1] as const // easeOut cubic-bezier
      }
    }
  };

  return (
    <section className="px-4 py-16" aria-labelledby="tech-stack-heading">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          id="tech-stack-heading"
          className="mb-12 text-center text-3xl font-bold text-foreground"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          주요 기술 스택
        </motion.h2>
        <motion.div
          className="grid grid-cols-2 gap-6 md:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {techStack.map((tech) => (
            <motion.div
              key={tech.name}
              className="flex flex-col items-center"
              variants={itemVariants}
              whileHover={{
                scale: 1.1,
                rotateY: 15,
                rotateX: 5,
                transition: { duration: 0.3 }
              }}
              style={{ perspective: 1000 }}
            >
              <motion.div
                className={cn(
                  'shadow-medium mb-4 flex size-20 items-center justify-center rounded-xl',
                  tech.color
                )}
                role="img"
                aria-label={`${tech.name} 기술`}
                whileHover={{
                  rotate: 360,
                  scale: 1.1,
                  transition: { duration: 0.6, ease: 'easeInOut' }
                }}
              >
                <tech.icon
                  className={cn('size-12', tech.logoColor)}
                  aria-hidden="true"
                />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground">
                {tech.name}
              </h3>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
