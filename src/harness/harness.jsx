import React from 'react'
import Rx from 'rxjs/rx'
import LayoutGroup from '../layout-engine/layout-group'
import HorizontalLayout from './horizontal-layout'
import VerticalLayout from './vertical-layout'

const size$ = Rx.Observable.fromEvent(window, 'resize')
    .debounceTime(30)

const getBounds = target => {

    return {
        height: 300, //target.innerHeight / 2,
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

                <h3>Horizontal</h3>

                <LayoutGroup {...{
                    bounds: this.state.bounds,
                    layout: HorizontalLayout
                }} />

                <h3>Vertical</h3>

                <LayoutGroup {...{
                    bounds: this.state.bounds,
                    layout: VerticalLayout
                }} />

            </div>
        )
    }
})
