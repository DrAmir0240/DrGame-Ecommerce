import { redirect } from 'next/navigation';

/**
 * The gamepad tester is a standalone, edge-to-edge application at /gamepad.
 * Keeping this path as a redirect means old links (tool cards, bookmarks,
 * sitemap entries) still work while there is exactly ONE tester experience.
 */
export default function LegacyGamepadToolsPage() {
  redirect('/gamepad');
}
