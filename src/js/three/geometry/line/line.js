const THREE = require('three')
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { square_size, numOfMapLayers } from '../../../utils/hand-made-data'

import { map_3d, data_cansat } from '../../../utils/cansat-data'
import scene from '../../environment/scene/scene'

const label_rotate = document.querySelector('#rotate-value')

let icon = ''
let image_in_image_data = []
let rotate_data = []
map_3d()
  .then(resp => {
    image_in_image_data = [...resp]
  })
  .then(() => {
    data_cansat().then(resp => {
      rotate_data = [...resp.map(el => el.rot)]
      console.log('rot data', rotate_data)
    })
  })
  .then(() => {
    const icon_loader = new GLTFLoader()
    icon_loader.load(
      '../../../../assets/3d/cansat_icon.glb',
      resp => {
        icon = resp.scene
        icon.scale.set(0.005, 0.005, 0.005)
      },
      null,
      err => {
        icon_loader.load('assets/3d/cansat_icon.glb', resp => {
          icon = resp.scene
          icon.scale.set(0.005, 0.005, 0.005)
        })
      }
    )

    const input = document.getElementById('time-input')
    const layers_coord = []

    const geometryLine = new THREE.Geometry()
    const material_line = new THREE.LineBasicMaterial({
      color: 0xff435f,
      linewidth: 3
    })

    for (let i = 0; i < image_in_image_data.length - 1; i++) {
      const x = image_in_image_data[i][0]
      const y = image_in_image_data[i][1]
      const size_curent = image_in_image_data[i][2]
      const size_next =
        size_curent *
        (image_in_image_data[i + 1][3] / image_in_image_data[i][3])

      const vec_x =
        (square_size * (x + size_next / 2)) / size_curent - square_size / 2
      const vec_y =
        (square_size * (y + size_next / 2)) / size_curent - square_size / 2

      const vec_z = -1 * (square_size / 2) * (i + 1)

      geometryLine.vertices.push(new THREE.Vector3(vec_x, vec_z, vec_y))
      layers_coord.push([vec_x, vec_z, vec_y, `layer-${i}`])
    }

    geometryLine.vertices.push(
      new THREE.Vector3(
        0,
        -1 * (square_size / 2) * image_in_image_data.length,
        0
      )
    )
    layers_coord.push([
      0,
      -1 * (square_size / 2) * image_in_image_data.length,
      0
    ])

    const line = new THREE.Line(geometryLine, material_line)

    const material_cube = new THREE.MeshStandardMaterial({
      color: '#ff435f'
    })
    const geometry_cube = new THREE.BoxGeometry(0.35, 0.35, 0.35)

    input.addEventListener('input', e => {
      const objectToRemove = scene.getObjectByName('falling_probe')
      scene.remove(objectToRemove)

      const cube = icon ? icon : new THREE.Mesh(geometry_cube, material_cube)

      const cube_z =
        -1 * (square_size / 2) * numOfMapLayers +
        ((input.max - e.target.value) *
          (square_size / 2) *
          (numOfMapLayers - 1)) /
          input.max

      //find the closer z
      let part_of_map = layers_coord.length - 1
      for (let i = 0; i < layers_coord.length - 1; i++) {
        if (cube_z < layers_coord[i][1] && cube_z > layers_coord[i + 1][1]) {
          part_of_map = i
          break
        }
      }

      const distanceFromHigherLayer = layers_coord[part_of_map][1] - cube_z
      const heightOfLayer =
        layers_coord[part_of_map][1] - layers_coord[part_of_map + 1][1]

      const y_differ =
        layers_coord[part_of_map][2] - layers_coord[part_of_map + 1][2]
      const x_differ =
        layers_coord[part_of_map][0] - layers_coord[part_of_map + 1][0]

      // compute from proportions
      const cube_x =
        layers_coord[part_of_map][0] -
        (distanceFromHigherLayer * x_differ) / heightOfLayer

      const cube_y =
        layers_coord[part_of_map][2] -
        (distanceFromHigherLayer * y_differ) / heightOfLayer

      cube.position.set(cube_x, cube_z, cube_y)
      const { _x, _y, _z } = rotate_data[e.target.value]
      cube.rotation.x = _x * (Math.PI / 180)
      cube.rotation.y = _y * (Math.PI / 180)
      cube.rotation.z = _z * (Math.PI / 180)
      console.log(_x, _y, _z)
      label_rotate.textContent = `CanSat rotation| x: ${_x}° y: ${_y}° z: ${_z}°`
      cube.name = 'falling_probe'
      scene.add(cube)
    })

    scene.add(line)
  })
