/**
 * RenderSettings — Centralized configuration for shadow and performance optics.
 */
export const RenderSettings = {
    // Shadow Atlas Config
    shadows: {
        enabled: true,
        resolution: 512, 
        type: 'PCFSoft', 
        autoUpdate: false, // Manual throttling for performance
        updateInterval: 64, // ms
        
        // Shadow Camera Frustum (Area around player where shadows are active)
        camera: {
            size: 30, // Optimized to cover immediate area efficiently
            near: 1,
            far: 180
        }
    },

    // Object-specific shadow policy
    policy: {
        cast: {
            buildings: true,
            player: true,
            enemies: true,
            vehicles: true,
            props: false,      // Small props won't cast shadows
            lights: false,     // Street lamps won't cast shadows
            vegetation: true,  // Trees/bushes
            ground: false,     // Ground should never cast
            atmospheric: false // Plane/clouds shouldn't cast high-perf shadows
        },
        receive: {
            buildings: true,
            ground: true,
            player: true,
            enemies: true,
            vehicles: true,
            props: true
        }
    },

    // Overall graphics quality
    quality: {
        pixelRatio: Math.min(window.devicePixelRatio, 1.5), // Cap at 1.5 for performance
        antialias: true
    }
};
