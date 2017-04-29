import React from 'react'
import './resizer.scss'


class Resizer extends React.PureComponent{

    constructor(props) {

        super(props)

        this.onMouseDown = this.onMouseDown.bind(this)
    }

    onMouseDown({clientX, clientY}) {

        this.props.onMouseDown({clientX, clientY, index: this.props.index})
    }

    render() {

        return (
            <div {...{
                className: 'resizer',
                onMouseDown: this.onMouseDown
            }} />
        )
    }
}

Resizer.displayName = 'Resizer'

export default Resizer
