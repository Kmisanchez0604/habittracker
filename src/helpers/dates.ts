// Función para formatear la fecha en español - CORREGIDA
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  
  // Comparar solo año, mes y día (ignorar hora)
  const isToday = date.getDate() === today.getDate() && 
                 date.getMonth() === today.getMonth() && 
                 date.getFullYear() === today.getFullYear();
  
  if (isToday) {
    return 'Hoy';
  } else {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

// Función auxiliar para obtener el inicio de la semana
export const getWeekStartDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDay();
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - day);
  return weekStart.toISOString().split('T')[0];
};