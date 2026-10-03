// Interfaz: botón flotante 📼 + panel con las 4 herramientas.
import type { LunaUnloads } from "@luna/core";
import { redux, StyleTag } from "@luna/lib";

import { currentArtistId, currentPlaylistId, toast } from "./api";
import { buildArtistPlaylist, defaultCatalogOptions } from "./features/catalog";
import { removeAiTracks, scanAiTracks } from "./features/cleanAI";
import { shuffleOriginal } from "./features/shuffle";
import { splitPlaylist } from "./features/split";

const PANEL_ID = "tapeboxes-panel";

function el(tag: string, cls: string, text?: string): HTMLElement {
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (text !== undefined) e.textContent = text;
	return e;
}

function artistNameFromStore(): string {
	try {
		const state = redux.store.getState() as {
			content?: { artists?: Record<string, { name?: string }> };
			router?: { currentParams?: Record<string, string> };
		};
		const id = state.router?.currentParams?.artistId;
		return state.content?.artists?.[id ?? ""]?.name ?? "Artista";
	} catch { return "Artista"; }
}

function playlistTitleFromStore(): string {
	try {
		const state = redux.store.getState() as {
			content?: { playlists?: Record<string, { title?: string }> };
			router?: { currentParams?: Record<string, string> };
		};
		const id = state.router?.currentParams?.playlistId;
		return state.content?.playlists?.[id ?? ""]?.title ?? "Playlist";
	} catch { return "Playlist"; }
}

function setStatus(panel: HTMLElement, msg: string) {
	const s = panel.querySelector<HTMLElement>("[data-tb-status]");
	if (s) s.textContent = msg;
}

async function withConfirm(message: string): Promise<boolean> {
	return window.confirm(message);
}

function buildPanel(): HTMLElement {
	const panel = el("div", "");
	panel.id = PANEL_ID;
	panel.style.cssText = [
		"position:fixed", "right:84px", "bottom:24px", "z-index:99999",
		"width:340px", "max-height:70vh", "overflow:auto",
		"background:#0b0b10", "color:#fff", "border:1px solid #333",
		"border-radius:12px", "padding:16px", "display:none",
		"box-shadow:0 8px 32px rgba(0,0,0,.6)",
		"font-family:inherit",
	].join(";");

	const title = el("h3", "", "📼 TapeBoxes Tidal");
	title.style.cssText = "margin:0 0 12px;font-size:16px";
	panel.appendChild(title);

	const mkBtn = (label: string, fn: (p: HTMLElement) => Promise<void>) => {
		const b = el("button", "", label) as HTMLButtonElement;
		b.style.cssText = [
			"display:block", "width:100%", "margin:6px 0", "padding:10px",
			"background:#1d1d26", "color:#fff", "border:1px solid #444",
			"border-radius:8px", "cursor:pointer", "font-size:14px", "text-align:left",
		].join(";");
		b.onclick = async () => {
			b.disabled = true;
			try { await fn(panel); }
			catch (e) { setStatus(panel, "Error: " + (e as Error).message); toast("Error: " + (e as Error).message, true); }
			finally { b.disabled = false; }
		};
		panel.appendChild(b);
	};

	mkBtn("📀 Catálogo del artista → playlist", async (p) => {
		const artistId = currentArtistId();
		if (!artistId) { setStatus(p, "Abre el perfil de un artista primero."); return; }
		const name = artistNameFromStore();
		if (!await withConfirm(`Crear playlist con el catálogo de "${name}"?`)) return;
		const res = await buildArtistPlaylist(artistId, name, defaultCatalogOptions, (m) => setStatus(p, m));
		setStatus(p, `✅ "${res.playlistTitle}" creada con ${res.tracks} canciones.`);
	});

	mkBtn("🔀 Mezclar ESTA playlist (original)", async (p) => {
		const plId = currentPlaylistId();
		if (!plId) { setStatus(p, "Abre una playlist primero."); return; }
		const title = playlistTitleFromStore();
		if (!await withConfirm(`¿Mezclar "${title}"? Se reordenará la ORIGINAL (no se crea copia).`)) return;
		const res = await shuffleOriginal(plId, (m) => setStatus(p, m));
		setStatus(p, `✅ "${title}" mezclada: ${res.total} canciones.`);
	});

	mkBtn("✂️ Dividir ESTA playlist en dos", async (p) => {
		const plId = currentPlaylistId();
		if (!plId) { setStatus(p, "Abre una playlist primero."); return; }
		const title = playlistTitleFromStore();
		if (!await withConfirm(`¿Dividir "${title}" en dos playlists nuevas?`)) return;
		const res = await splitPlaylist(plId, (m) => setStatus(p, m));
		setStatus(p, `✅ Creadas "${res.first}" y "${res.second}".`);
	});

	mkBtn("🧹 Quitar canciones IA de ESTA playlist", async (p) => {
		const plId = currentPlaylistId();
		if (!plId) { setStatus(p, "Abre una playlist primero."); return; }
		setStatus(p, "Escaneando canciones (puede tardar)…");
		const scan = await scanAiTracks(plId, (m) => setStatus(p, m));
		if (!scan.aiIds.length) { setStatus(p, `✅ Sin canciones IA en ${scan.total} revisadas.`); return; }
		const list = scan.aiTitles.slice(0, 10).join("\n• ");
		const more = scan.aiTitles.length > 10 ? `\n…y ${scan.aiTitles.length - 10} más` : "";
		if (!await withConfirm(`Encontradas ${scan.aiIds.length} canciones IA:\n• ${list}${more}\n\n¿Quitarlas de la playlist?`)) {
			setStatus(p, "Cancelado, no se quitó nada.");
			return;
		}
		const n = await removeAiTracks(plId, scan.aiIds, (m) => setStatus(p, m));
		setStatus(p, `✅ Se quitaron ${n} canciones IA.`);
	});

	const status = el("div", "", "Abre un artista o una playlist para usar las herramientas.");
	status.setAttribute("data-tb-status", "1");
	status.style.cssText = "margin-top:10px;font-size:12px;color:#aaa;white-space:pre-wrap";
	panel.appendChild(status);

	const close = el("button", "", "Cerrar") as HTMLButtonElement;
	close.style.cssText = "margin-top:8px;padding:6px 12px;background:#222;color:#fff;border:1px solid #444;border-radius:6px;cursor:pointer";
	close.onclick = () => { panel.style.display = "none"; };
	panel.appendChild(close);
	return panel;
}

export function mountUI(unloads: LunaUnloads) {
	// Estilos base
	new StyleTag("tapeboxes", unloads, `#${PANEL_ID} button:hover{filter:brightness(1.3)}`);

	// Botón flotante
	const fab = el("button", "", "📼") as HTMLButtonElement;
	fab.title = "TapeBoxes Tidal";
	fab.style.cssText = [
		"position:fixed", "right:24px", "bottom:24px", "z-index:99999",
		"width:52px", "height:52px", "border-radius:50%", "font-size:24px",
		"background:#111", "border:2px solid #e0a100", "cursor:pointer",
		"box-shadow:0 4px 16px rgba(0,0,0,.5)",
	].join(";");
	let panel: HTMLElement | null = null;
	fab.onclick = () => {
		if (!panel) {
			panel = buildPanel();
			document.body.appendChild(panel);
			unloads.add(() => panel?.remove());
		}
		panel.style.display = panel.style.display === "none" ? "block" : "none";
	};
	document.body.appendChild(fab);
	unloads.add(() => fab.remove());
}
