import React from 'react'
import './bounds-resizer.scss'

export default ({

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
