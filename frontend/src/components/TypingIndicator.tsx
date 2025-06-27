
export const TypingIndicator = () => {
  return (
    <div className="flex gap-4 mb-6">
      {/* Assistant Avatar */}
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <div className="w-4 h-4 rounded-full bg-gray-400"></div>
      </div>

      {/* Typing Animation */}
      <div className="bg-gray-100 rounded-lg rounded-bl-sm p-4">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};
