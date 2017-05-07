import React from 'react'
import './resizer.scss'


export default class Resizer extends React.PureComponent {

    displayName = 'Resizer'

    onDoubleClick = () => {

        this.props.onDoubleClick({index: this.props.index})
    }

    onMouseDown = ({clientX, clientY}) => {

        this.props.onMouseDown({clientX, clientY, index: this.props.index})
    }

    render() {

        return (
            <div {...{
                className: `resizer ${this.props.className}`,
                onDoubleClick: this.onDoubleClick,
                onMouseDown: this.onMouseDown
            }} />
        )
    }
}
