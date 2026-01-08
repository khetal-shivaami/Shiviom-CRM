import React, { useState, useEffect } from 'react';
import useEmblaCarousel, { EmblaCarouselType } from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const images = [
  {
    src: 'https://storage.googleapis.com/shiviom-website-content/crm_images/Gemini_Generated_Image_44eb3444eb3444eb.png',
    alt: 'Partner Onboarding',
    caption: 'Streamline your partner onboarding process with intuitive tools.',
  },
  {
    src: 'https://storage.googleapis.com/shiviom-website-content/crm_images/Gemini_Generated_Image_lx0h65lx0h65lx0h.png',
    alt: 'Customer Management',
    caption: 'Manage customer relationships and data effectively.',
  },
  {
    src: 'https://storage.googleapis.com/shiviom-website-content/crm_images/Gemini_Generated_Image_ecfk33ecfk33ecfk.png',
    alt: 'Product Management',
    caption: 'Keep track of your products and inventory with ease.',
  },
  {
    src: 'https://storage.googleapis.com/shiviom-website-content/crm_images/Gemini_Generated_Image_mi8545mi8545mi85.png',
    alt: 'Task Creation',
    caption: 'Create, assign, and track tasks for your team seamlessly.',
  },
];

export const ImageCarousel: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = (api: EmblaCarouselType) => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect(emblaApi); // Set initial

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="overflow-hidden h-full w-full" ref={emblaRef}>
      <div className="flex h-full">
        {images.map((image, index) => (
          <div className="relative min-w-0 flex-grow-0 flex-shrink-0 w-full h-full" key={index}>
            <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};