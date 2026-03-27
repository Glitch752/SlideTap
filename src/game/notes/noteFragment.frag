uniform vec3 diffuse;
uniform float opacity;

uniform float uv_height;
uniform float uv_top_width;
uniform float uv_bottom_width;

varying vec2 vUv;
void main() {
    // Custom code
    // Fade inward in both x and y to create a constant thickness fade
    float width = mix(uv_bottom_width, uv_top_width, vUv.y / uv_height);
    
    float fadeThickness = 0.4;
    
    float xFade = smoothstep(0.0, fadeThickness, vUv.x) * (1.0 - smoothstep(width - fadeThickness, width, vUv.x));
    // float yFade = smoothstep(0.0, fadeThickness, vUv.y) * (1.0 - smoothstep(uv_height - fadeThickness, uv_height, vUv.y));
    // float fade = min(xFade, yFade);
    // diffuseColor.a *= fade;
    vec3 diffuseColor = vec3(1.0, 1.0, 1.0);
    
    gl_FragColor = vec4(diffuse * diffuseColor, opacity);
}