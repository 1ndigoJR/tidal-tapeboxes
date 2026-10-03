// 🧹 Quitar canciones marcadas como IA de la playlist (in-place, con confirmación).
import { buildActions, reduxStore } from "@luna/core";
import { Playlist } from "@luna/lib";

import { isAiTrack, toast } from "../api";

export interface AiScanResult {
	aiIds: string[];
	aiTitles: string[];
	total: number;
}

function dispatch(type: string, payload: Record<string, unknown>) {
	const actions = buildActions as unknown as Record<string, ((p: unknown) => unknown) | undefined>;
	const fn = actions[type];
	if (!fn) throw new Error(`Acción no disponible: ${type}`);
	return (reduxStore.dispatch as (a: unknown) => Promise<unknown> | unknown)(fn(payload));
}

/** Escanea la playlist y devuelve las canciones marcadas como IA (sin borrar nada). */
export async function scanAiTracks(
	playlistUUID: string,
	onProgress?: (msg: string, done: number, total: number) => void,
): Promise<AiScanResult> {
	const say = onProgress ?? (() => {});
	const playlist = await Playlist.fromId(playlistUUID as never);
	if (!playlist) throw new Error("No se pudo cargar la playlist.");
	const items = await playlist.tMediaItems();
	const total = items.length;
	if (!total) throw new Error("La playlist está vacía.");

	const aiIds: string[] = [];
	const aiTitles: string[] = [];
	const CONCURRENCY = 8;
	let done = 0;
	for (let i = 0; i < items.length; i += CONCURRENCY) {
		const batch = items.slice(i, i + CONCURRENCY);
		const results = await Promise.all(batch.map((it) => isAiTrack(it.item.id).catch(() => false)));
		results.forEach((isAi: boolean, j: number) => {
			if (isAi) {
				aiIds.push(String(batch[j].item.id));
				aiTitles.push(batch[j].item.title ?? String(batch[j].item.id));
			}
		});
		done += batch.length;
		say(`Revisando… ${done}/${total}`, done, total);
		await new Promise((r) => setTimeout(r, 120));
	}
	return { aiIds, aiTitles, total };
}

/** Quita las canciones IA de la playlist (los índices se calculan del escaneo). */
export async function removeAiTracks(
	playlistUUID: string,
	aiIds: string[],
	onProgress?: (msg: string) => void,
): Promise<number> {
	const say = onProgress ?? (() => {});
	if (!aiIds.length) return 0;
	const playlist = await Playlist.fromId(playlistUUID as never);
	if (!playlist) throw new Error("No se pudo cargar la playlist.");
	const items = await playlist.tMediaItems();
	const idToIndex = new Map(items.map((it, idx) => [String(it.item.id), idx]));
	const indices = aiIds.map((id) => idToIndex.get(id)).filter((x): x is number => x !== undefined);
	if (!indices.length) throw new Error("Las canciones ya no están en la playlist.");

	say(`Quitando ${indices.length} canciones IA…`);
	await dispatch("content/REMOVE_MEDIA_ITEMS_FROM_PLAYLIST", {
		playlistUUID,
		removeIndices: indices.sort((a, b) => b - a), // de atrás hacia adelante
		currentOrder: "INDEX",
		currentDirection: "ASC",
	});
	toast(`Se quitaron ${indices.length} canciones marcadas como IA.`);
	return indices.length;
}
