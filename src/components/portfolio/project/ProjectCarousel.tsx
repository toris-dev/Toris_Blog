'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Carousel from 'react-material-ui-carousel';

interface ImageType {
  url: string;
  alt: string;
  label: string;
}

interface ProjectCarouselProps {
  images: ImageType[];
}

const ProjectCarousel = ({ images }: ProjectCarouselProps) => {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md dark:border-gray-700">
      <Carousel
        height={300}
        className="w-full"
        animation="slide"
        autoPlay={false}
        navButtonsAlwaysVisible
        indicators={true}
        indicatorContainerProps={{
          style: {
            marginTop: '8px'
          }
        }}
      >
        {images.map((image) => (
          <motion.div
            key={image.alt}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Image
              src={image.url}
              alt={image.alt}
              width={600}
              height={300}
              className="h-auto max-h-[300px] w-full object-contain"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
              <p className="text-sm font-medium">{image.label}</p>
            </div>
          </motion.div>
        ))}
      </Carousel>
    </div>
  );
};

export default ProjectCarousel;
