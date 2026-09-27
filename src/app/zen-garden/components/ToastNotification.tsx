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
            className="bg-emerald-950/90 text-emerald-50 border border-emerald-800/60 text-xs px-4 py-2 rounded-full shadow-[0_12px_30px_-10px_rgba(6,78,59,0.6)] backdrop-blur"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
