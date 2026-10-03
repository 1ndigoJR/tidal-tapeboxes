// 📼 TapeBoxes para Tidal — punto de entrada del plugin.
import { Tracer, type LunaUnload } from "@luna/core";

import { mountUI } from "./ui";

export const { trace } = Tracer("[TapeBoxes Tidal]");
export const unloads = new Set<LunaUnload>();

// Montar la interfaz cuando el DOM esté listo
function boot() {
	try {
		mountUI(unloads);
		trace.log("TapeBoxes Tidal cargado 📼");
	} catch (e) {
		trace.log("Error iniciando TapeBoxes:", e);
	}
}

if (document.readyState === "loading") {
	const onReady = () => {
		document.removeEventListener("DOMContentLoaded", onReady);
		boot();
	};
	document.addEventListener("DOMContentLoaded", onReady);
	unloads.add(() => document.removeEventListener("DOMContentLoaded", onReady));
} else {
	boot();
}
