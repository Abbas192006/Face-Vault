import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useSearchStore } from '@/stores/search-store'

function ScanMesh() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const startTime = useRef(Date.now())

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000
    const t = Math.min(elapsed / 2, 1)

    if (meshRef.current) {
      meshRef.current.rotation.y = t * Math.PI * 2
      const scale = 1 + Math.sin(t * Math.PI) * 0.2
      meshRef.current.scale.setScalar(scale)
    }

    camera.position.z = THREE.MathUtils.lerp(6, 3.5, t)
    camera.lookAt(0, 0, 0)
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#00F5D4" />
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 2]} />
        <meshBasicMaterial color="#00F5D4" wireframe transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[1.4, 1.45, 64]} />
        <meshBasicMaterial color="#00F5D4" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

function ScanCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
      <color attach="background" args={['#030712']} />
      <ScanMesh />
      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.1} />
        <Vignette darkness={0.8} />
      </EffectComposer>
    </Canvas>
  )
}

export function ScanEffect() {
  const { showScanOverlay, isScanning } = useSearchStore()

  if (!showScanOverlay && !isScanning) return null

  return <ScanOverlay content={<ScanCanvas />} />
}

export function ScanOverlay({ content }: { content?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="relative w-full max-w-lg aspect-square">
        {content ?? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-primary font-label-md tracking-widest uppercase animate-pulse">
              Neural Scan Active
            </p>
          </div>
        )}
        <p className="absolute bottom-4 left-0 right-0 text-center text-on-surface-variant text-sm">
          Analyzing facial embeddings...
        </p>
      </div>
    </div>
  )
}

export function useTheatreScan() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      import('@theatre/studio').then((studio) => {
        studio.default.initialize()
      })
    }
  }, [])
}
