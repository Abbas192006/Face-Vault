import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

function ScanningRing() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime()
      ref.current.rotation.z = t * 0.3
      ref.current.rotation.x = Math.sin(t * 0.4) * 0.2
      const s = 1 + Math.sin(t * 1.5) * 0.1
      ref.current.scale.setScalar(s)
    }
  })

  return (
    <mesh ref={ref}>
      <ringGeometry args={[1.8, 1.84, 128]} />
      <meshBasicMaterial color="#00F5D4" transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  )
}

function WireframeIcosahedron() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta * 0.15
      ref.current.rotation.y -= delta * 0.2
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshBasicMaterial color="#00F5D4" wireframe transparent opacity={0.35} />
      </mesh>
    </Float>
  )
}

function ParticleSphere() {
  const ref = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const points = new Float32Array(4000 * 3)
    for (let i = 0; i < 4000; i++) {
      const r = 2 * Math.cbrt(Math.random())
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      points[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      points[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      points[i * 3 + 2] = r * Math.cos(phi)
    }
    return points
  }, [])

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.012} color="#00F5D4" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#030712']} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#00F5D4" />
      <pointLight position={[-10, -5, -5]} intensity={0.4} color="#00BBF9" />
      <Stars radius={80} depth={40} count={3000} factor={3} saturation={0} fade speed={0.5} />
      <ParticleSphere />
      <WireframeIcosahedron />
      <ScanningRing />
      <EffectComposer>
        <Bloom intensity={0.8} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
        <Vignette offset={0.3} darkness={0.7} blendFunction={BlendFunction.NORMAL} />
        <ChromaticAberration offset={new THREE.Vector2(0.0008, 0.0008)} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    </>
  )
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 w-full h-full -z-20 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 1.5]}>
        <SceneContent />
      </Canvas>
    </div>
  )
}
