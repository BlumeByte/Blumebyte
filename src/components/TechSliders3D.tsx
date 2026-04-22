import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Clock, BarChart3, TrendingUp, FileText, Award, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';

interface Slider3DProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  value: number;
  onChange: (value: number) => void;
}

const Slider3D: React.FC<Slider3DProps> = ({ title, description, icon: Icon, color, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const newValue = (x / rect.width) * 100;
      onChange(Math.round(newValue));
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const newValue = (x / rect.width) * 100;
      onChange(Math.round(newValue));
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
        {/* Icon and Title */}
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className={`w-16 h-16 rounded-xl ${color} flex items-center justify-center shadow-md`}
          >
            <Icon className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>

        {/* Slider Track */}
        <div className="relative mb-4">
          <div
            ref={sliderRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            className="relative h-12 bg-gray-100 rounded-xl cursor-pointer overflow-hidden shadow-inner"
          >
            {/* Progress Fill with 3D effect */}
            <motion.div
              className={`absolute top-0 left-0 h-full ${color} rounded-xl`}
              style={{
                width: `${value}%`,
                background: 'linear-gradient(135deg, #1f2937 0%, #000000 100%)',
              }}
            >
            </motion.div>

            {/* Draggable Handle */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-8 h-10 bg-white rounded-lg shadow-md cursor-grab active:cursor-grabbing border-2 border-gray-300"
              style={{ left: `calc(${value}% - 16px)` }}
              onMouseDown={handleMouseDown}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <div className="w-1 h-1 rounded-full bg-gray-400" />
                <div className="w-1 h-1 rounded-full bg-gray-400" />
                <div className="w-1 h-1 rounded-full bg-gray-400" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Value Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Performance</span>
          <motion.span
            key={value}
            initial={{ scale: 1.2, color: '#111111' }}
            animate={{ scale: 1, color: '#111827' }}
            className="text-3xl font-bold"
          >
            {value}%
          </motion.span>
        </div>

        {/* Performance Indicator */}
        <div className="mt-4 flex gap-1">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                i < Math.floor(value / 10)
                  ? color
                  : 'bg-gray-200'
              }`}
              style={{
                transform: i < Math.floor(value / 10) ? 'scaleY(1.2)' : 'scaleY(1)',
              }}
            />
          ))}
        </div>
      </div>

    </motion.div>
  );
};

export function TechSliders3D() {
  const [sliders, setSliders] = useState([
    {
      id: 1,
      title: 'Employee Engagement',
      description: 'Real-time engagement metrics',
      icon: Users,
      color: 'bg-gray-900',
      value: 85,
    },
    {
      id: 2,
      title: 'Time Efficiency',
      description: 'Automated time tracking',
      icon: Clock,
      color: 'bg-black',
      value: 92,
    },
    {
      id: 3,
      title: 'Data Analytics',
      description: 'Advanced HR insights',
      icon: BarChart3,
      color: 'bg-gray-800',
      value: 78,
    },
    {
      id: 4,
      title: 'Performance Growth',
      description: 'Track team improvements',
      icon: TrendingUp,
      color: 'bg-gray-700',
      value: 88,
    },
    {
      id: 5,
      title: 'Compliance Rate',
      description: 'Stay audit-ready',
      icon: FileText,
      color: 'bg-gray-900',
      value: 95,
    },
    {
      id: 6,
      title: 'Goal Achievement',
      description: 'OKRs & targets tracking',
      icon: Target,
      color: 'bg-black',
      value: 82,
    },
    {
      id: 7,
      title: 'Recognition Impact',
      description: 'Employee appreciation',
      icon: Award,
      color: 'bg-gray-800',
      value: 90,
    },
    {
      id: 8,
      title: 'Automation Level',
      description: 'Reduce manual work',
      icon: Zap,
      color: 'bg-gray-700',
      value: 87,
    },
  ]);

  const handleValueChange = (id: number, newValue: number) => {
    setSliders(prev =>
      prev.map(slider =>
        slider.id === id ? { ...slider, value: newValue } : slider
      )
    );
  };

  const navigate = useNavigate();

  return (
    <section className="relative py-24 bg-gray-50 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="inline-block mb-4"
          >
            <div className="px-6 py-2 bg-black rounded-full text-white font-semibold text-sm shadow-lg">
              Interactive HR Metrics
            </div>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Control Your HR Performance
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience real-time HR analytics with our interactive controls. Adjust metrics and see instant insights across all your workforce management areas.
          </p>
        </motion.div>

        {/* Sliders Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sliders.map((slider, index) => (
            <motion.div
              key={slider.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Slider3D
                title={slider.title}
                description={slider.description}
                icon={slider.icon}
                color={slider.color}
                value={slider.value}
                onChange={(newValue) => handleValueChange(slider.id, newValue)}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 mb-6">
            These are just some of the metrics you can track and optimize with Blumebyte
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <button className="px-8 py-4 bg-black text-white font-semibold rounded-xl shadow-lg hover:bg-gray-800 transition-all duration-300" onClick={() => navigate('/features')}>
              Explore All Features →
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}