uniform float uThickness;

void main() {
    // Inverted Hull: push vertex out along normal
    vec3 newPos = position + normal * uThickness;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}
