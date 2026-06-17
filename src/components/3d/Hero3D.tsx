"use client"

import { Suspense, useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Float, MeshTransmissionMaterial, Environment } from "@react-three/drei"
import { useRef } from "react"
import type { Mesh } from "three"
import ErrorBoundary from "@/components/ErrorBoundary"

function FloatingDonut() {
  const meshRef = useRef<Mesh>(null)
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} rotation={[0.4, 0.2, 0]}>
        <torusGeometry args={[1, 0.4, 32, 64]} />
        <MeshTransmissionMaterial backside thickness={0.5} roughness={0.1} metalness={0.1} ior={1.5} chromaticAberration={0.3} color="#C97B4A" />
      </mesh>
    </Float>
  )
}

function FloatingCup() {
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh position={[2.5, -0.5, -1]} rotation={[0.2, -0.3, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 1.2, 32]} />
        <MeshTransmissionMaterial backside thickness={0.3} roughness={0.05} metalness={0.05} ior={1.4} chromaticAberration={0.2} color="#A8643A" />
      </mesh>
    </Float>
  )
}

function FloatingPizza() {
  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh position={[-2.5, -0.3, -1.5]} rotation={[0.8, 0.1, 0]}>
        <torusGeometry args={[0.9, 0.15, 16, 32]} />
        <MeshTransmissionMaterial backside thickness={0.2} roughness={0.2} metalness={0.05} ior={1.3} chromaticAberration={0.1} color="#dc2626" />
      </mesh>
    </Float>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <FloatingDonut />
      <FloatingCup />
      <FloatingPizza />
      <Environment preset="sunset" />
    </>
  )
}

function FallbackScene() {
  return <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#1a0e05] to-[#2d1606]" />
}

export default function Hero3D() {
  const [webglSupported, setWebglSupported] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      if (!gl) setWebglSupported(false)
    } catch {
      setWebglSupported(false)
    }
  }, [])

  if (!webglSupported) return <FallbackScene />

  return (
    <ErrorBoundary fallback={<FallbackScene />}>
      <div className="absolute inset-0 -z-10">
        <Suspense fallback={null}>
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}
