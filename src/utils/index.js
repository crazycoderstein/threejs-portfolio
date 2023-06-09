import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'

import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { TweenMax } from 'gsap'

import rangeRandom from './rangeRandom'

const glist = new Array(5)
let camera, scene, renderer, particles, group, geometry, controls, bloomPass
let gui = null

const params = {
  bloomStrength: 1.5,
  bloomThreshold: 0,
  bloomRadius: 0,
}

let composer

export default class Maps {
  constructor(el, options) {
    this.container = typeof el === 'string' ? document.getElementById(el) : el

    this.width = el.clientWidth
    this.height = el.clientHeight
  }

  setupScene() {
    this.initVariable()

    this.initMainParticles()

    this.initAroundParticles()

    this.initModelGLB()

    this.animate()

    return {
      particles,
    }
  }

  initVariable() {
    scene = new THREE.Scene()

    const canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const context = canvas.getContext('2d')
    const gradient = context.createLinearGradient(0, 0, this.width, 0)
    gradient.addColorStop(0, '#4e22b7')
    gradient.addColorStop(1, '#3292ff')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true

    group = new THREE.Group()
    scene.add(group)

    camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      10,
      100000
    )
    camera.position.set(0, 0, 750)

    renderer = new THREE.WebGLRenderer({})
    renderer.setClearColor(0x05050c)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(this.width, this.height)
    scene.fog = new THREE.FogExp2(0x05050c, 0.0018)
    this.container.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 1))

    this.addBloom()
  }

  initGui() {
    if (gui) return
    gui = new GUI()
    gui.add(params, 'bloomThreshold', 0.0, 1.0).onChange((value) => {
      bloomPass.threshold = Number(value)
    })
    gui.add(params, 'bloomStrength', 0.0, 3.0).onChange((value) => {
      bloomPass.strength = Number(value)
    })
    gui
      .add(params, 'bloomRadius', 0.0, 1.0)
      .step(0.01)
      .onChange((value) => {
        bloomPass.radius = Number(value)
      })
  }

  addBloom() {
    composer = new EffectComposer(renderer)

    let renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    )
    bloomPass.threshold = params.bloomThreshold
    bloomPass.strength = params.bloomStrength
    bloomPass.radius = params.bloomRadius
    composer.addPass(bloomPass)
  }

  initMainParticles() {
    function getTexture(canvasSize = 64) {
      let canvas = document.createElement('canvas')
      canvas.width = canvasSize
      canvas.height = canvasSize
      canvas.style.background = 'transparent'
      let context = canvas.getContext('2d')
      let gradient = context.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 8,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      )
      gradient.addColorStop(0, '#fff')
      gradient.addColorStop(1, 'transparent')
      context.fillStyle = gradient
      context.beginPath()
      context.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        0,
        Math.PI * 2,
        true
      )
      context.fill()
      let texture = new THREE.Texture(canvas)
      texture.needsUpdate = true
      return texture
    }

    geometry = new THREE.Geometry()

    const textureLoader = new THREE.TextureLoader()

    textureLoader.crossOrigin = ''

    const mapDot = textureLoader.load('../images/gradient.png')

    let uniforms = {
      color: {
        type: 'v3',
        value: new THREE.Color(0xffffff),
      },

      texture2: {
        value: getTexture(64),
      },

      val: {
        value: 1.0,
      },
    }

    let shaderMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: `attribute float size;
      attribute vec3 position2;
      uniform float val;
      varying vec3 vColor;
      varying float opacity;
      void main() {
        float border = -150.0;
        float min_border = -160.0;
        float max_opacity = 1.0;
        float min_opacity = 0.03;
        float sizeAdd = 20.0;
  
        vec3 vPos;
  
        vPos.x = position.x * val + position2.x * (1.-val);
        vPos.y = position.y* val + position2.y * (1.-val);
        vPos.z = position.z* val + position2.z * (1.-val);
  
        vec4 mvPosition = modelViewMatrix * vec4( vPos, 1.0 );
        if(mvPosition.z > border){
          opacity = max_opacity;
          gl_PointSize = size;
        }else if(mvPosition.z < min_border){
          opacity = min_opacity;
          gl_PointSize = size + sizeAdd;
        }else{
          float percent = (border - mvPosition.z)/(border - min_border);
          opacity = (1.0-percent) * (max_opacity - min_opacity) + min_opacity;
          gl_PointSize = percent * (sizeAdd) + size;
        }
        float positionY = vPos.y;
        vColor.x = abs(sin(positionY));
        vColor.y = abs(cos(positionY));
        vColor.z = abs(cos(positionY));
        gl_Position = projectionMatrix * mvPosition;
      }`,
      fragmentShader: `uniform vec3 color;
      uniform sampler2D texture2;
      varying vec3 vColor;
      varying float opacity;
      void main() {
        gl_FragColor = vec4(vColor * color, opacity);
        gl_FragColor = gl_FragColor * texture2D( texture2, gl_PointCoord );
      }`,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
    })

    const POINT_LENGTH = 7524,
      POINT_SIZE = 4
    for (let i = 0; i < POINT_LENGTH; i++) {
      const vertex = new THREE.Vector3()
      vertex.x = rangeRandom(window.innerWidth, -window.innerWidth)
      vertex.y = rangeRandom(window.innerHeight, -window.innerHeight)
      vertex.z = rangeRandom(window.innerWidth, -window.innerWidth)
      geometry.vertices.push(vertex)
      geometry.colors.push(new THREE.Color(255, 255, 255))
    }

    const material = new THREE.PointsMaterial({
      size: POINT_SIZE,
      sizeAttenuation: true,
      vertexColors: false,
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      map: mapDot,
    })

    particles = new THREE.Points(geometry, material)
    geometry.name = '变换点组'

    group.add(particles)
  }

  initAroundParticles() {
    const around = new THREE.Geometry()

    const textureLoader = new THREE.TextureLoader()

    textureLoader.crossOrigin = ''

    const mapDot = textureLoader.load('../images/gradient.png')

    const minZVal = window.innerWidth * 1.5
    const minYVal = window.innerHeight * 1.5
    const color = new THREE.Color(255, 255, 255)

    for (let i = 0; i < 200; i++) {
      const vertex = new THREE.Vector3()
      vertex.x = rangeRandom(minZVal, -minZVal)
      vertex.y = rangeRandom(minYVal, -minYVal)
      vertex.z = rangeRandom(minZVal, -minZVal)
      around.vertices.push(vertex)
      around.colors.push(color)
    }

    const aroundMaterial = new THREE.PointsMaterial({
      size: 10,
      sizeAttenuation: true,
      vertexColors: false,
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      map: mapDot,
    })

    const aroundPoints = new THREE.Points(around, aroundMaterial)
    group.add(aroundPoints)

    TweenMax.to(aroundPoints.rotation, 20, {
      y: Math.PI * 2,
      repeat: -1,
    })
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }

  render() {
    geometry.verticesNeedUpdate = true

    renderer.clear()
    composer.render()
  }

  onWindowResize() {
    this.width = this.container.clientWidth
    this.height = this.container.clientHeight

    renderer.setSize(this.width, this.height)
    camera.aspect = this.width / this.height
    camera.updateProjectionMatrix()
  }

  firstAnimation() {
    const baseVal = -Math.PI * 0.6

    return new Promise((resolve) => {
      group.rotation.y = baseVal
      TweenMax.to(group.rotation, 5, {
        y: 0,
        delay: Math.random(),
        onComplete: () => {
          document.addEventListener(
            'mousemove',
            this.onDocumentMouseMove.bind(this),
            false
          )

          this.changeModel(0)
          resolve(true)
        },
      })
    })
  }

  changeModel(index) {
    geometry.vertices.forEach(function (vtx, i) {
      if (!glist[index]?.vertices) return
      const length = glist[index].vertices.length
      const o = glist[index].vertices[i % length]
      TweenMax.to(vtx, 2, {
        x: o.x,
        y: o.y,
        z: o.z,
        delay: Math.random(),
        onStart: () => {},
      })
    })
  }

  onDocumentMouseMove(event) {
    const rotateY = (event.pageX / (window.innerWidth * 30)) * 2 * Math.PI
    const rotateX = (event.pageY / (window.innerHeight * 200)) * 2 * Math.PI

    TweenMax.to(group.rotation, 3, {
      x: rotateX,
      y: rotateY,
    })
    event.preventDefault()
  }

  initModelGLB() {
    const loader = new GLTFLoader()

    loader.load('../models/glb/1game.glb', (gltf) => {
      let geo = new THREE.Geometry().fromBufferGeometry(
        gltf.scene.children[0].geometry
      )
      geo.center()
      geo.normalize()

      geo.scale(500, 500, 500)
      geo.rotateX(Math.PI / 3)
      geo.rotateY(-Math.PI / 8)
      geo.rotateZ(-Math.PI / 6)
      geo.translate(-300, 100, 0)

      glist[0] = geo
    })

    loader.load('../models/glb/2ac.glb', (gltf) => {
      let geo = new THREE.Geometry().fromBufferGeometry(
        gltf.scene.children[0].geometry
      )
      geo.center()
      geo.normalize()

      geo.scale(500, 500, 500)

      geo.rotateY(-Math.PI / 7)
      geo.translate(280, 0, 0)

      glist[1] = geo
    })

    loader.load('../models/glb/3book.glb', (gltf) => {
      let geo = new THREE.Geometry().fromBufferGeometry(
        gltf.scene.children[0].geometry
      )
      geo.center()
      geo.normalize()

      geo.scale(700, 600, 700)

      geo.rotateY(-Math.PI / 10)
      geo.translate(-300, 100, 0)

      glist[2] = geo
    })

    loader.load('../models/glb/4movice.glb', (gltf) => {
      let geo = new THREE.Geometry().fromBufferGeometry(
        gltf.scene.children[0].geometry
      )
      geo.center()
      geo.normalize()

      geo.scale(900, 900, 900)
      geo.rotateX(Math.PI / 2)
      geo.rotateY(0.98 * Math.PI)

      glist[3] = geo
    })

    loader.load('../models/glb/5kv.glb', (gltf) => {
      let geo = new THREE.Geometry().fromBufferGeometry(
        gltf.scene.children[0].geometry
      )
      geo.center()
      geo.normalize()
      geo.scale(800, 800, 800)
      geo.translate(0, -400, 0)
      glist[4] = geo
    })

    loader.load('../models/glb/1game.glb', (gltf) => {
      let geo = new THREE.Geometry().fromBufferGeometry(
        gltf.scene.children[0].geometry
      )
      geo.center()
      geo.normalize()

      geo.scale(500, 500, 500)
      geo.rotateX(Math.PI / 3)
      geo.rotateY(-Math.PI / 8)
      geo.rotateZ(-Math.PI / 6)
      geo.translate(-300, 100, 0)

      glist[0] = geo
    })
  }
}
