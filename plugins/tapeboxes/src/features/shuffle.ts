// 🔀 Mezclar la ORIGINAL in-place (sin crear copias), con rollback si algo falla.
import { buildActions, reduxStore } from "@luna/core";
import { Playlist, TidalApi } from "@luna/lib";

import { shuffled, toast } from "../api";

type Dispatch = (action: unknown) => Promise<unknown> | unknown;

function dispatch(type: string, payload: Record<string, unknown>) {
	const actions = buildActions as unknown as Record<string, ((p: unknown) => unknown) | undefined>;
	const fn = actions[type];
	if (!fn) throw new Error(`Acción no disponible: ${type}`);
	return (reduxStore.dispatch as Dispatch)(fn(payload));
}

export interface ShuffleResult {
	total: number;
	rolledBack: boolean;
}

export async function shuffleOriginal(
	playlistUUID: string,
	onProgress?: (msg: string) => void,
): Promise<ShuffleResult> {
	const say = onProgress ?? (() => {});
	const playlist = await Playlist.fromId(playlistUUID as never);
	if (!playlist) throw new Error("No se pudo cargar la playlist.");
	const items = await playlist.tMediaItems();
	const ids = items.map((i) => String(i.item.id));
	if (ids.length < 2) throw new Error("La playlist necesita al menos 2 canciones.");

	say(`Mezclando ${ids.length} canciones…`);

	// Orden mezclado (garantiza que cambie al menos algo)
	let mixed = shuffled(ids.map(String));
	let guard = 0;
	while (mixed.join() === ids.map(String).join() && guard++ < 10) mixed = shuffled(ids.map(String));

	// 1. Vaciar la playlist
	say("Quitando canciones…");
	await dispatch("content/REMOVE_MEDIA_ITEMS_FROM_PLAYLIST", {
		playlistUUID,
		removeIndices: ids.map((_, i) => i),
		currentOrder: "INDEX",
		currentDirection: "ASC",
	});

	// Esperar a que el vaciado se complete (la acción del cliente puede ser asíncrona).
	// Se usa TidalApi directo para evitar cachés.
	for (let wait = 0; wait < 20; wait++) {
		await new Promise((r) => setTimeout(r, 1000));
		try {
			const res = await TidalApi.playlistItems(playlistUUID as never);
			const n = res?.items?.length ?? -1;
			if (n === 0) break;
			if (wait === 19) throw new Error("La playlist no se vació a tiempo (" + n + " restantes).");
		} catch (e) {
			if (wait === 19) throw e;
		}
	}

	// 2. Re-agregar mezcladas
	try {
		say("Re-agregando mezcladas…");
		await dispatch("content/ADD_MEDIA_ITEMS_TO_PLAYLIST", {
			playlistUUID,
			mediaItemIdsToAdd: mixed,
			onDupes: "ADD",
			showNotification: false,
		});
	} catch (e) {
		// ROLLBACK: restaurar el orden original
		say("Algo falló, restaurando orden original…");
		try {
			await dispatch("content/ADD_MEDIA_ITEMS_TO_PLAYLIST", {
				playlistUUID,
				mediaItemIdsToAdd: ids.map(String),
				onDupes: "ADD",
				showNotification: false,
			});
		} catch { /* mejor esfuerzo */ }
		throw e;
	}

	// 3. Verificar conteo (API directa, sin caché)
	const res = await TidalApi.playlistItems(playlistUUID as never);
	const count = res?.items?.length ?? 0;
	if (count !== ids.length) {
		toast(`Aviso: la playlist quedó con ${count}/${ids.length} canciones.`, true);
		return { total: count, rolledBack: false };
	}
	say(`¡Listo! ${count} canciones mezcladas.`);
	return { total: count, rolledBack: false };
}
