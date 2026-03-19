import { untrack } from "svelte";

/**
 * Creates an effect that doesn't run on mount.
 */
export function _$lazyEffect(deps: () => any[], cb: () => void) {
	let first = true;
	_$explicitEffect(deps, () => {
		if(first) {
            first = false;
            return;
        }

		cb();
	});
}

/**
 * Creates an effect that doesn't track dependencies - provide dependencies as the first argument.
 */
export function _$explicitEffect(deps: () => any[], cb: () => void) {
	$effect(() => {
		deps();
		untrack(cb);
	});
}

/**
 * Creates an effect that is debounced by the given delay (default 100ms).
 * The effect will run after the dependencies have stopped changing for the given delay.
 */
export function _$debouncedEffect(deps: () => any[], cb: () => void, delay = 100) {
	let timeout: NodeJS.Timeout | null = null;
	_$explicitEffect(deps, () => {
		if(timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			cb();
		}, delay);
	});
}