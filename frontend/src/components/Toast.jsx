import { useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const isError = type === "error";
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-500 z-50 animate-in slide-in-from-bottom-5 fade-in ${
      isError ? "bg-red-50 text-red-700 border border-red-200" : "bg-teal-50 text-teal-800 border border-teal-200"
    }`}>
      {isError ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-teal-500" />}
      <span className="font-medium">{message}</span>
    </div>
  );
};
