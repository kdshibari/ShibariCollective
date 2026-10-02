import { useState } from "react";
import { motion } from "framer-motion";

export function ProgressiveImage({ src, alt, className, imgClassName }: { src: string, alt: string, className?: string, imgClassName?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover ${imgClassName}`}
      />
    </div>
  );
}
