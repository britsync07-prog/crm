declare module "@vpalmisano/virtual-background" {
    export type ProcessVideoTrackOptions = {
        wasmLoaderPath: string;
        wasmBinaryPath: string;
        modelPath: string;
        runWorker: boolean;
        enabled: boolean;
        backgroundUrl: string;
        showStats: boolean;
        borderSmooth: number;
        smoothing: number;
        smoothstepMin: number;
        smoothstepMax: number;
        restartEvery: number;
        bgBlur: number;
        bgBlurRadius: number;
        enableFilters: boolean;
        blur: number;
        brightness: number;
        contrast: number;
        gamma: number;
    };

    export const options: ProcessVideoTrackOptions & {
        backgroundSource?: unknown;
    };

    export function processVideoTrack(
        track: MediaStreamTrack,
        options?: Partial<ProcessVideoTrackOptions>
    ): Promise<MediaStreamTrack>;

    export function updateBackground(url?: string): void;
}
