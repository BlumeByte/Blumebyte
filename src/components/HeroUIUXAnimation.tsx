import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Users, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Award, 
  Target, 
  Zap 
} from 'lucide-react';

interface MetricCard {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  performance: number;
}

export function HeroUIUXAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  const metricCards: MetricCard[] = [
    {
      id: 0,
      title: 'Employee Engagement',
      description: 'Real-time engagement metrics',
      icon: Users,
      performance: 85,
    },
    {
      id: 1,
      title: 'Time Efficiency',
      description: 'Automated time tracking',
      icon: Clock,
      performance: 92,
    },
    {
      id: 2,
      title: 'Data Analytics',
      description: 'Advanced HR insights',
      icon: BarChart3,
      performance: 78,
    },
    {
      id: 3,
      title: 'Performance Growth',
      description: 'Track team improvements',
      icon: TrendingUp,
      performance: 88,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setMousePosition({ x: x * 20, y: y * 20 });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1500px',
      }}
    >
      <motion.div 
        className="relative w-full max-w-2xl"
        style={{
          rotateY: mousePosition.x / 2,
          rotateX: -mousePosition.y / 2,
          transformStyle: 'preserve-3d',
        }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 20,
        }}
      >
        {/* Main Dashboard Container */}
        <motion.div
          className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl p-8 border border-gray-800"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        >
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between"
            >
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">HR Dashboard</h3>
                <p className="text-gray-400 text-sm">Real-time performance metrics</p>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </motion.div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {metricCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    zIndex: 10,
                  }}
                  className="relative group"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                    {/* Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <motion.div
                        className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      >
                        Live
                      </motion.div>
                    </div>

                    {/* Title */}
                    <h4 className="text-white font-semibold text-sm mb-1">
                      {card.title}
                    </h4>
                    <p className="text-gray-500 text-xs mb-4">
                      {card.description}
                    </p>

                    {/* Performance Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Performance</span>
                        <span className="text-lg font-bold text-white">{card.performance}%</span>
                      </div>
                      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-white to-gray-300"
                          initial={{ width: 0 }}
                          animate={{ width: `${card.performance}%` }}
                          transition={{
                            duration: 1.5,
                            delay: index * 0.2,
                            ease: 'easeOut',
                          }}
                        />
                        {/* Animated shimmer effect */}
                        <motion.div
                          className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{
                            x: ['-100%', '400%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.3,
                            ease: 'linear',
                          }}
                        />
                      </div>
                      {/* Indicator dots */}
                      <div className="flex gap-1">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                              i < Math.floor(card.performance / 10)
                                ? 'bg-white'
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 pt-6 border-t border-white/10"
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">2.5K</div>
                <div className="text-xs text-gray-500">Total Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">98%</div>
                <div className="text-xs text-gray-500">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-xs text-gray-500">Support</div>
              </div>
            </div>
          </motion.div>

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Floating decorative elements */}
        <motion.div
          className="absolute -top-6 -right-6 w-24 h-24 border border-white/10 rounded-2xl"
          animate={{
            rotate: [0, 90, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateZ(50px)`,
          }}
        />

        <motion.div
          className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
          animate={{
            rotate: [0, -90, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateZ(30px)`,
          }}
        />

        {/* Side floating icons */}
        <motion.div
          className="absolute top-1/4 -left-16 w-16 h-16 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10"
          animate={{
            x: [0, -10, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Award className="w-8 h-8 text-white/60" />
        </motion.div>

        <motion.div
          className="absolute bottom-1/4 -right-16 w-16 h-16 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10"
          animate={{
            x: [0, 10, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Zap className="w-8 h-8 text-white/60" />
        </motion.div>
      </motion.div>
    </div>
  );
}