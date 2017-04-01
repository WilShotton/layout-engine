import _ from 'lodash'
import React from 'react'

export default ({

    layout,
    bounds = {width: 300, height: 300}

}) => {

    const childHeight = bounds.height / _.size(layout.children)

    return (
        <div style={{...bounds, position: 'relative'}}>
            {_.map(layout.children, (child, index) => {

                return React.createElement(child.factory, {
                    key: index,
                    style: {
                        height: childHeight,
                        position: 'absolute',
                        top: childHeight * index,
                        width: bounds.width,
                    }
                })
            })}
        </div>
    )
}
