precision highp float;

uniform vec3 diffuse;
uniform float opacity;

uniform float uv_height;
uniform float uv_top_width;
uniform float uv_bottom_width;

varying vec2 vUv;
varying vec3 vWorldPosition;

float ease(float x) {
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
}
float fade(float edge0, float edge1, float x) {
    return ease(clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0));
}

// Gets a darker, less saturated version of the color for the fade
vec3 adjustFade(vec3 color) {
    // Convert to HSV
    float maxc = max(color.r, max(color.g, color.b));
    float minc = min(color.r, min(color.g, color.b));
    float delta = maxc - minc;
    
    float h = 0.0;
    if (delta > 0.0) {
        if (maxc == color.r) {
            h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
        } else if (maxc == color.g) {
            h = (color.b - color.r) / delta + 2.0;
        } else {
            h = (color.r - color.g) / delta + 4.0;
        }
        h /= 6.0;
    }
    
    float s = maxc == 0.0 ? 0.0 : delta / maxc;
    float v = maxc;

    // Adjust saturation and value for fade
    s *= 0.9; // Reduce saturation
    v *= 0.9; // Reduce brightness

    // Convert back to RGB
    if (s == 0.0) {
        return vec3(v); // gray
    }
    
    h *= 6.0;
    int i = int(floor(h));
    float f = h - float(i);
    float p = v * (1.0 - s);
    float q = v * (1.0 - s * f);
    float t = v * (1.0 - s * (1.0 - f));
    
    if (i == 0) return vec3(v, t, p);
    else if (i == 1) return vec3(q, v, p);
    else if (i == 2) return vec3(p, v, t);
    else if (i == 3) return vec3(p, q, v);
    else if (i == 4) return vec3(t, p, v);
    else return vec3(v, p, q);
}

void main() {
    // Custom code
    // Fade inward in both x and y to create a constant thickness fade
    float width = mix(uv_bottom_width, uv_top_width, vUv.y / uv_height);
    
    float xFadeThickness = 80. / width;
    float yFadeThickness = 0.08;
    
    float xFade =
        fade(0.0, xFadeThickness, vUv.x) *
        (1.0 - fade(1.0 - xFadeThickness, 1.0, vUv.x));
    float yFade =
        fade(0.0, yFadeThickness, vUv.y) *
        (1.0 - fade(uv_height - yFadeThickness, uv_height, vUv.y));
    float fadeVal = xFade * yFade;

    // Sketchy corner fade
    if(xFade * yFade < 0.0001) discard;

    // Fade as approaching the origin on the xz plane
    float distanceFromOrigin = length(vWorldPosition.xz);
    float distanceFade = fade(0.0, 80.0, distanceFromOrigin);

    float finalOpacity = opacity * distanceFade;
    finalOpacity *= 1. - fadeVal * 0.2;
    finalOpacity *= 1. - vUv.y / uv_height * 0.6;

    vec3 darkDiffuse = adjustFade(diffuse);
    float fadeMix = step(0.01, fadeVal);
    gl_FragColor = vec4(
        mix(diffuse, darkDiffuse, fadeMix),
        mix(opacity * distanceFade, finalOpacity, fadeMix)
    );
}