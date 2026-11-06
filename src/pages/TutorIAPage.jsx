import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function TutorIAPage() {
  const [mensajes, setMensajes] = useState([
    { id: 1, rol: 'ai', texto: '¡Hola! Soy tu Tutor IA de AcadeSys. ¿En qué te puedo ayudar hoy con tu matrícula o tus cursos?' }
  ]);
  const [input, setInput] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);

  const enviarMensaje = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const nuevoMensaje = { id: Date.now(), rol: 'user', texto: input };
    setMensajes(prev => [...prev, nuevoMensaje]);
    setInput('');
    setEscribiendo(true);

    // Simulación de espera para la respuesta del backend
    setTimeout(() => {
      setMensajes(prev => [...prev, { 
        id: Date.now() + 1, 
        rol: 'ai', 
        texto: 'Esta es una respuesta simulada. Aquí debes conectar el fetch a tu endpoint de IA.' 
      }]);
      setEscribiendo(false);
    }, 1500);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tutor IA</h1>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden max-h-[70vh]">
        {/* Historial de chat */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {mensajes.map((msg) => (
            <div key={msg.id} className={`flex ${msg.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-3 max-w-[80%] ${msg.rol === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.rol === 'user' ? 'bg-blue-600' : 'bg-teal-600'
                }`}>
                  {msg.rol === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </div>
                <div className={`px-4 py-3 rounded-2xl ${
                  msg.rol === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                }`}>
                  {msg.texto}
                </div>
              </div>
            </div>
          ))}
          {escribiendo && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none text-gray-500 text-sm">
                <Bot className="w-4 h-4" /> El tutor está escribiendo...
              </div>
            </div>
          )}
        </div>

        {/* Input de envío */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={enviarMensaje} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta aquí..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || escribiendo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}