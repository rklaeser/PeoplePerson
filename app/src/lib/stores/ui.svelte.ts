/**
 * UI Store - Manages app-wide UI state
 * Uses Svelte 5 runes for reactivity and localStorage for persistence
 */

import { browser } from '$app/environment';

type ViewMode = 'list' | 'table' | 'map';
type AssistantName = 'Scout' | 'Nico';

interface DefaultLocation {
	city: string;
	state: string;
	lat: number;
	lng: number;
}

interface UIState {
	sidebarCollapsed: boolean;
	rightPanelWidth: number;
	theme: 'light' | 'dark' | 'system';
	viewMode: ViewMode;
	chatPanelOpen: boolean;
	hamburgerMenuOpen: boolean;
	defaultLocation?: DefaultLocation;
	assistantName: AssistantName;
}

const STORAGE_KEY = 'peopleperson-ui-store';

function loadFromStorage(): Partial<UIState> {
	if (!browser) return {};

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch {
		return {};
	}
}

function saveToStorage(state: Partial<UIState>) {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		console.error('Failed to save UI state:', e);
	}
}

class UIStore {
	// Load initial state from localStorage
	private initialState: UIState = {
		sidebarCollapsed: false,
		rightPanelWidth: 400,
		theme: 'system',
		viewMode: 'list',
		chatPanelOpen: false,
		hamburgerMenuOpen: false,
		assistantName: 'Scout',
		...loadFromStorage()
	};

	// Reactive state
	sidebarCollapsed = $state(this.initialState.sidebarCollapsed);
	rightPanelWidth = $state(this.initialState.rightPanelWidth);
	theme = $state(this.initialState.theme);
	viewMode = $state(this.initialState.viewMode);
	chatPanelOpen = $state(this.initialState.chatPanelOpen);
	hamburgerMenuOpen = $state(this.initialState.hamburgerMenuOpen);
	defaultLocation = $state(this.initialState.defaultLocation);
	assistantName = $state(this.initialState.assistantName);

	// Persist state changes
	private persist() {
		saveToStorage({
			sidebarCollapsed: this.sidebarCollapsed,
			rightPanelWidth: this.rightPanelWidth,
			theme: this.theme,
			viewMode: this.viewMode,
			defaultLocation: this.defaultLocation,
			assistantName: this.assistantName
		});
	}

	// Actions
	setSidebarCollapsed(collapsed: boolean) {
		this.sidebarCollapsed = collapsed;
		this.persist();
	}

	toggleSidebar() {
		this.sidebarCollapsed = !this.sidebarCollapsed;
		this.persist();
	}

	setRightPanelWidth(width: number) {
		this.rightPanelWidth = Math.max(300, Math.min(600, width));
		this.persist();
	}

	setTheme(theme: 'light' | 'dark' | 'system') {
		this.theme = theme;
		this.persist();
	}

	setViewMode(mode: ViewMode) {
		this.viewMode = mode;
		this.persist();
	}

	setChatPanelOpen(open: boolean) {
		this.chatPanelOpen = open;
	}

	toggleChatPanel() {
		this.chatPanelOpen = !this.chatPanelOpen;
	}

	setHamburgerMenuOpen(open: boolean) {
		this.hamburgerMenuOpen = open;
	}

	toggleHamburgerMenu() {
		this.hamburgerMenuOpen = !this.hamburgerMenuOpen;
	}

	setDefaultLocation(location: DefaultLocation | undefined) {
		this.defaultLocation = location;
		this.persist();
	}

	setAssistantName(name: AssistantName) {
		this.assistantName = name;
		this.persist();
	}
}

export const uiStore = new UIStore();
