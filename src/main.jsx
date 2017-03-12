import React from 'react'
import ReactDOM from 'react-dom'
import Harness from './harness/harness'

const stage = document.createElement('div')
stage.className = 'stage'
document.body.appendChild(stage)

ReactDOM.render(<Harness />, stage)
