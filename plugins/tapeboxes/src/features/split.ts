// ✂️ Dividir playlist en dos mitades.
import { buildActions, reduxStore } from "@luna/core";
import { Playlist } from "@luna/lib";

import { toast } from "../api";

export async function splitPlaylist(
	playlistUUID: string,
	onProgress?: (msg: string) => void,
): Promise<{ first: string; second: string; counts: [number, number] }> {
	const say = onProgress ?? (() => {});
	const playlist = await Playlist.fromId(playlistUUID as never);
	if (!playlist) throw new Error("No se pudo cargar la playlist.");
	const title = (await playlist.title()) ?? "Playlist";
	const items = await playlist.tMediaItems();
	const ids = items.map((i) => String(i.item.id));
	if (ids.length < 2) throw new Error("La playlist necesita al menos 2 canciones para dividirse.");

	const mid = Math.ceil(ids.length / 2);
	const firstIds = ids.slice(0, mid);
	const secondIds = ids.slice(mid);

	const actions = buildActions as unknown as Record<string, ((p: unknown) => unknown) | undefined>;
	const create = actions["folders/CREATE_PLAYLIST"];
	if (!create) throw new Error("No se pudo crear playlists (acción no disponible).");
	const dispatch = reduxStore.dispatch as (a: unknown) => unknown;

	const firstTitle = `${title} (1/2)`;
	say(`Creando "${firstTitle}"…`);
	await dispatch(create({ title: firstTitle, description: `Primera mitad de "${title}" — 📼 TapeBoxes`, ids: firstIds }));

	const secondTitle = `${title} (2/2)`;
	say(`Creando "${secondTitle}"…`);
	await dispatch(create({ title: secondTitle, description: `Segunda mitad de "${title}" — 📼 TapeBoxes`, ids: secondIds }));

	toast(`Dividida: "${firstTitle}" (${firstIds.length}) + "${secondTitle}" (${secondIds.length}).`);
	return { first: firstTitle, second: secondTitle, counts: [firstIds.length, secondIds.length] };
}
