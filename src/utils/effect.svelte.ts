import { untrack } from "svelte";

/**
 * Creates an effect that doesn't run on mount.
 */
export function _$lazyEffect(deps: () => any[], cb: () => void) {
	let first = true;
	$effect(() => {
        // Svelte is magic because.. what. how?
		deps();
		if(first) {
            first = false;
            return;
        }

		untrack(cb);
	});
}