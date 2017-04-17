import React from 'react'
import Rx from 'rxjs/rx'
import LayoutGroup from '../layout-engine/layout-group'
import layout from './layout'

const size$ = Rx.Observable.fromEvent(window, 'resize')
    .debounceTime(30)

const getBounds = target => {

    return {
        height: 600, //target.innerHeight / 2,
        width: target.innerWidth / 2
    }
}

export default React.createClass({

    getInitialState() {

        return {
            bounds: getBounds(window)
        }
    },

    componentWillMount() {

        this.sub = size$.subscribe(e => {

            this.setState({
                bounds: getBounds(e.target)
            })
        })
    },

    componentWillUnmount() {

        this.sub.unsubscribe()
    },

    render() {

        return (
            <div style={{}}>

                <h1>Harness</h1>

                <LayoutGroup {...{
                    bounds: this.state.bounds,
                    layout
                }} />

            </div>
        )
    }
})
