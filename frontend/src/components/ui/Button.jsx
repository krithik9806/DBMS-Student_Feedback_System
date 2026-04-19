import { motion } from 'framer-motion';

const Button = ({ children, variant = 'primary', onClick, type = 'button', icon: Icon, className = '' }) => {
    const baseStyles = "w-full flex justify-center items-center py-2.5 px-4 border rounded-xl shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";

    const variants = {
        primary: "border-transparent text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500 shadow-purple-500/30",
        outline: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-purple-500",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type={type}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={onClick}
        >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {children}
        </motion.button>
    );
};

export default Button;
