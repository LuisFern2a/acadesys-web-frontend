import { BookOpen, Calendar, CreditCard, User } from 'lucide-react';

export default function StudentIntranetPage({ view }) {
  // Renderizado dinámico según la pestaña seleccionada
  const renderContenido = () => {
    switch (view) {
      case 'student-pagos':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <CreditCard className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Panel de Pagos</h2>
            <p className="text-gray-500 mt-2">Aquí conectarás el componente PanelPagosAlumno.</p>
          </div>
        );
      case 'student-horario':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <Calendar className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Mi Horario</h2>
            <p className="text-gray-500 mt-2">Vista de los cursos matriculados en la semana.</p>
          </div>
        );
      case 'student-cursos':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <BookOpen className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Mis Cursos</h2>
            <p className="text-gray-500 mt-2">Materiales y sílabos del ciclo actual.</p>
          </div>
        );
      default:
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Bienvenido a la Intranet</h2>
            <p className="text-gray-500 mt-2">Selecciona una opción en el menú lateral para comenzar.</p>
          </div>
        );
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Portal del Estudiante</h1>
      {renderContenido()}
    </div>
  );
}