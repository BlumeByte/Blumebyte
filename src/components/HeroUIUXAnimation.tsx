import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Palette, 
  Layout, 
  Smartphone, 
  Monitor, 
  Layers, 
  Zap,
  User,
  Heart,
  TrendingUp,
  Star
} from 'lucide-react';

interface UICard {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

export function HeroUIUXAnimation() {
  const [activeCard, setActiveCard] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const uiCards: UICard[] = [
    {
      id: 0,
      title: 'Beautiful Design',
      description: 'Stunning UI that users love',
      icon: Palette,
      color: 'from-pink-500 to-rose-500',
      gradient: 'bg-gradient-to-br from-pink-500 to-rose-500',
    },
    {
      id: 1,
      title: 'Responsive Layout',
      description: 'Perfect on every device',
      icon: Layout,
      color: 'from-blue-500 to-cyan-500',
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    },
    {
      id: 2,
      title: 'Mobile First',
      description: 'Optimized for mobile',
      icon: Smartphone,
      color: 'from-purple-500 to-indigo-500',
      gradient: 'bg-gradient-to-br from-purple-500 to-indigo-500',
    },
    {
      id: 3,
      title: 'User Centered',
      description: 'Designed for your team',
      icon: User,
      color: 'from-green-500 to-emerald-500',
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
    },
    {
      id: 4,
      title: 'Intuitive UX',
      description: 'Easy to use, hard to forget',
      icon: Heart,
      color: 'from-red-500 to-pink-500',
      gradient: 'bg-gradient-to-br from-red-500 to-pink-500',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) {
        setActiveCard((prev) => (prev + 1) % uiCards.length);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered, uiCards.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 20;
    const y = (e.clientY - rect.top - rect.height / 2) / 20;
    setMousePosition({ x, y });
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 3D Card Stack Container */}
      <motion.div
        className="relative w-full max-w-2xl"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePosition({ x: 0, y: 0 });
        }}
        style={{
          perspective: '1000px',
        }}
      >
        {/* Floating UI Elements Background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-lg backdrop-blur-sm"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-10 right-10 w-16 h-16 bg-purple-500/20 rounded-full backdrop-blur-sm"
            animate={{
              y: [0, 20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-1/2 right-20 w-24 h-24 bg-pink-500/20 rounded-xl backdrop-blur-sm"
            animate={{
              x: [0, 20, 0],
              rotate: [0, -10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Main 3D Card Stack */}
        <div className="relative h-[400px] flex items-center justify-center">
          {uiCards.map((card, index) => {
            const offset = (index - activeCard + uiCards.length) % uiCards.length;
            const isActive = index === activeCard;
            const Icon = card.icon;

            return (
              <motion.div
                key={card.id}
                className={`absolute w-full max-w-md ${card.gradient} rounded-3xl shadow-2xl cursor-pointer`}
                initial={{
                  rotateY: offset * 15,
                  scale: 1 - offset * 0.1,
                  z: -offset * 100,
                  opacity: offset > 2 ? 0 : 1 - offset * 0.3,
                }}
                animate={{
                  rotateY: offset * 15 + (isActive ? mousePosition.x : 0),
                  rotateX: isActive ? -mousePosition.y : 0,
                  scale: 1 - offset * 0.1,
                  z: -offset * 100,
                  opacity: offset > 2 ? 0 : 1 - offset * 0.3,
                  x: offset * 20,
                }}
                transition={{
                  duration: 0.6,
                  ease: 'easeOut',
                }}
                style={{
                  transformStyle: 'preserve-3d',
                }}
                onClick={() => setActiveCard(index)}
                whileHover={isActive ? { scale: 1.05 } : {}}
              >
                <div className="p-10 h-[350px] flex flex-col justify-between">
                  {/* Icon */}
                  <motion.div
                    className="mb-6"
                    animate={{
                      rotate: isActive ? [0, 360] : 0,
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-3">
                      {card.title}
                    </h3>
                    <p className="text-lg text-white/90">
                      {card.description}
                    </p>
                  </div>

                  {/* Decorative elements */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex gap-2">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-white/50 rounded-full"
                          animate={{
                            scale: isActive ? [1, 1.5, 1] : 1,
                          }}
                          transition={{
                            duration: 1,
                            delay: i * 0.2,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </div>
                    <motion.div
                      className="flex items-center gap-2 text-white/80"
                      animate={{
                        opacity: isActive ? [0.8, 1, 0.8] : 0.8,
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-medium">Premium</span>
                    </motion.div>
                  </div>
                </div>

                {/* Glass morphism overlay */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            );
          })}
        </div>

        {/* Card Navigation Dots */}
        <div className="flex justify-center gap-3 mt-8">
          {uiCards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => setActiveCard(index)}
              className="group relative"
            >
              <motion.div
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeCard
                    ? 'bg-white shadow-lg scale-125'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
              {index === activeCard && (
                <motion.div
                  className="absolute inset-0 bg-white/30 rounded-full"
                  initial={{ scale: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Feature Highlights - Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-0 transform -translate-x-1/2"
            animate={{
              y: [0, -15, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-xl">
              <Monitor className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          <motion.div
            className="absolute bottom-1/4 right-0 transform translate-x-1/2"
            animate={{
              y: [0, 15, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-xl">
              <Layers className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          <motion.div
            className="absolute top-1/2 left-1/4 transform -translate-y-1/2"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}