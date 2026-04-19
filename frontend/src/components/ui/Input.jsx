import { motion } from 'framer-motion';

const Input = ({ label, type, name, placeholder, icon: Icon }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-gray-400" />
                    </div>
                )}
                <motion.input
                    whileFocus={{ scale: 1.01, borderColor: '#6200EA', boxShadow: "0 0 0 2px rgba(98, 0, 234, 0.2)" }}
                    transition={{ duration: 0.2 }}
                    type={type}
                    name={name}
                    className={`block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm`}
                    placeholder={placeholder}
                    required
                />
            </div>
        </div>
    );
};

export default Input;
