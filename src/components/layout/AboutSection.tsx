import { CloudIcon, SparklesIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

export default function AboutSection() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 z-10">
      {/* Animated background shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute animate-pulse bg-pink-300 opacity-40 rounded-full w-72 h-72 -top-16 -left-16 blur-2xl" />
        <div className="absolute animate-spin-slow bg-purple-300 opacity-30 rounded-full w-96 h-96 -bottom-24 -right-24 blur-3xl" />
        <div className="absolute animate-bounce bg-pink-400 opacity-20 rounded-full w-40 h-40 top-1/2 left-1/2 blur-xl" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6">
        <CloudIcon className="w-20 h-20 text-purple-500 drop-shadow-lg animate-float" />
        <h1 className="text-4xl font-extrabold text-purple-700 mb-2 text-center">File Cloud</h1>
        <p className="text-lg text-gray-700 text-center max-w-md">Your cloud storage, reimagined. Secure, fast, and beautiful. Store, share, and access your files anywhere with a modern, interactive experience.</p>
        <div className="flex gap-4 mt-4">
          <SparklesIcon className="w-10 h-10 text-pink-400 animate-wiggle" />
          <ShieldCheckIcon className="w-10 h-10 text-purple-600 animate-float animate-wiggle" />
        </div>
      </div>
    </div>
  );
}

// Animations (add to globals.css or tailwind.config.js):
// .animate-float { animation: float 3s ease-in-out infinite; }
// .animate-spin-slow { animation: spin 10s linear infinite; }
// .animate-wiggle { animation: wiggle 1.5s infinite; }
// @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
// @keyframes wiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } } 