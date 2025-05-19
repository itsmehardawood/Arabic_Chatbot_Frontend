export default function ChatMessage({ message }) {
  const isSystem = message.role === 'system';
  
  return (
    <div className={`flex ${isSystem ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-3/4 p-4 rounded-lg ${
          isSystem 
            ? 'bg-white border border-gray-200 text-black-800' 
            : 'bg-blue-500 text-white'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}