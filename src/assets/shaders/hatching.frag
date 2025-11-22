uniform vec3 uInkColor;
uniform vec3 uPaperColor;
uniform vec3 uLightDir;

// Style Uniforms
uniform float uPitch;
uniform float uHatchThickness;
uniform float uHatchAngle; // In degrees
uniform float uShadowThreshold;
uniform float uShadowDensity; // New parameter for multi-level hatching

varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec2 vUv;

// Rotate logic for hatching angle
vec2 rotate(vec2 v, float a) {
    float s = sin(radians(a));
    float c = cos(radians(a));
    mat2 m = mat2(c, -s, s, c);
    return m * v;
}

// Pseudo-random noise
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    // Fixed Light
    // float NdotL = dot(vWorldNormal, normalize(uLightDir));
    
    // 1. Lighting Calculation (Lambert)
    float NdotL = dot(vNormal, normalize(uLightDir));
    float intensity = NdotL * 0.5 + 0.5; // Remap to 0.0 - 1.0

    // 2. Hatching Algorithm (Screen Space)
    vec2 rotCoord = rotate(gl_FragCoord.xy, uHatchAngle);
    
    // Level 1: Diagonal
    float hatch1 = mod(rotCoord.y, uPitch);
    
    // Level 2: Perpendicular (Cross)
    float hatch2 = mod(rotCoord.x, uPitch);

    // Level 3: Vertical (relative to screen, not rotated) for deep shadows
    float hatch3 = mod(gl_FragCoord.x, uPitch * 0.8); // Slightly tighter pitch
    
    // 3. Tonal Logic
    vec3 finalColor = uPaperColor;

    // Thresholds derived from density parameter
    // Spread the shadow levels based on density
    float t1 = uShadowThreshold;
    float t2 = uShadowThreshold * (1.0 - (0.3 * uShadowDensity));
    float t3 = uShadowThreshold * (1.0 - (0.7 * uShadowDensity));

    // Deepest Shadow (Triple Hatch)
    if (intensity < t3) {
        if (hatch1 < uHatchThickness || hatch2 < uHatchThickness || hatch3 < uHatchThickness) {
            finalColor = uInkColor;
        }
    }
    // Mid Shadow (Cross Hatch)
    else if (intensity < t2) {
        if (hatch1 < uHatchThickness || hatch2 < uHatchThickness) {
            finalColor = uInkColor;
        }
    }
    // Light Shadow (Single Hatch)
    else if (intensity < t1) {
        if (hatch1 < uHatchThickness) {
            finalColor = uInkColor;
        }
    }
    // Highlight (Paper)
    else {
        finalColor = uPaperColor;
    }

    // 4. Paper Grain
    float noise = random(gl_FragCoord.xy / 3.0);
    if (finalColor == uPaperColor) {
            finalColor -= vec3(0.03 * noise); 
    }

    gl_FragColor = vec4(finalColor, 1.0);
}




