// Utilidades compartidas: llamadas a la API v1 con las credenciales del propio cliente.
import { buildActions, reduxStore } from "@luna/core";
import { getCredentials, redux, TidalApi } from "@luna/lib";

export interface V1Track {
	id: number;
	title: string;
	ai?: boolean;
}

async function authHeaders(): Promise<Record<string, string>> {
	const { clientId, token } = await getCredentials();
	return {
		Authorization: `Bearer ${token}`,
		"x-tidal-token": clientId,
	};
}

function queryArgs(): string {
	try {
		const cc = (redux.store.getState() as { session?: { countryCode?: string } })?.session?.countryCode;
		if (cc) return `countryCode=${cc}&deviceType=DESKTOP&locale=en_US`;
	} catch { /* ignore */ }
	return `countryCode=US&deviceType=DESKTOP&locale=en_US`;
}

export async function v1Get<T>(path: string): Promise<T | undefined> {
	const headers = await authHeaders();
	const res = await fetch(`https://desktop.tidal.com${path}${path.includes("?") ? "&" : "?"}${queryArgs()}`, { headers });
	if (!res.ok) return undefined;
	return (await res.json()) as T;
}

/** ¿Este track está marcado como generado por IA? Usa la API v1 con la sesión first-party del cliente. */
export async function isAiTrack(trackId: number | string): Promise<boolean> {
	const track = await v1Get<V1Track>(`/v1/tracks/${trackId}`);
	return track?.ai === true;
}

export interface V1Album {
	id: number;
	title: string;
	type?: string;
}

/** Todos los álbumes/EPs/sencillos de un artista (paginado). */
export async function artistAlbums(artistId: number | string): Promise<V1Album[]> {
	const out: V1Album[] = [];
	let offset = 0;
	const limit = 100;
	while (true) {
		const page = await v1Get<{ items: V1Album[]; totalNumberOfItems: number }>(
			`/v1/artists/${artistId}/albums?limit=${limit}&offset=${offset}`,
		);
		if (!page?.items?.length) break;
		out.push(...page.items);
		if (out.length >= (page.totalNumberOfItems ?? out.length)) break;
		offset += limit;
		if (offset > 2000) break; // seguridad
	}
	return out;
}

/** IDs de tracks de un álbum. */
export async function albumTrackIds(albumId: number | string): Promise<number[]> {
	const items = await TidalApi.albumItems(String(albumId) as never);
	if (!items) return [];
	return items
		.map((it) => (it as { item?: { id?: number } }).item?.id)
		.filter((id): id is number => typeof id === "number");
}

/** Fisher-Yates shuffle. */
export function shuffled<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export function toast(msg: string, isErr = false) {
	try {
		const actions = buildActions as unknown as Record<string, ((p: unknown) => unknown) | undefined>;
		const fn = actions[isErr ? "message/MESSAGE_ERROR" : "message/MESSAGE_INFO"];
		if (fn) reduxStore.dispatch(fn({ message: msg, category: "OTHER", severity: isErr ? "ERROR" : "INFO" }));
	} catch { /* ignore */ }
}

/** ID de la playlist actual si estamos en una página de playlist, si no undefined. */
export function currentPlaylistId(): string | undefined {
	try {
		const router = (redux.store.getState() as { router?: { currentPath?: string; currentParams?: Record<string, string> } })?.router;
		const params = router?.currentParams ?? {};
		if (params.playlistId) return params.playlistId;
		const m = router?.currentPath?.match(/\/playlist\/([a-z0-9-]+)/i);
		return m?.[1];
	} catch { return undefined; }
}

/** ID del artista actual si estamos en una página de artista, si no undefined. */
export function currentArtistId(): string | undefined {
	try {
		const router = (redux.store.getState() as { router?: { currentPath?: string; currentParams?: Record<string, string> } })?.router;
		const params = router?.currentParams ?? {};
		if (params.artistId) return params.artistId;
		const m = router?.currentPath?.match(/\/artist\/(\d+)/);
		return m?.[1];
	} catch { return undefined; }
}
