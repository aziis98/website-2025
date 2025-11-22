varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec2 vUv;

void main() {
    vNormal = normalize(normalMatrix * normal);
    
    // fixed light
    // vWorldNormal = normalize(mat3(modelMatrix) * normal);

    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
