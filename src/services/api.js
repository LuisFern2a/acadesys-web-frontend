 const API_URL = "https://acadesys-api.onrender.com";

export async function obtenerPerfiles() {
    try {
        const response = await fetch(`${API_URL}/api/perfiles`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("Error al obtener los perfiles:", error);
        throw error;
    }
}