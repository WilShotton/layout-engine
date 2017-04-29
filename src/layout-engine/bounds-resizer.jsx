import React from 'react'
import './bounds-resizer.scss'

const BoundsResizer = ({

    style,
    onResize

}) => {

    return (
        <div {...{
            className: 'bounds-resizer',
            style,
            onMouseDown: onResize
        }} />
    )
}

BoundsResizer.displayName = 'BoundsResizer'

export default BoundsResizer
