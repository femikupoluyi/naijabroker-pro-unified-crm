
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Zap, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="pt-20 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100 relative z-10"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Complete Insurance Brokerage 
              <span className="text-blue-600"> Management System</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Streamline your insurance operations with our comprehensive CRM, policy management, 
              and compliance tools designed specifically for Nigerian insurance brokers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-3 hover:scale-105 transition-transform">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3 hover:scale-105 transition-transform">
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Free 14-day trial • No credit card required • Setup in minutes
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img 
                src="/lovable-uploads/84cc8568-8d63-4568-8548-1cadae1afa0f.png"
                alt="Nigerian insurance professionals using AI-enabled brokerage management system"
                className="w-full h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent"></div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 animate-bounce"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm font-semibold">300% Efficiency</span>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3 animate-pulse"
            >
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-semibold">A.I Enabled</span>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="absolute top-1/2 -left-6 bg-white rounded-lg shadow-lg p-3 animate-bounce delay-300"
            >
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-semibold">Global Reach</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
