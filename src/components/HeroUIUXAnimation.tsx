import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  Award, 
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

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Dashboard Container – flat, no 3D */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl p-8 border border-gray-800"
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
                whileHover={{ scale: 1.03 }}
                className="relative"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  {/* Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <motion.div
                      className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
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
                        transition={{ duration: 1.5, delay: index * 0.2, ease: 'easeOut' }}
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
      </motion.div>
    </div>
  );
}