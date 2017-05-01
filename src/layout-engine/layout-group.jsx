import _ from 'lodash'
import React from 'react'
import Rx from 'rxjs/rx'
import RxComponent from '../utils/rx-component'
import BoundsResizer from './bounds-resizer'
import Resizer from './resizer'
import './layout-group.scss'

const MIN_MEASURE = 24

class LayoutGroup extends RxComponent{

    constructor(props) {

        super(props)

        this.createHandlers(['resizeContent', 'resizeBounds'])

        this.state = {
            bounds: {},
            isResizing: false,
            metrics: {}
        }
    }

    componentDidMount() {

        const bounds$ = Rx.Observable
            .merge(

                this.propAsStream('bounds')
                    .map(bounds => () => {

                        return {snapshot: bounds, bounds}
                    }),

                this.event('resizeBounds')
                    .map(() => current => {

                        return {...current, snapshot: current.bounds}
                    }),

                this.event('resizeBounds')
                    .switchMap(({iX, iY}) => {

                        return Rx.Observable.fromEvent(document, 'mousemove')
                            .observeOn(Rx.Scheduler.animationFrame)
                            .takeUntil(Rx.Observable.fromEvent(document, 'mouseup'))
                            .map(e => {

                                return {
                                    dX: e.clientX - iX,
                                    dY: e.clientY - iY
                                }
                            })
                    })
                    .map(update => current => {

                        return {...current, bounds: {...current.bounds, ..._.pickBy({
                            width: Math.max(
                                current.snapshot.width + update.dX,
                                MIN_MEASURE
                            ),
                            height: Math.max(
                                current.snapshot.height + update.dY,
                                MIN_MEASURE
                            )
                        }, _.isFinite)}}
                    })

            )
            .scan((acc, update) => update(acc), {})
            .pluck('bounds')
            .map(bounds => ({bounds}))

        const metrics$ = Rx.Observable
            .merge(

                this.props$
                    .map(({bounds, layout}) => () => {

                    console.log('bounds', bounds)

                        const childHeight = bounds.height / _.size(layout.children)

                        return {values: _.map(layout.children, child => {

                            return {
                                measure: childHeight
                            }
                        })}
                    }),

                this.event('resizeContent')
                    .map(({index}) => ({values}) => {

                        return {snapshot:_.map(values, value => ({...value})), values}
                    }),

                this.event('resizeContent')
                    .switchMap(({index, clientX, clientY}) => {

                        const iX = clientX
                        const iY = clientY

                        return Rx.Observable.fromEvent(document, 'mousemove')
                            .observeOn(Rx.Scheduler.animationFrame)
                            .takeUntil(Rx.Observable.fromEvent(document, 'mouseup'))
                            .map(e => {

                                    return {
                                    index,
                                    x: e.clientX - iX,
                                    y: e.clientY - iY
                                }
                            })
                    })
                    .do(() => {

                        const min = 20
                        const items = [40, 80, 10]
                        const total = 100


                        const add = (a, b) => a + b


                        const freeItems = _.filter(items, item => item > min)
                        const freeItemCount = _.size(freeItems)
                        const freeItemTotal = _.reduce(freeItems, add, 0)

                        const fixed = (_.size(items) - freeItemCount) * min

                        const outstanding = total - fixed

                        const out = _.map(items, item => {

                            return Math.max(min, item / freeItemTotal * outstanding)
                        })

                        
                    })
                    .map(({index, x, y}) => ({snapshot, values}) => {

                        const sliced = _.slice(values, index + 1)
                        console.log('sliced', sliced)

                        const totalHeight = _.reduce(sliced, (acc, {measure}) => {

                            return acc + measure

                        }, 0)

                        // const AAA = _.filter(values, v => v.measure === MIN_MEASURE)
                        //
                        // console.log('totalHeight', totalHeight)
                        //
                        // const totalHeight2 = (totalHeight - (_.size(AAA) * MIN_MEASURE))
                        //
                        // console.log('totalHeight2', totalHeight2)
                        //
                        // // const totalHeight3 = totalHeight2 <= 0
                        // //     ? totalHeight
                        // //     : totalHeight2


                        console.log(' ')

                        const targetMeasure = Math.max(
                            snapshot[index].measure + y,
                            MIN_MEASURE
                        )

                        return {
                            snapshot,
                            values: _.map(values, (value, i) => {

                                if (i < index || targetMeasure === MIN_MEASURE) {
                                    return value
                                }

                                if (i === index) {

                                    return {
                                        ...value,
                                        measure: targetMeasure
                                    }
                                }

                                const pc = value.measure / totalHeight

                                // console.log('pc', pc)
                                console.log('pc', (snapshot[i].measure - (y * pc)))

                                return {
                                    ...value,
                                    measure: Math.max(
                                        snapshot[i].measure - (y * pc),
                                        // snapshot[i].measure - offset,
                                        MIN_MEASURE
                                    )
                                }
                            })
                        }
                    })
            )
            .scan((acc, update) => update(acc), {})
            .pluck('values')
            .map(metrics => ({metrics}))

        const resizeStart$ = Rx.Observable.merge(
            this.event('resizeContent'),
            this.event('resizeBounds')
        )

        const resizeFinish$ = resizeStart$.flatMap(() => {
            return Rx.Observable.fromEvent(document, 'mouseup').take(1)
        })

        const isResizing$ = Rx.Observable
            .merge(resizeStart$.mapTo(true), resizeFinish$.mapTo(false))
            .startWith(false)
            .map(isResizing => ({isResizing}))

        this.addDisposables(

            bounds$.subscribe(this.stateObserver),
            isResizing$.subscribe(this.stateObserver),
            metrics$.subscribe(this.stateObserver)
        )
    }

    render() {

        const { layout } = this.props

        const { bounds, isResizing, metrics } = this.state

        return (
            <div className="layout-group" style={{
                ...bounds,
                userSelect: isResizing ? 'none' : 'auto'
            }}>

                {_(metrics).chain()
                    .map((metric, index) => {

                        return [
                            React.createElement(layout.children[index].factory, {
                                key: index,
                                style: {
                                    height: metric.measure,
                                    width: bounds.width
                                }
                            }),
                            React.createElement(Resizer, {
                                index,
                                key: `resizer-${index}`,
                                onMouseDown: this.on.resizeContent
                            })
                        ]
                    })
                    .flatten()
                    .initial()
                    .value()
                }

            </div>
        )
    }
}

LayoutGroup.defaultProps = {

    bounds: {width: 300, height: 300}
}

export default LayoutGroup

// <BoundsResizer {...{
//     style: {bottom: 6, right: 0, top: 0, width: 6},
//     onResize: e => this.on.resizeBounds({iX: e.clientX})
// }}/>
//
// <BoundsResizer {...{
//     style: {top: (bounds.height || 0) - 6, right: 6, left: 0, height: 6},
//     onResize: e => this.on.resizeBounds({iY: e.clientY})
// }}/>
