// 📀 Catálogo de artista → nueva playlist.
import { buildActions, reduxStore } from "@luna/core";

import { albumTrackIds, artistAlbums, toast } from "../api";

export interface CatalogOptions {
	includeAlbums: boolean;
	includeEps: boolean;
	includeSingles: boolean;
	includeCompilations: boolean;
}

export const defaultCatalogOptions: CatalogOptions = {
	includeAlbums: true,
	includeEps: true,
	includeSingles: true,
	includeCompilations: false,
};

function albumKind(type?: string): "album" | "ep" | "single" | "compilation" | "other" {
	const t = (type ?? "").toUpperCase();
	if (t.includes("COMPILATION")) return "compilation";
	if (t === "EP" || t.includes("EP")) return "ep";
	if (t.includes("SINGLE")) return "single";
	if (t.includes("ALBUM")) return "album";
	return "other";
}

export async function buildArtistPlaylist(
	artistId: string,
	artistName: string,
	opts: CatalogOptions,
	onProgress?: (msg: string) => void,
): Promise<{ playlistTitle: string; tracks: number }> {
	const say = onProgress ?? (() => {});
	say("Buscando lanzamientos del artista…");
	const albums = await artistAlbums(artistId);
	const wanted = albums.filter((a) => {
		const k = albumKind(a.type);
		return (
			(k === "album" && opts.includeAlbums) ||
			(k === "ep" && opts.includeEps) ||
			(k === "single" && opts.includeSingles) ||
			(k === "compilation" && opts.includeCompilations) ||
			(k === "other" && opts.includeAlbums)
		);
	});
	if (!wanted.length) throw new Error("No se encontraron lanzamientos con esos filtros.");

	say(`Leyendo ${wanted.length} lanzamientos…`);
	const trackIds: string[] = [];
	const seen = new Set<string>();
	let n = 0;
	for (const album of wanted) {
		n++;
		if (n % 5 === 0) say(`Leyendo lanzamientos… ${n}/${wanted.length}`);
		const ids = await albumTrackIds(album.id);
		for (const id of ids) {
			const s = String(id);
			if (!seen.has(s)) {
				seen.add(s);
				trackIds.push(s);
			}
		}
		await new Promise((r) => setTimeout(r, 150)); // no saturar la API
	}
	if (!trackIds.length) throw new Error("No se encontraron canciones.");

	const title = `${artistName} (catálogo)`;
	say(`Creando playlist "${title}" con ${trackIds.length} canciones…`);
	const actions = buildActions as unknown as Record<string, ((p: unknown) => unknown) | undefined>;
	const create = actions["folders/CREATE_PLAYLIST"];
	if (!create) throw new Error("No se pudo crear la playlist (acción no disponible).");
	await (reduxStore.dispatch as (a: unknown) => unknown)(
		create({ title, description: `Catálogo de ${artistName} creado con 📼 TapeBoxes`, ids: trackIds }),
	);
	toast(`Playlist "${title}" creada con ${trackIds.length} canciones.`);
	return { playlistTitle: title, tracks: trackIds.length };
}
