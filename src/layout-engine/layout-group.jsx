import _ from 'lodash'
import React from 'react'
import Rx from 'rxjs/rx'
import RxComponent from '../utils/rx-component'
import Maximiser from './maximiser'
import Resizer from './resizer'
import './layout-group.scss'


const MIN_MEASURE = 24

export default class LayoutGroup extends RxComponent{

    static propTypes = {
        bounds: React.PropTypes.object,
        doc: React.PropTypes.object,
        layout: React.PropTypes.shape({
            layout: React.PropTypes.oneOf(['vertical', 'horizontal']).isRequired,
            children: React.PropTypes.arrayOf(React.PropTypes.shape({
                factory: React.PropTypes.func.isRequired
            })).isRequired
        }).isRequired
    }

    static defaultProps = {

        bounds: {width: 200, height: 200},
        doc: document
    }

    displayName = 'LayoutGroup'

    constructor(props) {

        super(props)

        this.createHandlers(['maximiseContent', 'resizeContent'])
    }

    state = {

        isResizing: false,
        metrics: {}
    }

    componentDidMount() {

        const measure$ = this.propAsStream('bounds')
            .map(bounds => {

                if (this.props.layout.layout === 'vertical') {
                    return bounds.height
                }

                return bounds.width
            })
            .publishReplay(1)
            .refCount()

        const eventToMeasure = ({clientX, clientY}) => {

            if (this.props.layout.layout === 'vertical') {
                return clientY
            }

            return clientX
        }

        const metrics$ = Rx.Observable
            .merge(

                Rx.Observable
                    .combineLatest(
                        measure$,
                        this.propAsStream('layout'),
                        (measure, layout) => () => {

                            const childMeasure = measure / _.size(layout.children)

                            return {values: _.map(layout.children, child => {

                                return {
                                    measure: childMeasure
                                }
                            })}
                        }
                    ),

                this.event('maximiseContent')
                    .withLatestFrom(
                        measure$,
                        ({index}, measure) => current => {

                            const maxMeasure = measure - ((_.size(current.values) - 1) * MIN_MEASURE)

                            const update = _.map(current.values, (item, i) => {
                                return {
                                    ...item,
                                    measure: i === index ? maxMeasure : MIN_MEASURE,
                                    style: {transition: 'width 200ms, height 200ms'}
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
                    .map(e => {

                        return {index: e.index, iM: eventToMeasure(e)}
                    })
                    .switchMap(({index, iM}) => {

                        return Rx.Observable.fromEvent(this.props.doc, 'mousemove')
                            .observeOn(Rx.Scheduler.animationFrame)
                            .takeUntil(Rx.Observable.fromEvent(this.props.doc, 'mouseup'))
                            .map(e => {

                                return {
                                    index,
                                    delta: eventToMeasure(e) - iM
                                }
                            })
                    })
                    .withLatestFrom(
                        measure$,
                        ({index, delta}, measure) => ({snapshot, values}) => {

                            const add = (acc, {measure}) => acc + measure

                            const before = _.slice(values, 0, index)

                            const after = _.slice(values, index + 1)

                            const beforeMeasure = _.reduce(before, add, 0)

                            const maxMeasure = measure - beforeMeasure - (_.size(after) * MIN_MEASURE)

                            const current = {
                                ...values[index],
                                measure: _.clamp(
                                    snapshot[index].measure + delta,
                                    MIN_MEASURE,
                                    maxMeasure
                                )
                            }

                            const initialAfterMeasure = _.reduce(after, add, 0)
                            const updatedAfterMeasure = measure - beforeMeasure - current.measure

                            const update = _.concat(before, current, _.map(after, value => {

                                const measure = Math.floor(value.measure  / initialAfterMeasure * updatedAfterMeasure)

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
                        ? {userSelect: 'none'}
                        : {}
                }),
                (bounds, isResizing) => ({...bounds, ...isResizing})
            )

        this.addDisposables(

            this.event('resizeContent')
                .subscribe(() => this.props.doc.getSelection().removeAllRanges()),

            Rx.Observable
                .merge(metrics$.map(metrics => ({metrics})), style$.map(style => ({style})))
                .subscribe(this.stateObserver)
        )
    }

    render() {

        const { layout } = this.props
        const { style, metrics } = this.state

        return (
            <div className={`layout-group ${layout.layout}`} style={style}>

                {_(metrics).chain()
                    .map((metric, index) => {

                        return [
                            React.createElement(Maximiser, {
                                className: layout.layout,
                                index,
                                key: `maximiser-${index}`,
                                style: {
                                    width: layout.layout === 'vertical'
                                        ? style.width
                                        : metric.measure
                                },
                                onDoubleClick: this.on.maximiseContent
                            }),
                            React.createElement(layout.children[index].factory, {
                                ...layout.children[index].props,
                                key: index,
                                style: layout.layout === 'vertical'
                                    ? {
                                        ...metric.style,
                                        height: metric.measure,
                                        width: style.width
                                    }
                                    : {
                                        ...metric.style,
                                        height: style.height,
                                        width: metric.measure
                                    }
                            }),
                            React.createElement(Resizer, {
                                className: layout.layout,
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

