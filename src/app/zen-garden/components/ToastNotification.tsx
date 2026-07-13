import { AnimatePresence, motion } from "framer-motion";

export function ToastNotification({ message }: { message: string | null }) {
  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-zinc-900/90 text-zinc-100 border border-zinc-800 text-xs px-4 py-2 rounded-xl shadow-lg backdrop-blur"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
