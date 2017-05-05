import _ from 'lodash'
import React from 'react'
import Rx from 'rxjs/rx'
import RxComponent from '../utils/rx-component'
import Resizer from './resizer'
import './layout-group.scss'


const MIN_MEASURE = 24

export default class LayoutGroup extends RxComponent{

    static defaultProps = {

        bounds: {width: 300, height: 300},
        doc: document
    }

    constructor(props) {

        super(props)

        this.createHandlers(['maximiseContent', 'resizeContent'])
    }

    state = {

        isResizing: false,
        metrics: {}
    }

    componentDidMount() {

        const metrics$ = Rx.Observable
            .merge(

                this.props$
                    .map(({bounds, layout}) => () => {

                        const childHeight = bounds.height / _.size(layout.children)

                        return {values: _.map(layout.children, child => {

                            return {
                                measure: childHeight
                            }
                        })}
                    }),

                this.event('maximiseContent')
                    .withLatestFrom(
                        this.propAsStream('bounds'),
                        ({index}, bounds) => current => {

                            const maxMeasure = bounds.height - ((_.size(current.snapshot) - 1) * MIN_MEASURE)

                            const update = _.map(current.snapshot, (item, i) => {
                                return {
                                    ...item,
                                    measure: i === index ? maxMeasure : MIN_MEASURE,
                                    style: {transition: 'height 200ms'}
                                }
                            })

                            return {snapshot: update, values: update}
                        }
                    ),

                this.event('resizeContent')
                    .map(({index}) => ({values}) => {

                        const update = _.map(values, value => {
                            return {...value, style: {}}
                        })

                        return {snapshot: update, values: update}
                    }),

                this.event('resizeContent')
                    .switchMap(({index, clientX, clientY}) => {

                        const iX = clientX
                        const iY = clientY

                        return Rx.Observable.fromEvent(this.props.doc, 'mousemove')
                            .observeOn(Rx.Scheduler.animationFrame)
                            .takeUntil(Rx.Observable.fromEvent(this.props.doc, 'mouseup'))
                            .map(e => {

                                    return {
                                    index,
                                    x: e.clientX - iX,
                                    y: e.clientY - iY
                                }
                            })
                    })
                    .withLatestFrom(
                        this.propAsStream('bounds'),
                        ({index, x, y}, {width, height}) => ({snapshot, values}) => {

                            const add = (acc, {measure}) => acc + measure

                            const before = _.slice(values, 0, index)

                            const current = {
                                ...values[index],
                                measure: Math.max(
                                    snapshot[index].measure + y,
                                    MIN_MEASURE
                                )
                            }

                            const after = _.slice(values, index + 1)

                            const initialAfterHeight = _.reduce(after, add, 0)
                            const updatedAfterHeight = height - _.reduce(before, add, 0) - current.measure

                            const update = _.concat(before, current, _.map(after, value => {

                                const measure = Math.floor(value.measure  / initialAfterHeight * updatedAfterHeight)

                                return {
                                    ...value,
                                    measure: Math.max(MIN_MEASURE, measure)
                                }
                            }))

                            return {snapshot, values: update}
                        }
                    )
            )
            .scan((acc, update) => update(acc), {})
            .pluck('values')

        const resizeStart$ = this.event('resizeContent')

        const resizeFinish$ = resizeStart$.flatMap(() => {
            return Rx.Observable.fromEvent(this.props.doc, 'mouseup').take(1)
        })

        const isResizing$ = Rx.Observable
            .merge(resizeStart$.mapTo(true), resizeFinish$.mapTo(false))
            .startWith(false)

        const style$ = Rx.Observable
            .combineLatest(
                this.propAsStream('bounds'),
                isResizing$.map(isResizing => {
                    return isResizing
                        ? {
                            userSelect: 'none',
                            overflowY: 'hidden'
                        }
                        : {}
                }),
                (bounds, isResizing) => ({...bounds, ...isResizing})
            )

        this.addDisposables(

            Rx.Observable
                .merge(metrics$.map(metrics => ({metrics})), style$.map(style => ({style})))
                .subscribe(this.stateObserver)
        )
    }

    render() {

        const { bounds, layout } = this.props
        const { style, metrics } = this.state

        return (
            <div className="layout-group" style={style}>

                {_(metrics).chain()
                    .map((metric, index) => {

                        return [
                            React.createElement(layout.children[index].factory, {
                                key: index,
                                style: {
                                    ...metric.style,
                                    height: metric.measure,
                                    width: bounds.width
                                }
                            }),
                            React.createElement(Resizer, {
                                index,
                                key: `resizer-${index}`,
                                onDoubleClick: this.on.maximiseContent,
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

